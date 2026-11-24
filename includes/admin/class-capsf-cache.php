<?php
/**
 * Feed cache storage.
 *
 * One place that decides WHERE a feed's API response is cached:
 *
 * - "transient" (default): plain WordPress transients, same as before.
 * - "table": the plugin's own `{prefix}capsf_cache` table. Useful on hosts
 *   where an object cache or another plugin keeps wiping transients.
 *
 * Independently of the storage choice, the same table also keeps the last
 * SUCCESSFUL response per cache key (the "fallback cache"), so a temporary
 * platform failure (expired token, rate limit, network hiccup) serves the
 * last known-good posts instead of an empty feed. The fallback can be
 * switched off in Settings.
 *
 * @since   0.0.5
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Cache' ) ) {

	/**
	 * Capsf_Cache class.
	 */
	class Capsf_Cache {

		/**
		 * Allowed storage modes.
		 *
		 * @var string[]
		 */
		const STORAGES = array( 'transient', 'table' );

		/**
		 * Cache table name (with the site prefix).
		 *
		 * @return string
		 */
		public static function table() {
			global $wpdb;
			return $wpdb->prefix . 'capsf_cache';
		}

		/**
		 * SQL for dbDelta() - called from Capsf_Plugin_Load::capsf_create_table().
		 *
		 * @param string $charset_collate Charset / collation clause.
		 * @return string
		 */
		public static function schema( $charset_collate ) {
			$table = self::table();
			return "CREATE TABLE $table (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				cache_key VARCHAR(191) NOT NULL,
				response LONGTEXT NULL,
				expires_at DATETIME NULL DEFAULT NULL,
				last_good LONGTEXT NULL,
				last_success_at DATETIME NULL DEFAULT NULL,
				last_attempt_at DATETIME NULL DEFAULT NULL,
				last_error TEXT NULL,
				PRIMARY KEY  (id),
				UNIQUE KEY cache_key (cache_key)
			) $charset_collate;";
		}

		/**
		 * Global plugin settings.
		 *
		 * @return array
		 */
		private static function global_settings() {
			$settings = get_option( 'capsf_global_settings', array() );
			return is_array( $settings ) ? $settings : array();
		}

		/**
		 * Active storage mode ('transient' | 'table').
		 *
		 * @return string
		 */
		public static function storage() {
			$settings = self::global_settings();
			$storage  = isset( $settings['cache_storage'] ) ? sanitize_key( $settings['cache_storage'] ) : 'transient';
			return in_array( $storage, self::STORAGES, true ) ? $storage : 'transient';
		}

		/**
		 * Whether the last-known-good fallback is kept and served on failures.
		 * On by default.
		 *
		 * @return bool
		 */
		public static function fallback_enabled() {
			$settings = self::global_settings();
			return ! isset( $settings['fallback_cache_enabled'] ) || '0' !== (string) $settings['fallback_cache_enabled'];
		}

		/**
		 * Read a cached value.
		 *
		 * @param string $key Cache key.
		 * @return mixed Cached value, or false when missing / expired.
		 */
		public static function get( $key ) {
			if ( 'table' !== self::storage() ) {
				return get_transient( $key );
			}

			$row = self::get_row( $key );
			if ( empty( $row ) || null === $row['response'] || empty( $row['expires_at'] ) ) {
				return false;
			}
			// Compared in PHP (UTC) so the database server's own timezone never matters.
			if ( strtotime( $row['expires_at'] . ' UTC' ) <= time() ) {
				return false;
			}

			$value = json_decode( $row['response'], true );
			return null === $value ? false : $value;
		}

		/**
		 * Store a value.
		 *
		 * @param string $key   Cache key.
		 * @param mixed  $value Value (must be JSON-encodable).
		 * @param int    $ttl   Lifetime in seconds.
		 * @return void
		 */
		public static function set( $key, $value, $ttl ) {
			$ttl = max( 1, absint( $ttl ) );

			if ( 'table' !== self::storage() ) {
				set_transient( $key, $value, $ttl );
				return;
			}

			self::upsert(
				$key,
				array(
					'response'   => wp_json_encode( $value ),
					'expires_at' => gmdate( 'Y-m-d H:i:s', time() + $ttl ),
				)
			);
		}

		/**
		 * Remember a successful response as the last-known-good fallback.
		 *
		 * @param string $key   Cache key.
		 * @param mixed  $value Successful value.
		 * @return void
		 */
		public static function store_success( $key, $value ) {
			if ( ! self::fallback_enabled() ) {
				return;
			}
			$now = gmdate( 'Y-m-d H:i:s' );
			self::upsert(
				$key,
				array(
					'last_good'       => wp_json_encode( $value ),
					'last_success_at' => $now,
					'last_attempt_at' => $now,
					'last_error'      => null,
				)
			);
		}

		/**
		 * Record a failed attempt and return the last-known-good value, if any.
		 *
		 * @param string $key           Cache key.
		 * @param string $error_message Error message (diagnostics only).
		 * @return mixed|null Last good value, or null when none is stored / fallback is off.
		 */
		public static function store_failure( $key, $error_message ) {
			if ( ! self::fallback_enabled() ) {
				return null;
			}

			$row = self::get_row( $key );
			if ( empty( $row ) ) {
				return null;
			}

			self::upsert(
				$key,
				array(
					'last_attempt_at' => gmdate( 'Y-m-d H:i:s' ),
					'last_error'      => sanitize_text_field( (string) $error_message ),
				)
			);

			return self::get_fallback( $key, $row );
		}

		/**
		 * Last-known-good value for a key.
		 *
		 * @param string     $key Cache key.
		 * @param array|null $row Already loaded row (saves a query).
		 * @return mixed|null
		 */
		public static function get_fallback( $key, $row = null ) {
			if ( ! self::fallback_enabled() ) {
				return null;
			}
			$row = null === $row ? self::get_row( $key ) : $row;
			if ( empty( $row['last_good'] ) ) {
				return null;
			}
			$value = json_decode( $row['last_good'], true );
			return is_array( $value ) ? $value : null;
		}

		/**
		 * Delete the cached value for one key (both storages). The fallback
		 * copy is kept - it is only ever served when a fresh fetch fails.
		 *
		 * @param string $key Cache key.
		 * @return bool True if something was deleted.
		 */
		public static function delete( $key ) {
			global $wpdb;

			$deleted = delete_transient( $key );

			if ( self::table_exists() ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$rows    = $wpdb->query(
					$wpdb->prepare(
						'UPDATE ' . self::table() . ' SET response = NULL, expires_at = NULL WHERE cache_key = %s AND response IS NOT NULL', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
						$key
					)
				);
				$deleted = $deleted || ! empty( $rows );
			}

			return $deleted;
		}

		/**
		 * Delete every cached feed response - all plugin transients and every
		 * row of the cache table (fallback copies included).
		 *
		 * @return int Number of entries removed.
		 */
		public static function flush() {
			global $wpdb;

			$count = 0;

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$names = $wpdb->get_col(
				$wpdb->prepare(
					"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
					$wpdb->esc_like( '_transient_capsf_' ) . '%'
				)
			);
			foreach ( (array) $names as $name ) {
				if ( delete_transient( substr( $name, strlen( '_transient_' ) ) ) ) {
					++$count;
				}
			}

			if ( self::table_exists() ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
				$rows   = $wpdb->query( 'DELETE FROM ' . self::table() );
				$count += absint( $rows );
			}

			return $count;
		}

		/**
		 * Size of the cache table, for the Settings page.
		 *
		 * @return array { item_count: int, size_formatted: string }
		 */
		public static function stats() {
			global $wpdb;

			$items = 0;
			$bytes = 0;
			if ( self::table_exists() ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.NotPrepared
				$row = $wpdb->get_row( 'SELECT COUNT(*) AS items, COALESCE(SUM(LENGTH(response) + LENGTH(last_good)), 0) AS bytes FROM ' . self::table(), ARRAY_A );
				if ( $row ) {
					$items = absint( $row['items'] );
					$bytes = absint( $row['bytes'] );
				}
			}

			return array(
				'item_count'     => $items,
				'size_formatted' => size_format( $bytes ),
			);
		}

		/**
		 * Load one row of the cache table.
		 *
		 * @param string $key Cache key.
		 * @return array|null
		 */
		private static function get_row( $key ) {
			global $wpdb;

			if ( ! self::table_exists() ) {
				return null;
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$row = $wpdb->get_row(
				$wpdb->prepare(
					'SELECT response, expires_at, last_good FROM ' . self::table() . ' WHERE cache_key = %s', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$key
				),
				ARRAY_A
			);

			return $row ? $row : null;
		}

		/**
		 * Insert or update a row's columns.
		 *
		 * @param string $key  Cache key.
		 * @param array  $data Column => value.
		 * @return void
		 */
		private static function upsert( $key, $data ) {
			global $wpdb;

			if ( ! self::table_exists() ) {
				return;
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$exists = $wpdb->get_var(
				$wpdb->prepare(
					'SELECT id FROM ' . self::table() . ' WHERE cache_key = %s', // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
					$key
				)
			);

			if ( $exists ) {
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$wpdb->update( self::table(), $data, array( 'id' => absint( $exists ) ) );
				return;
			}

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->insert( self::table(), array_merge( array( 'cache_key' => $key ), $data ) );
		}

		/**
		 * Whether the cache table exists (it may not until the DB upgrade has run).
		 * Checked once per request.
		 *
		 * @return bool
		 */
		private static function table_exists() {
			static $exists = null;

			if ( null === $exists ) {
				global $wpdb;
				// phpcs:ignore WordPress.DB.DirectDatabaseQuery
				$exists = self::table() === $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $wpdb->esc_like( self::table() ) ) );
			}

			return $exists;
		}
	}
}
