<?php
/**
 * Captain Social Feed - AI Abilities (MCP integration).
 *
 * Registers the plugin's feed management as WordPress Abilities
 * (https://developer.wordpress.org/apis/abilities-api/), available in
 * WordPress 6.9+. Any MCP client (Claude, Cursor, ChatGPT, etc.) connected
 * through an MCP bridge plugin can then list, create, update, duplicate,
 * delete and diagnose feeds.
 *
 * On WordPress versions without the Abilities API this file is a no-op.
 * Every ability is off until the "Enable AI Abilities" switch on the MCP
 * page is on; write / destructive ones also need their own switch.
 *
 * @package captain-social-feed
 * @since 0.1.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Abilities' ) ) {

	/**
	 * Registers the feed abilities.
	 */
	class Capsf_Abilities {

		/**
		 * Singleton instance.
		 *
		 * @var Capsf_Abilities
		 */
		private static $instance;

		/**
		 * Abilities that are safe to leave on by default once the master
		 * switch is on - they can't change anything on the site.
		 *
		 * @var string[]
		 */
		private $read_only_abilities = array( 'list', 'get', 'shortcode', 'diagnose' );

		/**
		 * Get the singleton instance.
		 *
		 * @return Capsf_Abilities
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Hook in - only where the Abilities API exists (WP 6.9+).
		 */
		private function __construct() {
			if ( ! class_exists( 'WP_Ability' ) && ! function_exists( 'wp_register_ability' ) ) {
				return;
			}
			add_action( 'wp_abilities_api_categories_init', array( $this, 'register_category' ) );
			add_action( 'wp_abilities_api_init', array( $this, 'register_abilities' ) );
		}

		/**
		 * Category shown in any Abilities / MCP browser UI.
		 *
		 * @return void
		 */
		public function register_category() {
			if ( ! function_exists( 'wp_register_ability_category' ) ) {
				return;
			}
			wp_register_ability_category(
				'captain-social-feed',
				array(
					'label'       => __( 'Captain Social Feed', 'captain-social-feed' ),
					'description' => __( 'Create and manage social media feeds (Instagram, Facebook, X, Threads, Pinterest) on this site.', 'captain-social-feed' ),
				)
			);
		}

		/**
		 * Master + per-ability switches (MCP page, stored in capsf_global_settings
		 * as the strings 'true' / 'false').
		 *
		 * @param string $ability_key e.g. 'create', 'delete'.
		 * @return bool
		 */
		private function is_enabled( $ability_key ) {
			$settings = get_option( 'capsf_global_settings', array() );
			$settings = is_array( $settings ) ? $settings : array();

			if ( ! isset( $settings['mcp_enabled'] ) || 'true' !== $settings['mcp_enabled'] ) {
				return false;
			}

			$flag = 'mcp_ability_' . $ability_key;
			if ( in_array( $ability_key, $this->read_only_abilities, true ) ) {
				// Read-only: on unless explicitly switched off.
				return ! isset( $settings[ $flag ] ) || 'false' !== $settings[ $flag ];
			}
			// Write / destructive: off unless explicitly switched on.
			return isset( $settings[ $flag ] ) && 'true' === $settings[ $flag ];
		}

		/**
		 * Permission check shared by every ability: an administrator AND the
		 * ability switched on. Never falls back to __return_true.
		 *
		 * @param string $ability_key Ability key.
		 * @return callable
		 */
		private function permission( $ability_key ) {
			return function () use ( $ability_key ) {
				return current_user_can( 'manage_options' ) && $this->is_enabled( $ability_key );
			};
		}

		/**
		 * Feeds table name.
		 *
		 * @return string
		 */
		private function table() {
			global $wpdb;
			return $wpdb->prefix . 'capsf_feeds';
		}

		/**
		 * Shortcode of a feed.
		 *
		 * @param int $feed_id Feed ID.
		 * @return string
		 */
		private function shortcode_for( $feed_id ) {
			return '[captain-social-feed id="' . absint( $feed_id ) . '"]';
		}

		/**
		 * Meta shared by every ability. MCP adapters only expose an ability
		 * when meta.public is true; it is not opted into the REST API.
		 *
		 * @param array $annotations MCP annotations.
		 * @return array
		 */
		private function meta( $annotations ) {
			return array(
				'public'       => true,
				'show_in_rest' => false,
				'annotations'  => $annotations,
			);
		}

		/**
		 * Schema of the feed settings an AI client may set.
		 *
		 * @param string $description Field description.
		 * @return array
		 */
		private function settings_schema( $description ) {
			return array(
				'type'        => 'object',
				'description' => $description,
				'properties'  => array(
					'columns'           => array( 'type' => 'integer' ),
					'columns_tablet'    => array( 'type' => 'integer' ),
					'columns_mobile'    => array( 'type' => 'integer' ),
					'max_results'       => array( 'type' => 'integer' ),
					'layout_category'   => array(
						'type' => 'string',
						'enum' => array( 'grid', 'slider', 'playlist', 'reel' ),
					),
					'card_style'        => array(
						'type' => 'string',
						'enum' => Capsf_Shortcode::CARD_STYLES,
					),
					'post_filter'       => array(
						'type' => 'string',
						'enum' => Capsf_Shortcode::POST_FILTERS,
					),
					'caption_mode'      => array(
						'type' => 'string',
						'enum' => array( 'show_more', 'scroll' ),
					),
					'pagination_type'   => array(
						'type' => 'string',
						'enum' => array( 'none', 'load_more' ),
					),
					'show_channel_name' => array( 'type' => 'boolean' ),
					'show_description'  => array( 'type' => 'boolean' ),
					'show_view_count'   => array( 'type' => 'boolean' ),
					'show_date'         => array( 'type' => 'boolean' ),
					'equal_height'      => array( 'type' => 'boolean' ),
					'video_play_mode'   => array(
						'type' => 'string',
						'enum' => array( 'platform', 'lightbox', 'inline' ),
					),
					'style_preset'      => array(
						'type' => 'string',
						'enum' => array( 'light', 'dark' ),
					),
				),
			);
		}

		/**
		 * Text describing the common settings keys (shared by create / update).
		 *
		 * @return string
		 */
		private function settings_help() {
			return __( 'Common keys: columns / columns_tablet / columns_mobile (int), max_results (int, posts to show), layout_category ("grid", "slider", "playlist" or "reel"), card_style (e.g. "social-2" Social Post, "social-1" Image First, "style-1", "style-2", "style-3", "style-6", "style-8", "reel-1"), post_filter ("all", "video", "photo" or "text"), caption_mode ("show_more" or "scroll"), pagination_type ("none" or "load_more"), show_channel_name / show_description / show_view_count / show_date / equal_height (bool), video_play_mode ("platform" = open the original post, "lightbox" = popup, "inline"), style_preset ("light" or "dark"). Other keys are saved as-is after sanitizing.', 'captain-social-feed' );
		}

		/**
		 * Register every ability.
		 *
		 * @return void
		 */
		public function register_abilities() {
			if ( ! function_exists( 'wp_register_ability' ) ) {
				return;
			}
			$credentials_help = __( 'Instagram: access_token + account_id. Facebook: access_token + page_id. X/Twitter: bearer_token + username. Threads: access_token + account_id. Pinterest: access_token + board_id.', 'captain-social-feed' );

			/* ── List Feeds (read) ───────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/list-feeds',
				array(
					'label'               => __( 'List Social Feeds', 'captain-social-feed' ),
					'description'         => __( 'Lists every social feed on this site with its ID, name, platform and status.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta(
						array(
							'idempotent' => true,
							'readonly'   => true,
						)
					),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array(),
						// Lets clients call it with no arguments at all.
						'default'    => array(),
					),
					'output_schema'       => array(
						'type'  => 'array',
						'items' => array(
							'type'       => 'object',
							'properties' => array(
								'id'            => array( 'type' => 'integer' ),
								'feed_name'     => array( 'type' => 'string' ),
								'feed_type'     => array( 'type' => 'string' ),
								'status'        => array( 'type' => 'string' ),
								'last_modified' => array( 'type' => 'string' ),
							),
						),
					),
					'permission_callback' => $this->permission( 'list' ),
					'execute_callback'    => function () {
						global $wpdb;
						$table = $this->table();
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$rows = $wpdb->get_results( "SELECT id, feed_name, feed_type, status, last_modified FROM `{$table}` ORDER BY last_modified DESC", ARRAY_A );
						return is_array( $rows ) ? $rows : array();
					},
				)
			);

			/* ── Get Feed (read) ─────────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/get-feed',
				array(
					'label'               => __( 'Get Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Returns the details and settings of one feed, plus its shortcode. Access tokens are masked.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta(
						array(
							'idempotent' => true,
							'readonly'   => true,
						)
					),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array(
							'feed_id' => array(
								'type'        => 'integer',
								'description' => __( 'The feed ID (see list-feeds).', 'captain-social-feed' ),
							),
						),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array( 'type' => 'object' ),
					'permission_callback' => $this->permission( 'get' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table   = $this->table();
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$row = $wpdb->get_row( $wpdb->prepare( "SELECT id, feed_name, feed_type, settings, status, last_modified FROM `{$table}` WHERE id = %d", $feed_id ), ARRAY_A );
						if ( ! $row ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}
						$settings = json_decode( $row['settings'], true );
						// Never hand secrets to an AI client.
						$row['settings']  = Capsf_Dashboard_Ajax::get_instance()->mask_settings_tokens( is_array( $settings ) ? $settings : array() );
						$row['shortcode'] = $this->shortcode_for( $feed_id );
						return $row;
					},
				)
			);

			/* ── Get Shortcode (read) ────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/get-shortcode',
				array(
					'label'               => __( 'Get Feed Shortcode', 'captain-social-feed' ),
					'description'         => __( 'Returns the shortcode of a feed, to paste into a page or post.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta(
						array(
							'idempotent' => true,
							'readonly'   => true,
						)
					),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array( 'feed_id' => array( 'type' => 'integer' ) ),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array( 'shortcode' => array( 'type' => 'string' ) ),
					),
					'permission_callback' => $this->permission( 'shortcode' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table   = $this->table();
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$exists = $wpdb->get_var( $wpdb->prepare( "SELECT id FROM `{$table}` WHERE id = %d", $feed_id ) );
						if ( ! $exists ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}
						return array( 'shortcode' => $this->shortcode_for( $feed_id ) );
					},
				)
			);

			/* ── Create Feed (write) ─────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/create-feed',
				array(
					'label'               => __( 'Create Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Creates a new feed for one platform. Credentials:', 'captain-social-feed' ) . ' ' . $credentials_help,
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta( array( 'idempotent' => false ) ),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array(
							'feed_name'    => array( 'type' => 'string' ),
							'platform'     => array(
								'type' => 'string',
								'enum' => Capsf_Api_Factory::get_platforms(),
							),
							'access_token' => array( 'type' => 'string' ),
							'bearer_token' => array( 'type' => 'string' ),
							'account_id'   => array( 'type' => 'string' ),
							'page_id'      => array( 'type' => 'string' ),
							'board_id'     => array( 'type' => 'string' ),
							'username'     => array( 'type' => 'string' ),
							'settings'     => $this->settings_schema( __( 'Display settings.', 'captain-social-feed' ) . ' ' . $this->settings_help() ),
						),
						'required'   => array( 'platform' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array(
							'feed_id'   => array( 'type' => 'integer' ),
							'shortcode' => array( 'type' => 'string' ),
						),
					),
					'permission_callback' => $this->permission( 'create' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table    = $this->table();
						$platform = sanitize_key( $input['platform'] );
						if ( ! in_array( $platform, Capsf_Api_Factory::get_platforms(), true ) ) {
							return new WP_Error( 'capsf_bad_platform', __( 'Unsupported platform.', 'captain-social-feed' ) );
						}

						$settings = isset( $input['settings'] ) && is_array( $input['settings'] ) ? $input['settings'] : array();
						foreach ( array( 'access_token', 'bearer_token', 'account_id', 'page_id', 'board_id', 'username' ) as $field ) {
							if ( ! empty( $input[ $field ] ) ) {
								$settings[ $field ] = $input[ $field ];
							}
						}
						$settings['platform'] = $platform;
						$settings             = Capsf_Dashboard_Ajax::get_instance()->capsf_sanitize_settings( $settings );

						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$count = (int) $wpdb->get_var( "SELECT COUNT(*) FROM `{$table}`" );
						/* translators: 1: platform key, 2: auto-incremented feed number. */
						$feed_name = ! empty( $input['feed_name'] ) ? sanitize_text_field( $input['feed_name'] ) : sprintf( __( '%1$s-%2$d', 'captain-social-feed' ), $platform, $count + 1 );

						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
						$result = $wpdb->insert(
							$table,
							array(
								'feed_name'     => $feed_name,
								'feed_type'     => $platform,
								'settings'      => wp_json_encode( $settings ),
								'author'        => get_current_user_id(),
								'status'        => 'active',
								'last_modified' => current_time( 'mysql' ),
							),
							array( '%s', '%s', '%s', '%d', '%s', '%s' )
						);
						if ( false === $result ) {
							return new WP_Error( 'capsf_db_error', __( 'Failed to create the feed.', 'captain-social-feed' ) );
						}

						$feed_id = (int) $wpdb->insert_id;
						return array(
							'feed_id'   => $feed_id,
							'shortcode' => $this->shortcode_for( $feed_id ),
						);
					},
				)
			);

			/* ── Update Feed (write) ─────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/update-feed',
				array(
					'label'               => __( 'Update Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Updates an existing feed. Omitted fields keep their value - settings are merged into the existing settings, not replaced.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta( array( 'idempotent' => true ) ),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array(
							'feed_id'   => array( 'type' => 'integer' ),
							'feed_name' => array( 'type' => 'string' ),
							'status'    => array(
								'type' => 'string',
								'enum' => array( 'active', 'inactive' ),
							),
							'settings'  => $this->settings_schema( __( 'Settings to change - only the keys you want to change. Call get-feed first if unsure.', 'captain-social-feed' ) . ' ' . $this->settings_help() ),
						),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array( 'feed_id' => array( 'type' => 'integer' ) ),
					),
					'permission_callback' => $this->permission( 'update' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table   = $this->table();
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$existing = $wpdb->get_row( $wpdb->prepare( "SELECT settings FROM `{$table}` WHERE id = %d", $feed_id ), ARRAY_A );
						if ( ! $existing ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}

						$current  = json_decode( $existing['settings'], true );
						$current  = is_array( $current ) ? $current : array();
						$incoming = isset( $input['settings'] ) && is_array( $input['settings'] ) ? $input['settings'] : array();
						// Credentials and platform are not changed through this ability.
						foreach ( array( 'platform', 'access_token', 'bearer_token', 'account_id', 'page_id', 'board_id', 'username' ) as $locked ) {
							unset( $incoming[ $locked ] );
						}
						$merged = Capsf_Dashboard_Ajax::get_instance()->capsf_sanitize_settings( array_merge( $current, $incoming ) );

						$data   = array(
							'settings'      => wp_json_encode( $merged ),
							'last_modified' => current_time( 'mysql' ),
						);
						$format = array( '%s', '%s' );
						if ( ! empty( $input['feed_name'] ) ) {
							$data['feed_name'] = sanitize_text_field( $input['feed_name'] );
							$format[]          = '%s';
						}
						if ( ! empty( $input['status'] ) && in_array( $input['status'], array( 'active', 'inactive' ), true ) ) {
							$data['status'] = $input['status'];
							$format[]       = '%s';
						}

						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
						$result = $wpdb->update( $table, $data, array( 'id' => $feed_id ), $format, array( '%d' ) );
						if ( false === $result ) {
							return new WP_Error( 'capsf_db_error', __( 'Failed to update the feed.', 'captain-social-feed' ) );
						}
						Capsf_Shortcode::clear_feed_transients( $feed_id );

						return array( 'feed_id' => $feed_id );
					},
				)
			);

			/* ── Duplicate Feed (write) ──────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/duplicate-feed',
				array(
					'label'               => __( 'Duplicate Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Creates a copy of an existing feed (same platform and settings) under a new name.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta( array( 'idempotent' => false ) ),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array(
							'feed_id'  => array( 'type' => 'integer' ),
							'new_name' => array( 'type' => 'string' ),
						),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array(
							'feed_id'   => array( 'type' => 'integer' ),
							'shortcode' => array( 'type' => 'string' ),
						),
					),
					'permission_callback' => $this->permission( 'duplicate' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table   = $this->table();
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$source = $wpdb->get_row( $wpdb->prepare( "SELECT feed_name, feed_type, settings, status FROM `{$table}` WHERE id = %d", $feed_id ), ARRAY_A );
						if ( ! $source ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}

						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
						$result = $wpdb->insert(
							$table,
							array(
								'feed_name'     => ! empty( $input['new_name'] ) ? sanitize_text_field( $input['new_name'] ) : $source['feed_name'] . '-copy',
								'feed_type'     => $source['feed_type'],
								'settings'      => $source['settings'],
								'author'        => get_current_user_id(),
								'status'        => $source['status'],
								'last_modified' => current_time( 'mysql' ),
							),
							array( '%s', '%s', '%s', '%d', '%s', '%s' )
						);
						if ( false === $result ) {
							return new WP_Error( 'capsf_db_error', __( 'Failed to duplicate the feed.', 'captain-social-feed' ) );
						}

						$new_id = (int) $wpdb->insert_id;
						return array(
							'feed_id'   => $new_id,
							'shortcode' => $this->shortcode_for( $new_id ),
						);
					},
				)
			);

			/* ── Delete Feed (destructive) ───────────────────────────── */
			wp_register_ability(
				'captain-social-feed/delete-feed',
				array(
					'label'               => __( 'Delete Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Permanently deletes a feed. This cannot be undone.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta(
						array(
							'idempotent'  => true,
							'destructive' => true,
						)
					),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array( 'feed_id' => array( 'type' => 'integer' ) ),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array( 'deleted' => array( 'type' => 'boolean' ) ),
					),
					'permission_callback' => $this->permission( 'delete' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
						$result = $wpdb->delete( $this->table(), array( 'id' => $feed_id ), array( '%d' ) );
						if ( false === $result ) {
							return new WP_Error( 'capsf_db_error', __( 'Failed to delete the feed.', 'captain-social-feed' ) );
						}
						if ( 0 === $result ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}
						Capsf_Shortcode::clear_feed_transients( $feed_id );
						return array( 'deleted' => true );
					},
				)
			);

			/* ── Diagnose Feed (read) ────────────────────────────────── */
			wp_register_ability(
				'captain-social-feed/diagnose-feed',
				array(
					'label'               => __( 'Diagnose Social Feed', 'captain-social-feed' ),
					'description'         => __( 'Checks why a feed might not be showing posts - tests its credentials against the platform and reports any problems found.', 'captain-social-feed' ),
					'category'            => 'captain-social-feed',
					'meta'                => $this->meta(
						array(
							'idempotent' => true,
							'readonly'   => true,
						)
					),
					'input_schema'        => array(
						'type'       => 'object',
						'properties' => array( 'feed_id' => array( 'type' => 'integer' ) ),
						'required'   => array( 'feed_id' ),
					),
					'output_schema'       => array(
						'type'       => 'object',
						'properties' => array(
							'ok'     => array( 'type' => 'boolean' ),
							'issues' => array(
								'type'  => 'array',
								'items' => array( 'type' => 'string' ),
							),
						),
					),
					'permission_callback' => $this->permission( 'diagnose' ),
					'execute_callback'    => function ( $input ) {
						global $wpdb;
						$table   = $this->table();
						$feed_id = absint( $input['feed_id'] );
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
						$row = $wpdb->get_row( $wpdb->prepare( "SELECT feed_type, settings, status FROM `{$table}` WHERE id = %d", $feed_id ), ARRAY_A );
						if ( ! $row ) {
							return new WP_Error( 'capsf_not_found', __( 'No feed found with that ID.', 'captain-social-feed' ) );
						}

						$settings = json_decode( $row['settings'], true );
						$settings = is_array( $settings ) ? $settings : array();
						$platform = ! empty( $settings['platform'] ) ? sanitize_key( $settings['platform'] ) : sanitize_key( $row['feed_type'] );
						$issues   = array();

						if ( 'inactive' === strtolower( trim( (string) $row['status'] ) ) ) {
							$issues[] = __( 'This feed is turned off (status: inactive) - it will not render on the site.', 'captain-social-feed' );
						}

						$api = Capsf_Api_Factory::get( $platform );
						if ( ! $api ) {
							$issues[] = __( 'This feed is not connected to a supported platform.', 'captain-social-feed' );
						} else {
							$test = $api->test_connection( $settings );
							if ( empty( $test['success'] ) ) {
								$issues[] = ! empty( $test['message'] ) ? wp_strip_all_tags( $test['message'] ) : __( 'The platform rejected this feed\'s credentials.', 'captain-social-feed' );
							}
						}

						return array(
							'ok'     => empty( $issues ),
							'issues' => $issues,
						);
					},
				)
			);
		}
	}

	Capsf_Abilities::get_instance();
}
