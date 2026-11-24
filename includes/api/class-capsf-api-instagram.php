<?php
/**
 * Captain Social Feed - Instagram API
 *
 * Uses the Instagram Graph API (for Business/Creator accounts) via a
 * long-lived Access Token + Instagram Business Account ID. This is the
 * only currently-supported way to read a feed programmatically since
 * Meta deprecated the old Basic Display API.
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Instagram' ) ) {

	/**
	 * Instagram Graph API client.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Instagram extends Capsf_Api_Base {

		/**
		 * Graph API base URL.
		 *
		 * @var string
		 */
		private $base = 'https://graph.instagram.com/';

		/**
		 * Platform key.
		 *
		 * @var string
		 */
		protected $platform = 'instagram';

		/**
		 * Test the stored credentials against the live API.
		 *
		 * @param array $settings Feed connection settings.
		 * @return array { success: bool, message: string }
		 */
		public function test_connection( $settings ) {
			$token   = ! empty( $settings['access_token'] ) ? self::sanitize_token( $settings['access_token'] ) : '';
			$user_id = ! empty( $settings['account_id'] ) ? sanitize_text_field( $settings['account_id'] ) : '';

			if ( empty( $token ) || empty( $user_id ) ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Please enter both the Access Token and the Instagram Business Account ID.', 'captain-social-feed' ),
				);
			}

			$url  = $this->base . rawurlencode( $user_id ) . '?fields=id,username';
			$data = $this->remote_get_json_with_token( $url, $token );

			if ( is_wp_error( $data ) ) {
				return array(
					'success' => false,
					'message' => $data->get_error_message(),
				);
			}

			$username = ! empty( $data['username'] ) ? sanitize_text_field( $data['username'] ) : '';
			return array(
				'success' => true,
				/* translators: %s: Instagram username. */
				'message' => $username ? sprintf( __( 'Connected successfully as @%s.', 'captain-social-feed' ), $username ) : esc_html__( 'Connected successfully.', 'captain-social-feed' ),
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
			$user_id = ! empty( $settings['account_id'] ) ? sanitize_text_field( $settings['account_id'] ) : '';

			if ( empty( $token ) || empty( $user_id ) ) {
				return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Instagram Access Token or Account ID is missing.', 'captain-social-feed' ) );
			}

			$fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,username,children{media_type,media_url,thumbnail_url}';
			$url    = $this->base . rawurlencode( $user_id ) . '/media?fields=' . $fields . '&limit=' . absint( $limit );
			$data   = $this->remote_get_json_with_token( $url, $token );

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			if ( empty( $data['data'] ) || ! is_array( $data['data'] ) ) {
				return array();
			}

			// Profile picture for the card header - optional, a failure just
			// falls back to the initial-letter avatar.
			$avatar  = '';
			$profile = $this->remote_get_json_with_token( $this->base . rawurlencode( $user_id ) . '?fields=profile_picture_url', $token );
			if ( ! is_wp_error( $profile ) && ! empty( $profile['profile_picture_url'] ) ) {
				$avatar = esc_url_raw( $profile['profile_picture_url'] );
			}

			$posts = array();
			foreach ( $data['data'] as $item ) {
				$media_type = ! empty( $item['media_type'] ) ? strtoupper( $item['media_type'] ) : 'IMAGE';
				$type       = 'image';
				$video_url  = '';
				$image      = ! empty( $item['media_url'] ) ? esc_url_raw( $item['media_url'] ) : '';

				if ( 'VIDEO' === $media_type ) {
					$type      = 'video';
					$video_url = $image;
					$image     = ! empty( $item['thumbnail_url'] ) ? esc_url_raw( $item['thumbnail_url'] ) : $image;
				} elseif ( 'CAROUSEL_ALBUM' === $media_type ) {
					$type        = 'carousel';
					$child_image = $this->first_child_image( $item );
					if ( $child_image ) {
						$image = $child_image;
					}
				}
				$gallery = 'carousel' === $type ? $this->children_gallery( $item ) : array();

				$posts[] = $this->finalize_post(
					array(
						'id'            => isset( $item['id'] ) ? sanitize_text_field( $item['id'] ) : '',
						'type'          => $type,
						'image'         => $image,
						'video_url'     => $video_url,
						'caption'       => isset( $item['caption'] ) ? $this->clean_caption( $item['caption'] ) : '',
						'permalink'     => isset( $item['permalink'] ) ? esc_url_raw( $item['permalink'] ) : '',
						'timestamp'     => isset( $item['timestamp'] ) ? strtotime( $item['timestamp'] ) : 0,
						'like_count'    => isset( $item['like_count'] ) ? absint( $item['like_count'] ) : 0,
						'comment_count' => isset( $item['comments_count'] ) ? absint( $item['comments_count'] ) : 0,
						'author_name'   => isset( $item['username'] ) ? sanitize_text_field( $item['username'] ) : '',
						'author_avatar' => $avatar,
						'gallery'       => $gallery,
					)
				);
			}

			return $posts;
		}
	}
}
