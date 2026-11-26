<?php
/**
 * The file that defines the core plugin class
 *
 * @since      1.0.0
 *
 * @package    captain-social-feed
 * @subpackage captain-social-feed/includes
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Menu' ) ) {

	/**
	 * It is captain-social-feed Main Class
	 *
	 * @since 1.0.0
	 */
	class Capsf_Menu {

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
			add_action( 'admin_menu', array( $this, 'capsf_admin_menu' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'capsf_admin_enqueue_scripts' ), 10, 1 );
		}

		/**
		 * Load the required dependencies for this plugin.
		 *
		 * @since 1.0.0
		 */
		public function capsf_admin_menu() {
			$capability = 'manage_options';

			$setting_name = __( 'Captain Social Feed', 'captain-social-feed' );
			// The sidebar label is shortened to fit the narrow WP admin menu
			// column without wrapping/truncating - the page title (browser
			// tab, submenu "Dashboard" row, etc.) still uses the full name.
			$menu_label   = __( 'Social Feed', 'captain-social-feed' );
			$setting_logo = CAPSF_URL . 'assets/svg/logo/capsf-icon.svg';

			if ( current_user_can( $capability ) ) {
				add_menu_page( $setting_name, $menu_label, 'manage_options', 'captain-social-feed', array( $this, 'capsf_menu_page_template' ), $setting_logo, 69 );

				add_submenu_page(
					'captain-social-feed',
					__( 'Dashboard', 'captain-social-feed' ),
					__( 'Dashboard', 'captain-social-feed' ),
					'manage_options',
					'captain-social-feed',
					array( $this, 'capsf_menu_page_template' )
				);

				add_submenu_page(
					'captain-social-feed',
					__( 'Create Feed', 'captain-social-feed' ),
					__( 'Create Feed', 'captain-social-feed' ),
					'manage_options',
					'admin.php?page=captain-social-feed#/create'
				);

				add_submenu_page(
					'captain-social-feed',
					__( 'Settings', 'captain-social-feed' ),
					__( 'Settings', 'captain-social-feed' ),
					'manage_options',
					'admin.php?page=captain-social-feed#/settings'
				);

				add_submenu_page(
					'captain-social-feed',
					__( 'MCP', 'captain-social-feed' ),
					__( 'MCP', 'captain-social-feed' ),
					'manage_options',
					'admin.php?page=captain-social-feed#/mcp'
				);

				add_submenu_page(
					'captain-social-feed',
					__( 'Documentation', 'captain-social-feed' ),
					__( 'Documentation', 'captain-social-feed' ),
					'manage_options',
					'admin.php?page=captain-social-feed#/docs'
				);
			}
		}

		/**
		 * Top-level menu highlight style:
		 * Give it our brand blue for its "current section" / hover
		 * highlight, regardless of whichever Admin Color Scheme the
		 * user has picked (WP's built-in schemes range from blue to
		 * teal to purple, so without this override our menu item's
		 * highlight colour is inconsistent from install to install).
		 *
		 * @since 1.2.6
		 */
		public function capsf_admin_menu_upgrade_style() {
			$custom_css = '
				#adminmenu #toplevel_page_captain-social-feed.wp-has-current-submenu > a.wp-has-submenu,
				#adminmenu #toplevel_page_captain-social-feed.wp-has-current-submenu.opensub > a.wp-has-submenu,
				#adminmenu #toplevel_page_captain-social-feed:hover > a.menu-top,
				#adminmenu #toplevel_page_captain-social-feed.current > a.menu-top,
				#adminmenu #toplevel_page_captain-social-feed.wp-has-current-submenu a.wp-has-submenu:focus {
					background: #2271b1 !important;
					color: #fff !important;
				}
				#adminmenu #toplevel_page_captain-social-feed.wp-has-current-submenu div.wp-menu-image:before,
				#adminmenu #toplevel_page_captain-social-feed:hover div.wp-menu-image:before {
					color: #fff !important;
				}';

			wp_add_inline_style( 'capsf-ad-admin-css', $custom_css );
		}

		/**
		 * Plugin Html load Here.
		 *
		 * @since 1.0.0
		 */
		public function capsf_menu_page_template() {
			echo '<div id="captain-social-feed-app"></div>';
		}

		/**
		 * Enqueue admin scripts and styles.
		 *
		 * Loads necessary CSS and JavaScript files for the WordPress admin panel.
		 * Assets are only loaded on the plugin's own admin page (hook check).
		 *
		 * @since 1.0.0
		 * @param string $hook The identifier for the current admin page.
		 * @return void
		 */
		public function capsf_admin_enqueue_scripts( $hook ) {

			wp_enqueue_style( 'capsf-ad-admin-css', CAPSF_URL . 'assets/css/admin.css', array(), CAPSF_VERSION );
			$this->capsf_admin_menu_upgrade_style();

			// Only load plugin assets on the plugin's own admin page.
			if ( 'toplevel_page_captain-social-feed' !== $hook ) {
				return;
			}

			$capsf_settings = get_option( 'capsf_settings', array() );

			// Dependencies + cache-busting version come from the build itself, so a rebuilt
			// bundle is never served stale and the script always gets exactly the WP
			// script handles it was compiled against (react, react-jsx-runtime, wp-i18n …).
			$asset_file = CAPSF_PATH . 'build/index.asset.php';
			$asset      = file_exists( $asset_file ) ? include $asset_file : array();
			$asset_deps = ! empty( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array( 'wp-i18n', 'wp-element' );
			$asset_ver  = ! empty( $asset['version'] ) ? $asset['version'] : CAPSF_VERSION;

			wp_enqueue_style( 'capsf-font-style', CAPSF_URL . 'build/index.css', array(), $asset_ver );
			// The Step 2/3 previews of the Social Post designs use the real
			// frontend markup + CSS, so they match the live feed exactly.
			wp_enqueue_style( 'capsf-social-1' );
			wp_enqueue_style( 'capsf-social-2' );
			wp_enqueue_style( 'capsf-x-tweet' );
			// The build step also generates build/index-rtl.css (rtlcss); tell WP core to
			// automatically swap it in for RTL locales instead of always serving the LTR file.
			wp_style_add_data( 'capsf-font-style', 'rtl', 'replace' );

			wp_enqueue_script( 'capsf-ad-script', CAPSF_URL . 'build/index.js', $asset_deps, $asset_ver, true );
			wp_set_script_translations( 'capsf-ad-script', 'captain-social-feed' );
			wp_localize_script(
				'capsf-ad-script',
				'capsf_data',
				array(
					'ajax_url'            => admin_url( 'admin-ajax.php' ),
					'capsf_nonce'         => wp_create_nonce( 'capsf_nonce' ),
					'home_url'            => esc_url( home_url( '/' ) ),
					// Step 4 diagnostic card: the real cache lifetime (seconds).
					'cache_duration'      => class_exists( 'Capsf_Shortcode' ) ? Capsf_Shortcode::get_instance()->get_cache_duration() : 0,
					'capsf_settings'      => $capsf_settings,
					'capsf_version'       => CAPSF_VERSION,
					'plugin_url'          => CAPSF_URL,
					'text_domain'         => 'captain-social-feed',
					'abilities_supported' => class_exists( 'WP_Ability' ),
					'mcp_adapter_active'  => class_exists( 'WP\MCP\Core\McpAdapter' ),
				)
			);
		}
	}

	Capsf_Menu::get_instance();
}
