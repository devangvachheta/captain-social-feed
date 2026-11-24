<?php
/**
 * The file that defines the load plugin.
 *
 * @since   1.0.0
 *
 * @package captain-social-feed
 * @subpackage captain-social-feed/includes
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Captain Social Feed main plugin loader class
 *
 * @since 1.0.0
 */
if ( ! class_exists( 'Capsf_Plugin_Load' ) ) {

	/**
	 * Captain Social Feed main plugin loader class
	 *
	 * @since 1.0.0
	 */
	class Capsf_Plugin_Load {

		/**
		 * Member Variable
		 *
		 * @var instance
		 */
		private static $instance;

		/**
		 * Initiator
		 *
		 * @since 1.0.0
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
			register_activation_hook( CAPSF_FILE, array( __CLASS__, 'capsf_activation' ) );
			register_deactivation_hook( CAPSF_FILE, array( __CLASS__, 'capsf_deactivation' ) );
			// Uninstall is handled by uninstall.php (WordPress ignores an uninstall hook when that file exists).

			add_action( 'plugins_loaded', array( $this, 'capsf_init_plugin' ) );
		}

		/**
		 * Plugin Activation.
		 *
		 * @since 1.0.0
		 * @param bool $network_wide Whether the plugin is being network-activated.
		 * @return void
		 */
		public static function capsf_activation( $network_wide = false ) {
			if ( is_multisite() && $network_wide ) {
				foreach ( get_sites(
					array(
						'fields' => 'ids',
						'number' => 0,
					)
				) as $site_id ) {
					switch_to_blog( $site_id );
					self::capsf_create_table();
					restore_current_blog();
				}
				return;
			}
			self::capsf_create_table();
		}

		/**
		 * Create / upgrade the table when the stored DB version is behind. Covers
		 * sites added after a network activation and manual / FTP updates.
		 *
		 * @since 0.0.4
		 * @return void
		 */
		public function capsf_maybe_upgrade_db() {
			if ( get_option( 'capsf_db_version' ) !== CAPSF_DB_VERSION ) {
				self::capsf_create_table();
			}
		}

		/**
		 * Plugin deactivation.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public static function capsf_deactivation() {
			wp_clear_scheduled_hook( 'capsf_refresh_tokens' );
		}

		/**
		 * Files load plugin loaded.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public function capsf_init_plugin() {
			$this->capsf_load_dependencies();
			$this->capsf_maybe_upgrade_db();
			Capsf_Token_Refresh::init();
		}

		/**
		 * Load the required dependencies for this plugin.
		 *
		 * @since 1.0.0
		 */
		public function capsf_load_dependencies() {
			// Platform API layer - base class first, then each platform, then the factory.
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-base.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-instagram.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-facebook.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-twitter.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-threads.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-pinterest.php';
			require_once CAPSF_PATH . 'includes/api/class-capsf-api-factory.php';
			require_once CAPSF_PATH . 'includes/class-capsf-token-refresh.php';

			require_once CAPSF_PATH . 'includes/admin/class-capsf-menu.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-dashboard-ajax.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-cache.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-style-css-generator.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-shortcode.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-posttype.php';
			require_once CAPSF_PATH . 'includes/admin/class-capsf-abilities.php';
			require_once CAPSF_PATH . 'includes/widgets/elementor/class-capsf-elementor-loader.php';
			require_once CAPSF_PATH . 'includes/widgets/gutenberg/class-capsf-gutenberg-loader.php';
		}

		/**
		 * Create plugin database table.
		 *
		 * @since 1.0.0
		 * @return void
		 */
		public static function capsf_create_table() {
			global $wpdb;

			$table_name      = $wpdb->prefix . 'capsf_feeds';
			$charset_collate = $wpdb->get_charset_collate();

			$sql = "CREATE TABLE $table_name (
				id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
				feed_name TEXT NOT NULL,
				feed_type TEXT NOT NULL,
				settings LONGTEXT NOT NULL,
				author BIGINT UNSIGNED NOT NULL DEFAULT 1,
				status VARCHAR(255) NOT NULL,
				last_modified DATETIME NOT NULL,
				PRIMARY KEY (id),
				KEY author (author)
			) $charset_collate;";

			require_once ABSPATH . 'wp-admin/includes/upgrade.php';
			dbDelta( $sql );

			// Feed cache table - used when Settings > Cache Storage is "Database table",
			// and always for the last-known-good fallback copy (see Capsf_Cache).
			require_once CAPSF_PATH . 'includes/admin/class-capsf-cache.php';
			dbDelta( Capsf_Cache::schema( $charset_collate ) );

			update_option( 'capsf_db_version', CAPSF_DB_VERSION, false );
			update_option( 'capsf_version', CAPSF_VERSION, false );
		}
	}

	Capsf_Plugin_Load::get_instance();
}
