<?php
/**
 * Captain Social Feed Dashboard Ajax
 *
 * @package    captain-social-feed
 * @subpackage captain-social-feed/includes
 **/

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Capsf_Dashboard_Ajax
 * */
if ( ! class_exists( 'Capsf_Dashboard_Ajax' ) ) {

	/**
	 * Capsf_Dashboard_Ajax
	 *
	 * @since 1.0.0
	 */
	class Capsf_Dashboard_Ajax {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Member Variable
		 *
		 * @var global_setting
		 */
		public $global_setting = array();

		/**
		 *  Initiator
		 */
		public static function get_instance() {

			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}

			return self::$instance;
		}

		/**
		 * Define the core functionality of the plugin.
		 *
		 * @since 1.0.0
		 */
		public function __construct() {
			add_action( 'wp_ajax_capsf_dashboard_ajax_call', array( $this, 'capsf_dashboard_ajax_call' ) );
		}

		/**
		 * Load the required dependencies for this plugin.
		 *
		 * @since 1.0.0
		 */
		public function capsf_dashboard_ajax_call() {

			if ( ! check_ajax_referer( 'capsf_nonce', 'nonce', false ) ) {

				$response = $this->capsf_set_response( false, esc_html__( 'Invalid nonce.', 'captain-social-feed' ), esc_html__( 'The security check failed. Please refresh the page and try again.', 'captain-social-feed' ) );

				wp_send_json( $response );
				wp_die();
			}

			if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
				$response = $this->capsf_set_response( false, esc_html__( 'Invalid Permission.', 'captain-social-feed' ), esc_html__( 'Something went wrong.', 'captain-social-feed' ) );

				wp_send_json( $response );
				wp_die();
			}

			$type = isset( $_POST['type'] ) ? strtolower( sanitize_text_field( wp_unslash( $_POST['type'] ) ) ) : false;
			if ( ! $type ) {
				$response = $this->capsf_set_response( false, esc_html__( 'Invalid type.', 'captain-social-feed' ), esc_html__( 'Something went wrong.', 'captain-social-feed' ) );

				wp_send_json( $response );
				wp_die();
			}

			switch ( $type ) {
				case 'get_feed_listing':
					$response = $this->get_feed_listing();
					break;
				case 'save_feed':
					$response = $this->save_feed();
					break;
				case 'delete_feed':
					$response = $this->delete_feed();
					break;
				case 'create_new_feed':
					$response = $this->create_new_feed();
					break;
				case 'update_feed_name':
					$response = $this->update_feed_name();
					break;
				case 'get_feed_data':
					$response = $this->get_feed_data();
					break;
				case 'get_preview_posts':
					$response = $this->get_preview_posts();
					break;
				case 'test_platform_connection':
					$response = $this->test_platform_connection();
					break;
				case 'get_feed_settings':
					$response = $this->get_feed_settings();
					break;
				case 'save_feed_partial':
					$response = $this->save_feed_partial();
					break;
				case 'set_clear_cache':
					$response = $this->set_clear_cache();
					break;
				case 'clear_feed_cache':
					$response = $this->clear_feed_cache();
					break;
				case 'get_cache_stats':
					$response = $this->get_cache_stats();
					break;
				case 'get_global_settings':
					$response = $this->get_global_settings();
					break;
				case 'set_global_setting':
					$response = $this->set_global_setting();
					break;
				case 'auto_save_settings':
					$response = $this->auto_save_settings();
					break;
				case 'toggle_feed_status':
					$response = $this->toggle_feed_status();
					break;
				case 'rollback_version':
					$response = $this->rollback_version();
					break;
				case 'get_products_status':
					$response = $this->get_products_status();
					break;
				case 'install_activate_product':
					$response = $this->install_activate_product();
					break;
				default:
					/**
					 * Let add-ons (e.g. Pro / White Label) handle their own request types.
					 * Return an array response to short-circuit, or null to fall through.
					 */
					$response = apply_filters( 'capsf_dashboard_ajax_custom_type', null, $type );
					if ( ! is_array( $response ) ) {
						$response = $this->capsf_set_response(
							false,
							esc_html__( 'Unsupported request.', 'captain-social-feed' ),
							esc_html__( 'This action is not available in your current version.', 'captain-social-feed' )
						);
					}
			}

			wp_send_json( $response );
			wp_die();
		}

		/**
		 * Create a blank new feed and return its ID.
		 * Called when user clicks "+ Create New Feed" - redirects straight to wizard.
		 *
		 * @return array Response array.
		 */
		public function create_new_feed() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';
			$author     = get_current_user_id();
			$count      = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table_name}" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- plugin's own table, trusted prefix, live count needed.
			/* translators: %d: auto-incremented feed number */
			$feed_name = sprintf( esc_html__( 'social-feed-%d', 'captain-social-feed' ), $count + 1 );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- writing to the plugin's own custom table.
			$result = $wpdb->insert(
				$table_name,
				array(
					'feed_name'     => $feed_name,
					'feed_type'     => '',
					'settings'      => wp_json_encode( array() ),
					'author'        => $author,
					'status'        => 'active',
					'last_modified' => current_time( 'mysql' ),
				),
				array( '%s', '%s', '%s', '%d', '%s', '%s' )
			);

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'Failed to create feed.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			return $this->capsf_set_response( true, esc_html__( 'Feed created.', 'captain-social-feed' ), '', array( 'feed_id' => (int) $wpdb->insert_id ) );
		}

		/**
		 * Update feed name - used by wizard Step 1 feed name field.
		 *
		 * @return array Response array.
		 */
		public function update_feed_name() {
			global $wpdb;

			// Nonce is verified in capsf_dashboard_ajax_call() before this method is called.
			// phpcs:disable WordPress.Security.NonceVerification.Missing
			$feed_id   = isset( $_POST['feed_id'] ) ? absint( $_POST['feed_id'] ) : 0;
			$feed_name = isset( $_POST['feed_name'] ) ? sanitize_text_field( wp_unslash( $_POST['feed_name'] ) ) : '';
			// phpcs:enable WordPress.Security.NonceVerification.Missing

			if ( ! $feed_id || ! $feed_name ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid data.', 'captain-social-feed' ) );
			}

			$table_name = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- writing to the plugin's own custom table.
			$result = $wpdb->update(
				$table_name,
				array( 'feed_name' => $feed_name ),
				array( 'id' => $feed_id ),
				array( '%s' ),
				array( '%d' )
			);

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			return $this->capsf_set_response( true, esc_html__( 'Feed name updated.', 'captain-social-feed' ) );
		}

		/**
		 * Get the feed listing from the DB.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function get_feed_listing() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';

			// C2: Select only needed columns - avoid fetching heavy LONGTEXT settings field for listing.
			// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
			$results = $wpdb->get_results(
				"SELECT id, feed_name, feed_type, status, last_modified FROM `{$table_name}` ORDER BY last_modified DESC",
				ARRAY_A
			);
			// phpcs:enable

			if ( $wpdb->last_error ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			return $this->capsf_set_response( true, esc_html__( 'Success.', 'captain-social-feed' ), '', $results );
		}

		/**
		 * Insert / Update a feed entry in DB.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function save_feed() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';

			// Nonce is verified in capsf_dashboard_ajax_call() before this method is called.
			// phpcs:disable WordPress.Security.NonceVerification.Missing
			$feed_id   = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;
			$feed_name = isset( $_POST['feed_name'] ) ? sanitize_text_field( wp_unslash( $_POST['feed_name'] ) ) : '';
			$feed_type = isset( $_POST['feed_type'] ) ? sanitize_key( wp_unslash( $_POST['feed_type'] ) ) : '';
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$settings = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '';
			$status   = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : 'active';
			// phpcs:enable WordPress.Security.NonceVerification.Missing

			// Allowlists - these columns drive rendering/behaviour, so never store arbitrary values.
			if ( '' !== $feed_type && ! in_array( $feed_type, Capsf_Api_Factory::get_platforms(), true ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid platform.', 'captain-social-feed' ) );
			}
			if ( ! in_array( $status, array( 'active', 'inactive' ), true ) ) {
				$status = 'active';
			}

			if ( is_string( $settings ) ) {
				$decoded = json_decode( $settings, true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					$settings = $this->capsf_sanitize_settings( $decoded );
				} else {
					$settings = array();
				}
			} else {
				$settings = is_array( $settings ) ? $this->capsf_sanitize_settings( $settings ) : array();
			}

			if ( empty( $feed_name ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Missing Fields.', 'captain-social-feed' ), esc_html__( 'feed_name and feed_title are required.', 'captain-social-feed' ) );
			}

			// The editor only ever holds masked tokens - put the stored secrets back.
			$settings = $this->restore_masked_tokens( $settings, $feed_id );

			if ( $feed_id > 0 && ! $this->feed_exists( $feed_id ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			$author_id = get_current_user_id();

			$data = array(
				'feed_name'     => $feed_name,
				'feed_type'     => $feed_type,
				'settings'      => wp_json_encode( $settings ),
				'author'        => $author_id,
				'status'        => $status,
				'last_modified' => current_time( 'mysql' ),
			);

			$format = array( '%s', '%s', '%s', '%d', '%s', '%s' );

			if ( $feed_id > 0 ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$result  = $wpdb->update( $table_name, $data, array( 'id' => $feed_id ), $format, array( '%d' ) );
				$message = esc_html__( 'Feed updated.', 'captain-social-feed' );
			} else {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				$result  = $wpdb->insert( $table_name, $data, $format );
				$feed_id = $wpdb->insert_id;
				$message = esc_html__( 'Feed created.', 'captain-social-feed' );

				if ( $feed_id ) {
					$platform_slug         = ! empty( $feed_type ) ? $feed_type : 'social';
					$new_feed_name         = $platform_slug . '-' . $feed_id;
					$settings['feed_name'] = $new_feed_name;

					// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
					$wpdb->update(
						$table_name,
						array(
							'feed_name' => $new_feed_name,
							'settings'  => wp_json_encode( $settings ),
						),
						array( 'id' => $feed_id ),
						array( '%s', '%s' ),
						array( '%d' )
					);
				}
			}

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			Capsf_Shortcode::clear_feed_transients( $feed_id );

			return $this->capsf_set_response( true, $message, '', array( 'feed_id' => $feed_id ) );
		}

		/**
		 * Delete a feed entry from the DB.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function delete_feed() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid Feed ID.', 'captain-social-feed' ) );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->delete( $table_name, array( 'id' => $feed_id ), array( '%d' ) );

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			Capsf_Shortcode::clear_feed_transients( $feed_id );

			return $this->capsf_set_response( true, esc_html__( 'Feed deleted successfully.', 'captain-social-feed' ) );
		}

		/**
		 * Toggle feed status between active and inactive.
		 *
		 * @since 1.0.6
		 * @return array
		 */
		public function toggle_feed_status() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$new_status = isset( $_POST['status'] ) ? sanitize_key( wp_unslash( $_POST['status'] ) ) : '';

			if ( $feed_id <= 0 || ! in_array( $new_status, array( 'active', 'inactive' ), true ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid data.', 'captain-social-feed' ) );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->update(
				$table_name,
				array( 'status' => $new_status ),
				array( 'id' => $feed_id ),
				array( '%s' ),
				array( '%d' )
			);

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			return $this->capsf_set_response( true, esc_html__( 'Status updated.', 'captain-social-feed' ), '', array( 'status' => $new_status ) );
		}

		/**
		 * Get single feed's data from DB.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function get_feed_data() {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid Feed ID.', 'captain-social-feed' ) );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$row = $wpdb->get_row(
				$wpdb->prepare( "SELECT * FROM `{$table_name}` WHERE id = %d", $feed_id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				ARRAY_A
			);

			if ( $wpdb->last_error ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			if ( ! $row ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			// Decode settings JSON → array so React receives a plain object, not a string.
			$settings        = json_decode( $row['settings'], true );
			$row['settings'] = is_array( $settings ) ? $this->mask_settings_tokens( $settings ) : array();

			// Return clean feed data - no preview call (React computes preview URL directly).
			return $this->capsf_set_response(
				true,
				esc_html__( 'Success.', 'captain-social-feed' ),
				'',
				array( 'feed_data' => $row )
			);
		}

		/**
		 * Get preview posts for the admin wizard (Step 2 & 3 layout preview).
		 *
		 * Fetches the feed's platform + credentials, calls the matching
		 * platform API class via Capsf_Api_Factory, caches the normalized
		 * result in a transient (same cache key/shape the frontend shortcode
		 * uses), and maps it into the legacy card-template variable
		 * contract (title/thumbnail/channel/video_link/etc.) so every
		 * existing card style (style-1..7, reel-1) renders it without
		 * needing platform-aware changes.
		 *
		 * @since 0.0.1
		 * @return array Response array.
		 */
		public function get_preview_posts() {
			// Nonce and capability are verified in capsf_dashboard_ajax_call().
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid Feed ID.', 'captain-social-feed' ) );
			}

			if ( ! class_exists( 'Capsf_Shortcode' ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Preview service unavailable.', 'captain-social-feed' ) );
			}

			$shortcode = Capsf_Shortcode::get_instance();
			$feed_data = $shortcode->get_query_userfeed( $feed_id );

			if ( empty( $feed_data ) || ! is_array( $feed_data ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			$posts_or_error = $shortcode->get_platform_posts( $feed_data );

			if ( is_wp_error( $posts_or_error ) ) {
				return $this->capsf_set_response( false, $posts_or_error->get_error_message() );
			}

			if ( empty( $posts_or_error['items'] ) ) {
				return $this->capsf_set_response( false, esc_html__( 'No posts found for preview.', 'captain-social-feed' ) );
			}

			$channel = isset( $posts_or_error['channelTitle'] ) ? (string) $posts_or_error['channelTitle'] : '';
			$videos  = array();
			foreach ( array_slice( $posts_or_error['items'], 0, 12 ) as $item ) {
				$thumb    = isset( $item['thumbnail'] ) && is_array( $item['thumbnail'] ) ? $item['thumbnail'] : array();
				$videos[] = array(
					'title'          => (string) $item['title'],
					'description'    => (string) $item['description'],
					'caption'        => (string) ( $item['caption'] ?? $item['description'] ),
					'channel'        => ! empty( $item['channelTitle'] ) ? (string) $item['channelTitle'] : $channel,
					'thumbnail'      => ! empty( $thumb['high'] ) ? esc_url_raw( $thumb['high'] ) : '',
					'views_label'    => ! empty( $item['like_count'] ) ? $shortcode->capsf_format_count( $item['like_count'] ) : '',
					'duration_label' => '',
					'time_ago_label' => ! empty( $item['publishedAt'] ) ? $shortcode->capsf_time_ago( $item['publishedAt'] ) : '',
					'platform'       => isset( $posts_or_error['platform'] ) ? sanitize_key( $posts_or_error['platform'] ) : '',
					'avatar'         => ! empty( $item['author_avatar'] ) ? esc_url_raw( $item['author_avatar'] ) : '',
					'is_video'       => ! empty( $item['post_type'] ) && 'video' === $item['post_type'],
					'is_album'       => count( (array) ( $item['gallery'] ?? array() ) ) > 1 || ( ! empty( $item['post_type'] ) && 'carousel' === $item['post_type'] ),
					'likes'          => $shortcode->capsf_format_count( $item['like_count'] ?? 0 ),
					'comments'       => $shortcode->capsf_format_count( $item['comment_count'] ?? 0 ),
					'shares'         => $shortcode->capsf_format_count( $item['share_count'] ?? 0 ),
					// X designs.
					'username'       => (string) ( $item['author_username'] ?? '' ),
					'verified'       => ! empty( $item['author_verified'] ),
					'images'         => array_map( 'esc_url_raw', array_slice( (array) ( $item['images'] ?? array() ), 0, 4 ) ),
					'reposted_by'    => (string) ( $item['reposted_by'] ?? '' ),
					'replies'        => $shortcode->capsf_format_count( $item['comment_count'] ?? 0 ),
				);
			}

			return $this->capsf_set_response(
				true,
				esc_html__( 'Preview posts loaded.', 'captain-social-feed' ),
				'',
				array(
					'videos'  => $videos,
					'profile' => $this->preview_profile( $posts_or_error['profile'] ?? array(), $shortcode ),
				)
			);
		}

		/**
		 * X profile header for the editor preview (counts formatted).
		 *
		 * @param array           $profile   Profile from Capsf_Api_Twitter.
		 * @param Capsf_Shortcode $shortcode Shortcode instance (count formatting).
		 * @return array|null
		 */
		private function preview_profile( $profile, $shortcode ) {
			if ( empty( $profile ) || ! is_array( $profile ) ) {
				return null;
			}
			return array(
				'name'            => (string) ( $profile['name'] ?? '' ),
				'username'        => (string) ( $profile['username'] ?? '' ),
				'avatar'          => esc_url_raw( $profile['avatar'] ?? '' ),
				'banner'          => esc_url_raw( $profile['banner'] ?? '' ),
				'verified'        => ! empty( $profile['verified'] ),
				'posts_label'     => $shortcode->capsf_format_count( $profile['posts'] ?? 0 ),
				'following_label' => $shortcode->capsf_format_count( $profile['following'] ?? 0 ),
				'followers_label' => $shortcode->capsf_format_count( $profile['followers'] ?? 0 ),
			);
		}

		/**
		 * Test whether a platform's connection credentials currently work -
		 * checked live against that platform's own API (via Capsf_Api_Factory)
		 * rather than guessing, since a token can stop working at any time
		 * (expired, revoked, permissions changed) regardless of what was saved.
		 *
		 * @since 0.0.1
		 * @return array
		 */
		public function test_platform_connection() {
			// Nonce and capability are verified in capsf_dashboard_ajax_call().
			$platform = isset( $_POST['platform'] ) ? sanitize_key( wp_unslash( $_POST['platform'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// JSON string - every value is sanitized by capsf_sanitize_settings() right after decoding.
			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$settings_raw = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '{}';
			$settings     = json_decode( $settings_raw, true );
			$settings     = is_array( $settings ) ? $this->capsf_sanitize_settings( $settings ) : array();
			$settings     = $this->restore_masked_tokens( $settings, 0 );

			if ( empty( $platform ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Missing platform.', 'captain-social-feed' ) );
			}

			$api = Capsf_Api_Factory::get( $platform );
			if ( ! $api ) {
				return $this->capsf_set_response( false, esc_html__( 'Unsupported platform.', 'captain-social-feed' ) );
			}

			$result = $api->test_connection( $settings );

			return $this->capsf_set_response( ! empty( $result['success'] ), $result['message'] );
		}

		/**
		 * Return just feed_type and card_style for a feed - used by the
		 * Elementor/Gutenberg widget dropdowns to load current values.
		 *
		 * @since 1.3.6
		 * @return array
		 */
		public function get_feed_settings() {
			global $wpdb;

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid feed ID.', 'captain-social-feed' ) );
			}

			$table_name = $wpdb->prefix . 'capsf_feeds';

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$row = $wpdb->get_row(
				$wpdb->prepare( "SELECT feed_type, settings FROM `{$table_name}` WHERE id = %d", $feed_id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				ARRAY_A
			);

			if ( ! $row ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			$settings   = json_decode( $row['settings'], true );
			$settings   = is_array( $settings ) ? $settings : array();
			$card_style = ! empty( $settings['card_style'] ) ? sanitize_text_field( $settings['card_style'] ) : 'style-1';
			$feed_type  = ! empty( $row['feed_type'] ) ? sanitize_text_field( $row['feed_type'] ) : 'Channel';

			return $this->capsf_set_response(
				true,
				'',
				'',
				array(
					'feed_type'  => $feed_type,
					'card_style' => $card_style,
				)
			);
		}

		/**
		 * Save a partial settings update for a feed - used by the
		 * Elementor/Gutenberg widget dropdowns (feed_type, card_style).
		 * Merges into existing settings rather than replacing all.
		 *
		 * @since 1.3.6
		 * @return array
		 */
		public function save_feed_partial() {
			global $wpdb;

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;
			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$feed_type = isset( $_POST['feed_type'] ) ? sanitize_text_field( wp_unslash( $_POST['feed_type'] ) ) : '';
			// phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$card_style = isset( $_POST['card_style'] ) ? sanitize_key( wp_unslash( $_POST['card_style'] ) ) : '';

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid feed ID.', 'captain-social-feed' ) );
			}

			$table_name = $wpdb->prefix . 'capsf_feeds';

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$row = $wpdb->get_row(
				$wpdb->prepare( "SELECT settings FROM `{$table_name}` WHERE id = %d", $feed_id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				ARRAY_A
			);

			if ( ! $row ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			$settings = json_decode( $row['settings'], true );
			$settings = is_array( $settings ) ? $settings : array();

			if ( $card_style ) {
				$settings['card_style'] = $card_style;
			}

			$update_data = array( 'settings' => wp_json_encode( $settings ) );
			if ( $feed_type && in_array( sanitize_key( $feed_type ), Capsf_Api_Factory::get_platforms(), true ) ) {
				$update_data['feed_type'] = sanitize_key( $feed_type );
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$result = $wpdb->update(
				$table_name,
				$update_data,
				array( 'id' => $feed_id ),
				array_fill( 0, count( $update_data ), '%s' ),
				array( '%d' )
			);

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			// Clear only THIS feed's cache so changes show immediately.
			Capsf_Shortcode::clear_feed_transients( $feed_id );

			return $this->capsf_set_response( true, esc_html__( 'Feed updated.', 'captain-social-feed' ) );
		}

		/**
		 * Clear cache
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function set_clear_cache() {
			// Transients and the cache table (whichever storage is in use).
			$total_deleted = Capsf_Cache::flush();

			$response = array(
				'success'       => true,
				'message'       => esc_html__( 'Cache cleared successfully.', 'captain-social-feed' ),
				'total_deleted' => $total_deleted,
			);

			return $this->capsf_set_response( true, esc_html__( 'Cache cleared successfully.', 'captain-social-feed' ), '', $response );
		}

		/**
		 * Item count / size of the cache table, shown on the Settings page.
		 *
		 * @since 0.0.5
		 * @return array
		 */
		public function get_cache_stats() {
			return $this->capsf_set_response( true, '', '', Capsf_Cache::stats() );
		}

		/**
		 * Clear the cached platform API responses for a single feed only.
		 *
		 * Cache keys are hashed from the feed's own token/channel/settings, not
		 * from its ID, so this scopes the delete to every cached transient that
		 * shares this feed's feed_type prefix (capsf_{feed_type}_*) - safe and
		 * always effective, even across a feed's several paginated cache entries.
		 *
		 * @since 1.2.4
		 * @return array
		 */
		public function clear_feed_cache() {
			global $wpdb;

			// Nonce and capability are verified in capsf_dashboard_ajax_call().
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid Feed ID.', 'captain-social-feed' ) );
			}

			if ( ! $this->feed_exists( $feed_id ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}

			$deleted_transients = Capsf_Shortcode::clear_feed_transients( $feed_id );

			return $this->capsf_set_response(
				true,
				esc_html__( 'This feed\'s cache was cleared.', 'captain-social-feed' ),
				'',
				array( 'total_deleted' => (int) $deleted_transients )
			);
		}

		/**
		 * Auto-save only the settings column for a feed.
		 *
		 * Called silently from the React editor whenever a setting that affects
		 * the live preview changes (e.g. card_style, columns, rows). Does NOT
		 * touch feed_name, status, or last_modified so it won't conflict with
		 * a user's unsaved name changes.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function auto_save_settings() {
			global $wpdb;

			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0;
			// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Missing
			$settings = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '';

			if ( $feed_id <= 0 ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid feed ID.', 'captain-social-feed' ) );
			}

			if ( is_string( $settings ) ) {
				$decoded = json_decode( $settings, true );
				if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
					$settings = $this->capsf_sanitize_settings( $decoded );
				} else {
					$settings = array();
				}
			} else {
				$settings = is_array( $settings ) ? $this->capsf_sanitize_settings( $settings ) : array();
			}

			$table_name = $wpdb->prefix . 'capsf_feeds';

			if ( ! $this->feed_exists( $feed_id ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Feed not found.', 'captain-social-feed' ) );
			}
			$settings = $this->restore_masked_tokens( $settings, $feed_id );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$result = $wpdb->update(
				$table_name,
				array( 'settings' => wp_json_encode( $settings ) ),
				array( 'id' => $feed_id ),
				array( '%s' ),
				array( '%d' )
			);

			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'DB Error.', 'captain-social-feed' ), $this->db_error( $wpdb ) );
			}

			// Clear only THIS feed's cached posts (other feeds keep their cache / API quota),
			// and only when something changed (0 rows = identical save, e.g. opening Live Preview).
			if ( $result > 0 ) {
				Capsf_Shortcode::clear_feed_transients( $feed_id );
			}

			return $this->capsf_set_response( true, esc_html__( 'Settings auto-saved.', 'captain-social-feed' ) );
		}

		/**
		 * Get all global plugin settings.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function get_global_settings() {
			$settings = get_option( 'capsf_global_settings', array() );
			return $this->capsf_set_response( true, esc_html__( 'Success.', 'captain-social-feed' ), '', $settings );
		}

		/**
		 * Save a single global plugin setting.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function set_global_setting() {
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$key = isset( $_POST['key'] ) ? sanitize_key( wp_unslash( $_POST['key'] ) ) : '';
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$value = isset( $_POST['value'] ) ? sanitize_text_field( wp_unslash( $_POST['value'] ) ) : '';

			// Allowed keys and the values each one accepts.
			$allowed_values = array(
				'preserve_settings'      => array( '0', '1' ),
				'clear_on_uninstall'     => array( '0', '1' ),
				'fallback_cache_enabled' => array( '0', '1' ),
				'cache_duration'         => array( '1800', '3600', '21600', '43200', '86400' ),
				'cache_storage'          => Capsf_Cache::STORAGES,
			);
			// MCP page: master switch + one switch per ability (see Capsf_Abilities).
			foreach ( array( 'mcp_enabled', 'mcp_ability_list', 'mcp_ability_get', 'mcp_ability_shortcode', 'mcp_ability_diagnose', 'mcp_ability_create', 'mcp_ability_update', 'mcp_ability_duplicate', 'mcp_ability_delete' ) as $mcp_key ) {
				$allowed_values[ $mcp_key ] = array( 'true', 'false' );
			}
			if ( ! $key || ! isset( $allowed_values[ $key ] ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid setting key.', 'captain-social-feed' ) );
			}
			if ( ! in_array( $value, $allowed_values[ $key ], true ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid setting value.', 'captain-social-feed' ) );
			}

			$settings = get_option( 'capsf_global_settings', array() );
			$settings = is_array( $settings ) ? $settings : array();
			$previous = isset( $settings[ $key ] ) ? (string) $settings[ $key ] : '';

			$settings[ $key ] = $value;
			update_option( 'capsf_global_settings', $settings );

			// Switching storage: entries in the old store would never be read
			// again and could resurface stale later, so start clean.
			if ( 'cache_storage' === $key && $previous !== $value ) {
				Capsf_Cache::flush();
			}

			return $this->capsf_set_response( true, esc_html__( 'Setting saved.', 'captain-social-feed' ) );
		}

		/**
		 * Sanitize each field of a decoded settings array.
		 *
		 * Every value coming from $_POST must be sanitized before it is stored in
		 * the database. json_decode() only transforms the data structure; it does
		 * not clean the values. This method applies the most appropriate WordPress
		 * sanitization function to each known settings field.
		 *
		 * @since 1.0.0
		 * @param array $settings Decoded settings array from $_POST.
		 * @return array Sanitized settings array.
		 */
		public function capsf_sanitize_settings( $settings ) {
			if ( ! is_array( $settings ) ) {
				return array();
			}

			$sanitized = array();

			// Known scalar fields and their sanitization callbacks.
			$field_map = array(
				'feed_name'         => 'sanitize_text_field',
				'feed_type'         => 'sanitize_key',
				'status'            => 'sanitize_text_field',
				'card_style'        => 'sanitize_key',
				'platform'          => 'sanitize_key',
				'access_token'      => array( 'Capsf_Api_Base', 'sanitize_token' ),
				'bearer_token'      => array( 'Capsf_Api_Base', 'sanitize_token' ),
				'account_id'        => 'sanitize_text_field',
				'page_id'           => 'sanitize_text_field',
				'board_id'          => 'sanitize_text_field',
				'username'          => 'sanitize_text_field',
				'max_results'       => 'absint',
				'columns'           => 'absint',
				'columns_tablet'    => 'absint',
				'columns_mobile'    => 'absint',
				'show_load_more'    => 'rest_sanitize_boolean',
				'pagination_type'   => 'sanitize_key',
				'initial_videos'    => 'absint',
				'load_more_count'   => 'absint',
				'auto_slide'        => 'rest_sanitize_boolean',
				'infinite_loop'     => 'rest_sanitize_boolean',
				'equal_height'      => 'rest_sanitize_boolean',
				'grid_slider_style' => 'sanitize_key',
				'layout_category'   => 'sanitize_key',
				'video_play_mode'   => 'sanitize_key',
				'style_preset'      => 'sanitize_key',
				'caption_mode'      => 'sanitize_key',
				'post_filter'       => 'sanitize_key',
				'feed_title'        => 'sanitize_text_field',
				'x_source'          => 'sanitize_key',
				'x_query'           => 'sanitize_text_field',
				'x_tweet_ids'       => 'sanitize_textarea_field',
				'x_show_reposts'    => 'rest_sanitize_boolean',
				'x_show_replies'    => 'rest_sanitize_boolean',
				'x_show_header'     => 'rest_sanitize_boolean',
				'caption_length'    => 'absint',
				'show_more_text'    => 'sanitize_text_field',
				'show_less_text'    => 'sanitize_text_field',
			);

			// Known array fields that contain { value, unit } shape - sanitized inline.
			$gap_keys = array( 'column_gap', 'row_gap' );

			// Fields that are deeply-nested arrays - sanitized recursively,
			// NOT flattened with array_map( 'sanitize_text_field' ).
			$deep_array_keys = array( 'style_settings' );

			foreach ( $settings as $key => $value ) {
				$key = sanitize_key( $key );

				if ( isset( $field_map[ $key ] ) ) {
					// Scalar field - use registered callback.
					$sanitized[ $key ] = call_user_func( $field_map[ $key ], $value );

				} elseif ( in_array( $key, $gap_keys, true ) && is_array( $value ) ) {
					// Gap control - { value: int, unit: string }.
					$sanitized[ $key ] = array(
						'value' => isset( $value['value'] ) ? absint( $value['value'] ) : 0,
						'unit'  => isset( $value['unit'] ) ? sanitize_key( $value['unit'] ) : 'px',
					);

				} elseif ( in_array( $key, $deep_array_keys, true ) && is_array( $value ) ) {
					// Deep nested array (e.g. style_settings) - preserve structure,
					// sanitize leaf values individually.
					$sanitized[ $key ] = $this->capsf_sanitize_deep( $value );

				} elseif ( is_array( $value ) ) {
					// Shallow known arrays - sanitize each value as text.
					$sanitized[ $key ] = array_map( 'sanitize_text_field', $value );

				} else {
					// Unknown scalar - fall back to sanitize_text_field.
					$sanitized[ $key ] = sanitize_text_field( $value );
				}
			}

			return $sanitized;
		}

		/**
		 * Recursively sanitize a nested array, preserving structure.
		 * Leaf values are sanitized based on their content type:
		 *   - Hex colors (#rrggbb / #rrggbbaa) → preserved as-is after format check
		 *   - Numeric strings → preserved as-is (floatval check)
		 *   - Booleans → cast to bool
		 *   - Everything else → sanitize_text_field
		 *
		 * @param array $data  Nested array to sanitize.
		 * @return array       Sanitized array with same structure.
		 */
		private function capsf_sanitize_deep( $data ) {
			if ( ! is_array( $data ) ) {
				return $this->capsf_sanitize_leaf( $data );
			}
			$sanitized = array();
			foreach ( $data as $key => $value ) {
				$safe_key               = sanitize_key( $key );
				$sanitized[ $safe_key ] = is_array( $value )
					? $this->capsf_sanitize_deep( $value )
					: $this->capsf_sanitize_leaf( $value );
			}
			return $sanitized;
		}

		/**
		 * Sanitize a single leaf value from style_settings.
		 *
		 * @param mixed $value Leaf value to sanitize.
		 * @return mixed
		 */
		private function capsf_sanitize_leaf( $value ) {
			if ( is_bool( $value ) ) {
				return (bool) $value;
			}
			if ( is_int( $value ) ) {
				return (int) $value;
			}
			if ( is_float( $value ) ) {
				return (float) $value;
			}
			if ( is_numeric( $value ) ) {
				// Keep numeric strings as-is (CSS values like "12", "0.5").
				return $value;
			}
			if ( is_string( $value ) ) {
				// 8-char hex (#rrggbbaa) - allow through for box-shadow alpha colors.
				if ( preg_match( '/^#[0-9a-fA-F]{8}$/', $value ) ) {
					return $value;
				}
				// 6-char hex (#rrggbb).
				$hex = sanitize_hex_color( $value );
				if ( $hex ) {
					return $hex;
				}
				// CSS unit keywords.
				if ( in_array( $value, array( 'px', 'em', 'rem', '%', 'vw', 'vh', 'solid', 'dashed', 'dotted', 'none', 'double', 'groove', 'ridge', 'normal', 'hover' ), true ) ) {
					return $value;
				}
				// Numeric font weight strings like "700".
				if ( preg_match( '/^[0-9]{3}$/', $value ) ) {
					return $value;
				}
				return sanitize_text_field( $value );
			}
			return '';
		}


		/**
		 * Rollback plugin to a specific version using WordPress.org SVN zip.
		 *
		 * @since 1.0.0
		 * @return array
		 */
		public function rollback_version() {

			if ( ! current_user_can( 'update_plugins' ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Permission denied.', 'captain-social-feed' ), esc_html__( 'You do not have permission to install plugins.', 'captain-social-feed' ) );
			}

			// Nonce is verified in capsf_dashboard_ajax_call() before this method is called.
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$version = isset( $_POST['version'] ) ? sanitize_text_field( wp_unslash( $_POST['version'] ) ) : '';

			if ( empty( $version ) || ! preg_match( '/^[0-9]+\\.[0-9]+(\\.[0-9]+)*$/', $version ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid version.', 'captain-social-feed' ), esc_html__( 'The version number provided is not valid.', 'captain-social-feed' ) );
			}

			$plugin_slug = 'captain-social-feed';

			if ( ! function_exists( 'plugins_api' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
			}
			$info = plugins_api(
				'plugin_information',
				array(
					'slug'   => $plugin_slug,
					'fields' => array( 'versions' => true ),
				)
			);
			if ( is_wp_error( $info ) || empty( $info->versions ) || ! isset( $info->versions[ $version ] ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid version.', 'captain-social-feed' ), esc_html__( 'That version is not published on WordPress.org.', 'captain-social-feed' ) );
			}
			$zip_url = esc_url_raw( $info->versions[ $version ] );
			if ( 0 !== strpos( $zip_url, 'https://downloads.wordpress.org/' ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid version.', 'captain-social-feed' ) );
			}

			if ( ! function_exists( 'request_filesystem_credentials' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}
			if ( ! class_exists( 'Plugin_Upgrader' ) ) {
				require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			}

			$skin     = new WP_Ajax_Upgrader_Skin();
			$upgrader = new Plugin_Upgrader( $skin );
			$result   = $upgrader->install( $zip_url, array( 'overwrite_package' => true ) );

			if ( is_wp_error( $result ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Installation failed.', 'captain-social-feed' ), $result->get_error_message() );
			}
			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'Installation failed.', 'captain-social-feed' ), esc_html__( 'Unknown error. Check file permissions.', 'captain-social-feed' ) );
			}

			$plugin_file = $plugin_slug . '/' . $plugin_slug . '.php';
			$activated   = activate_plugin( $plugin_file );

			if ( is_wp_error( $activated ) ) {
				return $this->capsf_set_response( true, esc_html__( 'Installed but not activated.', 'captain-social-feed' ), $activated->get_error_message() );
			}

			/* translators: %s: plugin version number e.g. 1.2.3 */
			return $this->capsf_set_response( true, sprintf( esc_html__( 'Version %s installed and activated successfully.', 'captain-social-feed' ), esc_html( $version ) ), '' );
		}

		/**
		 * Check the install/active status of one or more WordPress.org plugin
		 * slugs (used on the "Our Products" page to render Install / Activate
		 * / Active states for sibling plugins by the same vendor).
		 *
		 * @since 1.2.4
		 * @return array
		 */
		public function get_products_status() {

			if ( ! current_user_can( 'activate_plugins' ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Permission denied.', 'captain-social-feed' ) );
			}

			// Nonce and capability are verified in capsf_dashboard_ajax_call().
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$slugs_raw = isset( $_POST['slugs'] ) ? sanitize_text_field( wp_unslash( $_POST['slugs'] ) ) : '';
			$slugs     = array_filter( array_map( 'sanitize_key', explode( ',', $slugs_raw ) ) );

			if ( ! function_exists( 'get_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			$installed = get_plugins();
			$statuses  = array();

			foreach ( $slugs as $slug ) {
				$status      = 'not_installed';
				$plugin_file = '';

				foreach ( array_keys( $installed ) as $file ) {
					if ( 0 === strpos( $file, $slug . '/' ) ) {
						$plugin_file = $file;
						break;
					}
				}

				if ( $plugin_file ) {
					$status = is_plugin_active( $plugin_file ) ? 'active' : 'installed';
				}

				$statuses[ $slug ] = $status;
			}

			return $this->capsf_set_response( true, '', '', $statuses );
		}

		/**
		 * Install (if needed) and activate a plugin from the WordPress.org
		 * repository, given its slug. Used by the "Our Products" page so
		 * sibling plugins can be installed without leaving the dashboard.
		 *
		 * @since 1.2.4
		 * @return array
		 */
		public function install_activate_product() {

			if ( ! current_user_can( 'install_plugins' ) || ! current_user_can( 'activate_plugins' ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Permission denied.', 'captain-social-feed' ), esc_html__( 'You do not have permission to install plugins.', 'captain-social-feed' ) );
			}

			// Nonce and capability are verified in capsf_dashboard_ajax_call().
			// phpcs:ignore WordPress.Security.NonceVerification.Missing
			$slug = isset( $_POST['slug'] ) ? sanitize_key( wp_unslash( $_POST['slug'] ) ) : '';

			// Only ever allow installing our own known sibling plugins - never
			// an arbitrary attacker-supplied slug.
			$allowed_slugs = array( 'captain-advance-filter', 'captain-widgets-kit', 'captain-social-review' );
			if ( ! in_array( $slug, $allowed_slugs, true ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Invalid plugin.', 'captain-social-feed' ) );
			}

			if ( ! function_exists( 'get_plugins' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin.php';
			}

			// Already installed? Just activate it.
			$installed   = get_plugins();
			$plugin_file = '';
			foreach ( array_keys( $installed ) as $file ) {
				if ( 0 === strpos( $file, $slug . '/' ) ) {
					$plugin_file = $file;
					break;
				}
			}

			if ( $plugin_file ) {
				if ( is_plugin_active( $plugin_file ) ) {
					return $this->capsf_set_response( true, esc_html__( 'Plugin is already active.', 'captain-social-feed' ), '', array( 'status' => 'active' ) );
				}
				$activated = activate_plugin( $plugin_file );
				if ( is_wp_error( $activated ) ) {
					return $this->capsf_set_response( false, esc_html__( 'Activation failed.', 'captain-social-feed' ), $activated->get_error_message() );
				}
				return $this->capsf_set_response( true, esc_html__( 'Plugin activated successfully.', 'captain-social-feed' ), '', array( 'status' => 'active' ) );
			}

			// Not installed yet - fetch it from WordPress.org and install it.
			if ( ! function_exists( 'plugins_api' ) ) {
				require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
			}
			if ( ! function_exists( 'request_filesystem_credentials' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}
			if ( ! class_exists( 'Plugin_Upgrader' ) ) {
				require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
			}

			$api = plugins_api(
				'plugin_information',
				array(
					'slug'   => $slug,
					'fields' => array( 'sections' => false ),
				)
			);

			if ( is_wp_error( $api ) || empty( $api->download_link ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Could not find plugin on WordPress.org.', 'captain-social-feed' ) );
			}

			$skin     = new WP_Ajax_Upgrader_Skin();
			$upgrader = new Plugin_Upgrader( $skin );
			$result   = $upgrader->install( $api->download_link );

			if ( is_wp_error( $result ) ) {
				return $this->capsf_set_response( false, esc_html__( 'Installation failed.', 'captain-social-feed' ), $result->get_error_message() );
			}
			if ( false === $result ) {
				return $this->capsf_set_response( false, esc_html__( 'Installation failed.', 'captain-social-feed' ), esc_html__( 'Unknown error. Check file permissions.', 'captain-social-feed' ) );
			}

			$plugin_file = $upgrader->plugin_info();
			if ( ! $plugin_file ) {
				return $this->capsf_set_response( true, esc_html__( 'Installed, but could not determine plugin file to activate.', 'captain-social-feed' ), '', array( 'status' => 'installed' ) );
			}

			$activated = activate_plugin( $plugin_file );
			if ( is_wp_error( $activated ) ) {
				return $this->capsf_set_response( true, esc_html__( 'Installed but not activated.', 'captain-social-feed' ), $activated->get_error_message(), array( 'status' => 'installed' ) );
			}

			return $this->capsf_set_response( true, esc_html__( 'Plugin installed and activated successfully.', 'captain-social-feed' ), '', array( 'status' => 'active' ) );
		}

		/**
		 * Token fields that must never leave the server in clear text.
		 *
		 * @return string[]
		 */
		private function token_keys() {
			return array( 'access_token', 'bearer_token' );
		}

		/**
		 * Deterministic mask: "abc••••••••wxyz". Real tokens never contain the bullet.
		 *
		 * @param string $token Raw token.
		 * @return string
		 */
		public function mask_token( $token ) {
			$token = (string) $token;
			if ( '' === $token ) {
				return '';
			}
			if ( strlen( $token ) < 12 ) {
				return '••••••••';
			}
			return substr( $token, 0, 3 ) . '••••••••' . substr( $token, -4 );
		}

		/**
		 * Replace token values with their masked form.
		 *
		 * @param array $settings Feed settings.
		 * @return array
		 */
		public function mask_settings_tokens( $settings ) {
			foreach ( $this->token_keys() as $key ) {
				if ( ! empty( $settings[ $key ] ) && is_string( $settings[ $key ] ) ) {
					$settings[ $key ] = $this->mask_token( $settings[ $key ] );
				}
			}
			return $settings;
		}

		/**
		 * If the editor posted a masked token back, swap in the stored secret.
		 * With a feed id we read that feed; without one we only accept an
		 * unambiguous match among stored feeds.
		 *
		 * @param array $settings Sanitized posted settings.
		 * @param int   $feed_id  Feed id (0 = unknown).
		 * @return array
		 */
		private function restore_masked_tokens( $settings, $feed_id = 0 ) {
			global $wpdb;
			$table  = $wpdb->prefix . 'capsf_feeds';
			$stored = array();

			foreach ( $this->token_keys() as $key ) {
				if ( empty( $settings[ $key ] ) || ! is_string( $settings[ $key ] ) || false === strpos( $settings[ $key ], '••' ) ) {
					continue;
				}
				if ( empty( $stored ) ) {
					if ( $feed_id > 0 ) {
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$rows = $wpdb->get_col( $wpdb->prepare( "SELECT settings FROM `{$table}` WHERE id = %d", $feed_id ) );
					} else {
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$rows = $wpdb->get_col( "SELECT settings FROM `{$table}`" );
					}
					foreach ( (array) $rows as $json ) {
						$decoded = json_decode( $json, true );
						if ( is_array( $decoded ) ) {
							$stored[] = $decoded;
						}
					}
				}
				$matches = array();
				foreach ( $stored as $s ) {
					if ( ! empty( $s[ $key ] ) && is_string( $s[ $key ] ) && ( $feed_id > 0 || $this->mask_token( $s[ $key ] ) === $settings[ $key ] ) ) {
						$matches[ $s[ $key ] ] = true;
					}
				}
				// Exactly one candidate → restore; otherwise drop the placeholder (never store it).
				$settings[ $key ] = 1 === count( $matches ) ? (string) key( $matches ) : '';
			}

			return $settings;
		}

		/**
		 * Does a feed row exist?
		 *
		 * @param int $feed_id Feed id.
		 * @return bool
		 */
		private function feed_exists( $feed_id ) {
			global $wpdb;
			$table = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			return (bool) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM `{$table}` WHERE id = %d", absint( $feed_id ) ) );
		}

		/**
		 * Log the raw DB error server-side; give the browser a generic message.
		 *
		 * @param wpdb $wpdb WordPress DB object.
		 * @return string
		 */
		private function db_error( $wpdb ) {
			if ( ! empty( $wpdb->last_error ) && defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( '[captain-social-feed] DB error: ' . $wpdb->last_error );
			}
			return esc_html__( 'A database error occurred. Enable WP_DEBUG_LOG for details.', 'captain-social-feed' );
		}

		/**
		 * Captwiki Set Response
		 *
		 * @since 1.0.0
		 * @param bool   $success    Success.
		 * @param string $message    Message.
		 * @param string $description Description.
		 * @param string $data       Data.
		 */
		public function capsf_set_response( $success = false, $message = '', $description = '', $data = '' ) {

			$response = array(
				'success'     => $success,
				'message'     => esc_html( $message ),
				'description' => esc_html( $description ),
				'data'        => $data,
			);

			return $response;
		}
	}

	Capsf_Dashboard_Ajax::get_instance();
}
