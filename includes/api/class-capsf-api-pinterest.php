<?php
/**
 * Captain Social Feed - Pinterest API
 *
 * Uses Pinterest API v5 via an Access Token + Board ID to fetch a
 * board's pins.
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Pinterest' ) ) {

	/**
	 * Pinterest API v5 client.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Pinterest extends Capsf_Api_Base {

		/**
		 * API base URL.
		 *
		 * @var string
		 */
		private $base = 'https://api.pinterest.com/v5/';

		/**
		 * Platform key.
		 *
		 * @var string
		 */
		protected $platform = 'pinterest';

		/**
		 * Test the stored credentials against the live API.
		 *
		 * @param array $settings Feed connection settings.
		 * @return array { success: bool, message: string }
		 */
		public function test_connection( $settings ) {
			$token    = ! empty( $settings['access_token'] ) ? self::sanitize_token( $settings['access_token'] ) : '';
			$board_id = ! empty( $settings['board_id'] ) ? sanitize_text_field( $settings['board_id'] ) : '';

			if ( empty( $token ) || empty( $board_id ) ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Please enter both the Access Token and the Board ID.', 'captain-social-feed' ),
				);
			}

			$url  = $this->base . 'boards/' . rawurlencode( $board_id );
			$data = $this->remote_get_json( $url, array( 'Authorization' => 'Bearer ' . $token ) );

			if ( is_wp_error( $data ) ) {
				return array(
					'success' => false,
					'message' => $data->get_error_message(),
				);
			}

			$name = ! empty( $data['name'] ) ? sanitize_text_field( $data['name'] ) : '';
			return array(
				'success' => true,
				/* translators: %s: Pinterest board name. */
				'message' => $name ? sprintf( __( 'Connected successfully to board "%s".', 'captain-social-feed' ), $name ) : esc_html__( 'Connected successfully.', 'captain-social-feed' ),
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
			$token    = ! empty( $settings['access_token'] ) ? self::sanitize_token( $settings['access_token'] ) : '';
			$board_id = ! empty( $settings['board_id'] ) ? sanitize_text_field( $settings['board_id'] ) : '';

			if ( empty( $token ) || empty( $board_id ) ) {
				return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Pinterest Access Token or Board ID is missing.', 'captain-social-feed' ) );
			}

			$page_size = max( 5, min( 100, absint( $limit ) ) );
			$url       = $this->base . 'boards/' . rawurlencode( $board_id ) . '/pins?page_size=' . $page_size;
			$data      = $this->remote_get_json( $url, array( 'Authorization' => 'Bearer ' . $token ) );

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			if ( empty( $data['items'] ) || ! is_array( $data['items'] ) ) {
				return array();
			}

			// Account name + picture for the card header - optional.
			$avatar  = '';
			$account = '';
			$profile = $this->remote_get_json( $this->base . 'user_account', array( 'Authorization' => 'Bearer ' . $token ) );
			if ( ! is_wp_error( $profile ) ) {
				$avatar  = ! empty( $profile['profile_image'] ) ? esc_url_raw( $profile['profile_image'] ) : '';
				$account = ! empty( $profile['username'] ) ? sanitize_text_field( $profile['username'] ) : '';
			}

			$posts = array();
			foreach ( $data['items'] as $item ) {
				$type      = 'image';
				$video_url = '';
				$image     = '';

				$media      = isset( $item['media'] ) && is_array( $item['media'] ) ? $item['media'] : array();
				$media_type = $media['media_type'] ?? '';
				// Multi-image / multi-video pins carry their media in "items" - the first one is the card picture.
				$first = ( ! empty( $media['items'][0] ) && is_array( $media['items'][0] ) ) ? $media['items'][0] : array();

				if ( ! empty( $media['images']['600x']['url'] ) ) {
					$image = esc_url_raw( $media['images']['600x']['url'] );
				} elseif ( ! empty( $media['images']['originals']['url'] ) ) {
					$image = esc_url_raw( $media['images']['originals']['url'] );
				} elseif ( ! empty( $media['cover_image_url'] ) ) {
					$image = esc_url_raw( $media['cover_image_url'] );
				} elseif ( ! empty( $first['images']['600x']['url'] ) ) {
					$image = esc_url_raw( $first['images']['600x']['url'] );
				} elseif ( ! empty( $first['cover_image_url'] ) ) {
					$image = esc_url_raw( $first['cover_image_url'] );
				}

				$gallery = array();
				if ( in_array( $media_type, array( 'multiple_images', 'multiple_videos', 'multiple_mixed' ), true ) ) {
					$type = 'carousel';
					foreach ( (array) ( $media['items'] ?? array() ) as $pin_item ) {
						if ( ! empty( $pin_item['video_url'] ) || ! empty( $pin_item['cover_image_url'] ) ) {
							$gallery[] = $this->gallery_item( 'video', $pin_item['video_url'] ?? '', $pin_item['cover_image_url'] ?? '' );
						} else {
							$gallery[] = $this->gallery_item( 'image', $pin_item['images']['600x']['url'] ?? ( $pin_item['images']['originals']['url'] ?? '' ) );
						}
					}
					$gallery = array_values( array_filter( $gallery ) );
				}

				if ( 'video' === $media_type ) {
					$type = 'video';
					if ( ! empty( $item['media']['video_url'] ) ) {
						$video_url = esc_url_raw( $item['media']['video_url'] );
					}
				}

				$pin_id  = isset( $item['id'] ) ? sanitize_text_field( $item['id'] ) : '';
				$posts[] = $this->finalize_post(
					array(
						'id'            => $pin_id,
						'type'          => $type,
						'image'         => $image,
						'video_url'     => $video_url,
						'caption'       => ! empty( $item['title'] ) ? $this->clean_caption( $item['title'] ) : ( ! empty( $item['description'] ) ? $this->clean_caption( $item['description'] ) : '' ),
						// Always the pin's own page - "link" is an arbitrary third-party destination chosen by the pin's creator.
						'permalink'     => isset( $item['id'] ) ? 'https://www.pinterest.com/pin/' . rawurlencode( sanitize_text_field( $item['id'] ) ) . '/' : '',
						'timestamp'     => isset( $item['created_at'] ) ? strtotime( $item['created_at'] ) : 0,
						'like_count'    => 0,
						'comment_count' => 0,
						'author_name'   => isset( $item['board_owner']['username'] ) ? sanitize_text_field( $item['board_owner']['username'] ) : $account,
						'author_avatar' => $avatar,
						'embed_url'     => ( 'video' === $type && '' === $video_url && $pin_id ) ? 'https://assets.pinterest.com/ext/embed.html?id=' . rawurlencode( $pin_id ) : '',
						'gallery'       => $gallery,
					)
				);
			}

			return $posts;
		}
	}
}
