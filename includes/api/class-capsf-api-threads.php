<?php
/**
 * Captain Social Feed - Threads API
 *
 * Uses the Threads API (by Meta) via a long-lived Access Token +
 * Threads User ID to fetch a user's public threads.
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Threads' ) ) {

	/**
	 * Threads API client.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Threads extends Capsf_Api_Base {

		/**
		 * API base URL.
		 *
		 * @var string
		 */
		private $base = 'https://graph.threads.net/v1.0/';

		/**
		 * Platform key.
		 *
		 * @var string
		 */
		protected $platform = 'threads';

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
					'message' => esc_html__( 'Please enter both the Access Token and the Threads User ID.', 'captain-social-feed' ),
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
				/* translators: %s: Threads username. */
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
				return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Threads Access Token or User ID is missing.', 'captain-social-feed' ) );
			}

			$fields = 'id,media_product_type,media_type,media_url,thumbnail_url,permalink,text,timestamp,username,children{media_type,media_url,thumbnail_url}';
			$url    = $this->base . rawurlencode( $user_id ) . '/threads?fields=' . $fields . '&limit=' . absint( $limit );
			$data   = $this->remote_get_json_with_token( $url, $token );

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			if ( empty( $data['data'] ) || ! is_array( $data['data'] ) ) {
				return array();
			}

			// Profile picture for the card header - optional.
			$avatar  = '';
			$profile = $this->remote_get_json_with_token( $this->base . rawurlencode( $user_id ) . '?fields=threads_profile_picture_url', $token );
			if ( ! is_wp_error( $profile ) && ! empty( $profile['threads_profile_picture_url'] ) ) {
				$avatar = esc_url_raw( $profile['threads_profile_picture_url'] );
			}

			$posts = array();
			foreach ( $data['data'] as $item ) {
				$media_type = ! empty( $item['media_type'] ) ? strtoupper( $item['media_type'] ) : 'TEXT_POST';
				$type       = 'image';
				$image      = ! empty( $item['media_url'] ) ? esc_url_raw( $item['media_url'] ) : '';
				$video_url  = '';

				if ( 'VIDEO' === $media_type ) {
					$type      = 'video';
					$video_url = $image;
					// media_url is the video file itself - never use it as an <img>.
					$image = ! empty( $item['thumbnail_url'] ) ? esc_url_raw( $item['thumbnail_url'] ) : '';
				} elseif ( 'CAROUSEL_ALBUM' === $media_type ) {
					$type  = 'carousel';
					$image = $image ? $image : $this->first_child_image( $item );
				} elseif ( 'TEXT_POST' === $media_type ) {
					$type = 'image'; // Rendered as a text-only card (no image) by the templates.
				}

				// Fetching engagement counts requires a separate insights call per
				// post (extra API cost) - left at 0 for now; can be wired up via
				// {id}/insights?metric=likes,replies in a follow-up if the user's
				// plan/rate-limit allows it.
				$posts[] = $this->finalize_post(
					array(
						'id'            => isset( $item['id'] ) ? sanitize_text_field( $item['id'] ) : '',
						'type'          => $type,
						'image'         => $image,
						'video_url'     => $video_url,
						'caption'       => isset( $item['text'] ) ? $this->clean_caption( $item['text'] ) : '',
						'permalink'     => isset( $item['permalink'] ) ? esc_url_raw( $item['permalink'] ) : '',
						'timestamp'     => isset( $item['timestamp'] ) ? strtotime( $item['timestamp'] ) : 0,
						'like_count'    => 0,
						'comment_count' => 0,
						'author_name'   => isset( $item['username'] ) ? sanitize_text_field( $item['username'] ) : '',
						'author_avatar' => $avatar,
						'gallery'       => 'carousel' === $type ? $this->children_gallery( $item ) : array(),
					)
				);
			}

			return $posts;
		}
	}
}
