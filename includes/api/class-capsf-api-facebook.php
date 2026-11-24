<?php
/**
 * Captain Social Feed - Facebook API
 *
 * Uses the Facebook Graph API via a Page Access Token + Page ID to fetch
 * a Facebook Page's public posts.
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Facebook' ) ) {

	/**
	 * Facebook Graph API client.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Facebook extends Capsf_Api_Base {

		/**
		 * Graph API version + base URL.
		 *
		 * @var string
		 */
		private $base = '';

		/**
		 * Build the (filterable) versioned Graph API base URL.
		 * Meta retires each version ~2 years after the next one ships (v19.0 ended May 2026).
		 */
		public function __construct() {
			$version    = (string) apply_filters( 'capsf_facebook_graph_version', 'v25.0' );
			$version    = preg_match( '/^v[0-9]{1,2}\.[0-9]$/', $version ) ? $version : 'v25.0';
			$this->base = 'https://graph.facebook.com/' . $version . '/';
		}

		/**
		 * Platform key.
		 *
		 * @var string
		 */
		protected $platform = 'facebook';

		/**
		 * Test the stored credentials against the live API.
		 *
		 * @param array $settings Feed connection settings.
		 * @return array { success: bool, message: string }
		 */
		public function test_connection( $settings ) {
			$token   = ! empty( $settings['access_token'] ) ? self::sanitize_token( $settings['access_token'] ) : '';
			$page_id = ! empty( $settings['page_id'] ) ? sanitize_text_field( $settings['page_id'] ) : '';

			if ( empty( $token ) || empty( $page_id ) ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Please enter both the Page Access Token and the Facebook Page ID.', 'captain-social-feed' ),
				);
			}

			$url  = $this->base . rawurlencode( $page_id ) . '?fields=id,name';
			$data = $this->remote_get_json_with_token( $url, $token );

			if ( is_wp_error( $data ) ) {
				return array(
					'success' => false,
					'message' => $data->get_error_message(),
				);
			}

			$name = ! empty( $data['name'] ) ? sanitize_text_field( $data['name'] ) : '';
			return array(
				'success' => true,
				/* translators: %s: Facebook Page name. */
				'message' => $name ? sprintf( __( 'Connected successfully to "%s".', 'captain-social-feed' ), $name ) : esc_html__( 'Connected successfully.', 'captain-social-feed' ),
			);
		}

		/**
		 * Fetch normalized posts (see Capsf_Api_Base for the shape).
		 *
		 * @param array $settings Feed connection settings.
		 * @param int   $limit    Max number of posts.
		 * @return array|WP_Error
		 */
		public function fetch_posts( $settings, $limit = 12 ) {
			$token   = ! empty( $settings['access_token'] ) ? self::sanitize_token( $settings['access_token'] ) : '';
			$page_id = ! empty( $settings['page_id'] ) ? sanitize_text_field( $settings['page_id'] ) : '';

			if ( empty( $token ) || empty( $page_id ) ) {
				return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Facebook Access Token or Page ID is missing.', 'captain-social-feed' ) );
			}

			$fields = 'id,message,full_picture,permalink_url,created_time,from{name,picture{url}},reactions.summary(true).limit(0),comments.summary(true).limit(0),shares,attachments{media_type,media,url,subattachments.limit(10){media_type,media}}';
			$url    = $this->base . rawurlencode( $page_id ) . '/posts?fields=' . $fields . '&limit=' . absint( $limit );
			$data   = $this->remote_get_json_with_token( $url, $token );

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			if ( empty( $data['data'] ) || ! is_array( $data['data'] ) ) {
				return array();
			}

			// Page name + profile picture for the card header. Posts often come
			// back without "from", so read them from the Page itself (optional -
			// a failure just falls back to the initial-letter avatar).
			$page_name   = '';
			$page_avatar = '';
			$page        = $this->remote_get_json_with_token( $this->base . rawurlencode( $page_id ) . '?fields=name,picture.type(large){url}', $token );
			if ( ! is_wp_error( $page ) ) {
				$page_name   = ! empty( $page['name'] ) ? sanitize_text_field( $page['name'] ) : '';
				$page_avatar = ! empty( $page['picture']['data']['url'] ) ? esc_url_raw( $page['picture']['data']['url'] ) : '';
			}

			$posts = array();
			foreach ( $data['data'] as $item ) {
				$type      = 'image';
				$video_url = '';
				$image     = ! empty( $item['full_picture'] ) ? esc_url_raw( $item['full_picture'] ) : '';

				$embed_url = '';
				if ( ! empty( $item['attachments']['data'][0]['media_type'] ) && 'video' === $item['attachments']['data'][0]['media_type'] ) {
					$type        = 'video';
					$attachment  = $item['attachments']['data'][0];
					$source      = ! empty( $attachment['media']['source'] ) ? esc_url_raw( $attachment['media']['source'] ) : '';
					$source_host = $source ? (string) wp_parse_url( $source, PHP_URL_HOST ) : '';

					if ( preg_match( '/(^|\.)(youtube\.com|youtube-nocookie\.com|vimeo\.com)$/', $source_host ) ) {
						// A shared YouTube / Vimeo link: "source" is that site's embed player.
						$embed_url = $source;
					} elseif ( $source ) {
						// Native Facebook video: "source" is the direct file on Facebook's CDN.
						$video_url = $source;
					}

					// Facebook's own player only accepts a real video / reel URL
					// (a post permalink shows "Video unavailable").
					if ( '' === $embed_url ) {
						foreach ( array( $attachment['url'] ?? '', $attachment['target']['url'] ?? '', $item['permalink_url'] ?? '' ) as $candidate ) {
							if ( preg_match( '#^https://(www\.)?facebook\.com/.+/(videos|reel)/#', (string) $candidate ) || preg_match( '#^https://(www\.)?facebook\.com/(watch|reel)/#', (string) $candidate ) ) {
								$embed_url = 'https://www.facebook.com/plugins/video.php?show_text=false&href=' . rawurlencode( $candidate );
								break;
							}
						}
					}
				} elseif ( ! empty( $item['attachments']['data'] ) && count( $item['attachments']['data'] ) > 1 ) {
					$type = 'carousel';
				}

				// Album / multi-photo post: every photo (and video) for the popup slider.
				$gallery = array();
				if ( 'video' !== $type ) {
					foreach ( (array) ( $item['attachments']['data'][0]['subattachments']['data'] ?? array() ) as $sub ) {
						$sub_media = isset( $sub['media'] ) && is_array( $sub['media'] ) ? $sub['media'] : array();
						if ( 'video' === ( $sub['media_type'] ?? '' ) ) {
							$gallery[] = $this->gallery_item( 'video', $sub_media['source'] ?? '', $sub_media['image']['src'] ?? '' );
						} else {
							$gallery[] = $this->gallery_item( 'image', $sub_media['image']['src'] ?? '' );
						}
					}
					$gallery = array_values( array_filter( $gallery ) );
					if ( count( $gallery ) > 1 ) {
						$type = 'carousel';
					}
				}

				$posts[] = $this->finalize_post(
					array(
						'id'            => isset( $item['id'] ) ? sanitize_text_field( $item['id'] ) : '',
						'type'          => $type,
						'image'         => $image,
						'video_url'     => $video_url,
						'caption'       => isset( $item['message'] ) ? $this->clean_caption( $item['message'] ) : '',
						'permalink'     => isset( $item['permalink_url'] ) ? esc_url_raw( $item['permalink_url'] ) : '',
						'timestamp'     => isset( $item['created_time'] ) ? strtotime( $item['created_time'] ) : 0,
						'like_count'    => isset( $item['reactions']['summary']['total_count'] ) ? absint( $item['reactions']['summary']['total_count'] ) : 0,
						'comment_count' => isset( $item['comments']['summary']['total_count'] ) ? absint( $item['comments']['summary']['total_count'] ) : 0,
						'share_count'   => isset( $item['shares']['count'] ) ? absint( $item['shares']['count'] ) : 0,
						'author_name'   => isset( $item['from']['name'] ) ? sanitize_text_field( $item['from']['name'] ) : $page_name,
						// Page picture is 200px (sharp on retina); the post's own is 50px.
						'author_avatar' => $page_avatar ? $page_avatar : ( isset( $item['from']['picture']['data']['url'] ) ? esc_url_raw( $item['from']['picture']['data']['url'] ) : '' ),
						'embed_url'     => $embed_url,
						'gallery'       => count( $gallery ) > 1 ? $gallery : array(),
					)
				);
			}

			return $posts;
		}
	}
}
