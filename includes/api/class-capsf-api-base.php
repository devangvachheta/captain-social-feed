<?php
/**
 * Captain Social Feed - API Base
 *
 * Shared helpers used by every platform API class (Instagram, Facebook,
 * Twitter/X, Threads, Pinterest). Each platform class extends this and
 * implements test_connection() + fetch_posts() so the rest of the plugin
 * (dashboard-ajax, shortcode renderer) never has to care which platform
 * it is talking to - it only ever sees the normalized post shape below.
 *
 * Normalized post array shape (every platform class must return this):
 *   [
 *     'id'             => string,
 *     'type'           => 'image' | 'video' | 'carousel',
 *     'image'          => string  (display image / thumbnail URL),
 *     'video_url'      => string|'' (only when type === 'video'),
 *     'caption'        => string  (plain text, already trimmed),
 *     'permalink'      => string  (link back to the original post),
 *     'timestamp'      => int     (unix timestamp),
 *     'like_count'     => int,
 *     'comment_count'  => int,
 *     'share_count'    => int     (shares / reposts; 0 when the platform has none),
 *     'author_name'    => string,
 *     'author_avatar'  => string,
 *     'embed_url'      => string|'' (platform's own embeddable player, for
 *                                    video posts without a direct file),
 *   ]
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Base' ) ) {

	/**
	 * Common request/response helpers for all platform API classes.
	 *
	 * @since 0.0.1
	 */
	abstract class Capsf_Api_Base {

		/**
		 * Platform key, e.g. 'instagram'. Must be set by the child class.
		 *
		 * @var string
		 */
		protected $platform = '';

		/**
		 * Test the stored credentials/connection for this platform.
		 *
		 * @param array $settings Feed connection settings (tokens, IDs, etc.).
		 * @return array {
		 *     @type bool   $success
		 *     @type string $message
		 * }
		 */
		abstract public function test_connection( $settings );

		/**
		 * Fetch normalized posts for this platform.
		 *
		 * @param array $settings Feed connection settings (tokens, IDs, etc.).
		 * @param int   $limit    Max number of posts to return.
		 * @return array|WP_Error Array of normalized post arrays, or WP_Error on failure.
		 */
		abstract public function fetch_posts( $settings, $limit = 12 );

		/**
		 * Perform a GET request via wp_remote_get() (never curl/file_get_contents,
		 * per WordPress.org rule #15) and decode the JSON body.
		 *
		 * @param string $url     Full request URL (query args already appended by caller).
		 * @param array  $headers Optional extra headers (e.g. Authorization Bearer).
		 * @return array|WP_Error Decoded JSON body as an array, or WP_Error.
		 */
		protected function remote_get_json( $url, $headers = array() ) {
			$args = array(
				// Short timeout: a slow platform must not hold the visitor's page render hostage.
				'timeout' => (int) apply_filters( 'capsf_api_timeout', 8 ),
				'headers' => $headers,
			);

			// esc_url_raw() strips "{" and "}", which breaks Graph API field
			// expansion (e.g. attachments{media_type,media}) - encode them first.
			$url      = str_replace( array( '{', '}' ), array( '%7B', '%7D' ), $url );
			$response = wp_remote_get( esc_url_raw( $url ), $args );

			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$code = wp_remote_retrieve_response_code( $response );
			$body = wp_remote_retrieve_body( $response );
			$data = json_decode( $body, true );

			if ( $code < 200 || $code >= 300 ) {
				$message = $this->extract_error_message( $data, $code );
				return new WP_Error(
					'capsf_api_error',
					$message,
					array(
						'status'   => $code,
						'api_code' => ( is_array( $data ) && isset( $data['error']['code'] ) ) ? (int) $data['error']['code'] : 0,
					)
				);
			}

			if ( ! is_array( $data ) ) {
				return new WP_Error( 'capsf_api_error', esc_html__( 'Unexpected response from the API.', 'captain-social-feed' ) );
			}

			return $data;
		}

		/**
		 * GET with the token in an Authorization header (so it never lands in URLs,
		 * proxy logs or HTTP-debug plugins). If a platform rejects header auth
		 * ("an access token is required", code 104), retry once with the query parameter.
		 *
		 * @param string $url   URL WITHOUT the access token.
		 * @param string $token Access token.
		 * @return array|WP_Error
		 */
		protected function remote_get_json_with_token( $url, $token ) {
			$data = $this->remote_get_json( $url, array( 'Authorization' => 'Bearer ' . $token ) );

			if ( is_wp_error( $data ) ) {
				$meta = $data->get_error_data();
				if ( is_array( $meta ) && 104 === ( $meta['api_code'] ?? 0 ) ) {
					$data = $this->remote_get_json( add_query_arg( 'access_token', rawurlencode( $token ), $url ) );
				}
			}

			return $data;
		}

		/**
		 * Clean an access / bearer token. Not sanitize_text_field(): that strips
		 * percent-encoded octets ("%3D", "%2B"), which X bearer tokens contain -
		 * the cut token is then rejected with HTTP 401. Keeps only the characters
		 * tokens are made of.
		 *
		 * @param mixed $token Raw token.
		 * @return string
		 */
		public static function sanitize_token( $token ) {
			if ( ! is_string( $token ) ) {
				return '';
			}
			// A masked token ("abc••••wxyz") posted back by the editor is swapped for
			// the stored one by Capsf_Dashboard_Ajax::restore_masked_tokens() - keep it.
			if ( false !== strpos( $token, '••' ) ) {
				return sanitize_text_field( $token );
			}
			return preg_replace( '/[^A-Za-z0-9%._~+\/=|:\-]/', '', $token );
		}

		/**
		 * Strip anything that looks like a credential out of a message before it is stored/shown.
		 *
		 * @param string $message Message.
		 * @return string
		 */
		protected function scrub_secrets( $message ) {
			return preg_replace( '/(access_token|bearer|token)([=:\s]+)[A-Za-z0-9._\-|]{12,}/i', '$1$2[hidden]', (string) $message );
		}

		/**
		 * Try to pull a human-readable error message out of a platform's
		 * (typically differently-shaped) error JSON body.
		 *
		 * @param array|null $data Decoded JSON body.
		 * @param int        $code HTTP status code.
		 * @return string
		 */
		protected function extract_error_message( $data, $code ) {
			if ( is_array( $data ) ) {
				if ( ! empty( $data['error']['message'] ) ) {
					return $this->scrub_secrets( sanitize_text_field( $data['error']['message'] ) );
				}
				if ( ! empty( $data['error_message'] ) ) {
					return $this->scrub_secrets( sanitize_text_field( $data['error_message'] ) );
				}
				if ( ! empty( $data['message'] ) ) {
					return $this->scrub_secrets( sanitize_text_field( $data['message'] ) );
				}
				if ( ! empty( $data['errors'][0]['message'] ) ) {
					return $this->scrub_secrets( sanitize_text_field( $data['errors'][0]['message'] ) );
				}
				// X API v2 problem details response structure with title and detail fields.
				if ( ! empty( $data['detail'] ) || ! empty( $data['title'] ) ) {
					return $this->scrub_secrets( sanitize_text_field( ! empty( $data['detail'] ) ? $data['detail'] : $data['title'] ) );
				}
			}
			/* translators: %d: HTTP status code returned by the platform API. */
			return sprintf( esc_html__( 'The platform API returned an error (HTTP %d).', 'captain-social-feed' ), absint( $code ) );
		}

		/**
		 * Trim + strip a caption/text field down to plain text for card display.
		 *
		 * @param string $text Raw text.
		 * @return string
		 */
		protected function clean_caption( $text ) {
			$text = wp_strip_all_tags( (string) $text );
			return trim( $text );
		}

		/**
		 * Every item of an Instagram / Threads carousel album, for the post popup's
		 * slider: images, and videos with their thumbnail as the poster.
		 *
		 * @param array $item Album item with a "children" expansion.
		 * @return array[] { type: image|video, src: string, poster: string }
		 */
		protected function children_gallery( $item ) {
			$gallery = array();
			foreach ( (array) ( $item['children']['data'] ?? array() ) as $child ) {
				if ( ! is_array( $child ) ) {
					continue;
				}
				if ( 'VIDEO' === strtoupper( $child['media_type'] ?? '' ) ) {
					$gallery[] = $this->gallery_item( 'video', $child['media_url'] ?? '', $child['thumbnail_url'] ?? '' );
				} elseif ( ! empty( $child['media_url'] ) ) {
					$gallery[] = $this->gallery_item( 'image', $child['media_url'] );
				}
			}
			return array_values( array_filter( $gallery ) );
		}

		/**
		 * One gallery entry (empty when it has nothing to show).
		 *
		 * @param string $type   image|video.
		 * @param string $src    Image URL, or the video file URL ('' = not playable here).
		 * @param string $poster Video thumbnail.
		 * @return array
		 */
		protected function gallery_item( $type, $src, $poster = '' ) {
			$src    = esc_url_raw( (string) $src );
			$poster = esc_url_raw( (string) $poster );
			if ( 'video' === $type ) {
				return ( $src || $poster ) ? array(
					'type'   => 'video',
					'src'    => $src,
					'poster' => $poster,
				) : array();
			}
			return $src ? array(
				'type'   => 'image',
				'src'    => $src,
				'poster' => '',
			) : array();
		}

		/**
		 * Card picture of an Instagram / Threads carousel album: its first child's
		 * image (or a video child's thumbnail - never the video file itself).
		 *
		 * @param array $item Album item with a "children" expansion.
		 * @return string
		 */
		protected function first_child_image( $item ) {
			$child = $item['children']['data'][0] ?? array();
			if ( empty( $child ) || ! is_array( $child ) ) {
				return '';
			}
			if ( 'VIDEO' === strtoupper( $child['media_type'] ?? '' ) ) {
				return ! empty( $child['thumbnail_url'] ) ? esc_url_raw( $child['thumbnail_url'] ) : '';
			}
			return ! empty( $child['media_url'] ) ? esc_url_raw( $child['media_url'] ) : '';
		}

		/**
		 * Fill in the optional keys every normalized post should carry, so
		 * templates never have to isset() them.
		 *
		 * @param array $post Normalized post.
		 * @return array
		 */
		protected function finalize_post( $post ) {
			return array_merge(
				array(
					'share_count'   => 0,
					'author_name'   => '',
					'author_avatar' => '',
					'embed_url'     => '',
					// Every image / video of a multi-media post (popup slider).
					'gallery'       => array(),
				),
				$post
			);
		}

		/**
		 * Cache key for a given feed's fetched posts.
		 *
		 * @param int $feed_id Feed ID.
		 * @return string
		 */
		public static function cache_key( $feed_id ) {
			return 'capsf_posts_' . absint( $feed_id );
		}
	}
}
