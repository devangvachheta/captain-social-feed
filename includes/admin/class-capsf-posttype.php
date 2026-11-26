<?php
/**
 * Captain Social Feed - Post Type & Live Preview Page Handler
 *
 * Strategy (same as Captain Social Review pattern):
 *  - CPT is private (public=false) - no archive, no search, no front-end URLs.
 *  - Preview served via ?capsf_preview=FEED_ID query var.
 *  - All CSS/JS via wp_enqueue_style() / wp_add_inline_style() / wp_add_inline_script()
 *    - WordPress.org compliant, no raw <style>/<script> echo.
 *
 * @since      1.0.0
 * @package    captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Posttype' ) ) {

	/**
	 * Handles CPT registration and the standalone preview page.
	 *
	 * @since 1.0.0
	 */
	class Capsf_Posttype {

		/**
		 * Singleton instance.
		 *
		 * @var Capsf_Posttype
		 */
		private static $instance;

		/**
		 * Get the singleton instance.
		 *
		 * @return Capsf_Posttype
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Register all hooks.
		 */
		public function __construct() {
			add_action( 'init', array( $this, 'register_post_type' ) );
			add_action( 'init', array( $this, 'register_preview_query_var' ) );
			add_action( 'template_redirect', array( $this, 'handle_preview_page' ), 1 );
			add_action( 'template_redirect', array( $this, 'redirect_cpt_urls' ), 1 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_preview_assets' ) );
		}

		// ── CPT Registration ──────────────────────────────────────────────────

		/**
		 * Register CPT - completely hidden from front-end.
		 */
		public function register_post_type() {
			register_post_type(
				'capsf_preview_feed',
				array(
					'label'               => __( 'Social Feed Previews', 'captain-social-feed' ),
					'public'              => false,
					'publicly_queryable'  => false,
					'show_ui'             => false,
					'show_in_menu'        => false,
					'show_in_rest'        => false,
					'has_archive'         => false,
					'exclude_from_search' => true,
					'rewrite'             => false,
					'capability_type'     => 'post',
					'supports'            => array( 'title' ),
					'map_meta_cap'        => true,
					'menu_icon'           => 'dashicons-share',
				)
			);
		}

		/**
		 * Register ?capsf_preview=FEED_ID query var.
		 */
		public function register_preview_query_var() {
			add_filter(
				'query_vars',
				function ( $vars ) {
					$vars[] = 'capsf_preview';
					return $vars;
				}
			);
		}

		// ── Asset Enqueueing (WordPress.org standards) ────────────────────────

		/**
		 * Enqueue all preview page assets via WordPress enqueue functions.
		 * Only fires when ?capsf_preview is present.
		 *
		 * Uses:
		 *   wp_register_style()    - register static CSS
		 *   wp_enqueue_style()     - enqueue registered styles
		 *   wp_add_inline_style()  - add inline CSS (no raw <style> echo)
		 *   wp_register_script()   - register static JS
		 *   wp_enqueue_script()    - enqueue registered scripts
		 *   wp_add_inline_script() - add inline JS (no raw <script> echo)
		 */
		public function enqueue_preview_assets() {
			$feed_id = intval( get_query_var( 'capsf_preview' ) );
			if ( ! $feed_id ) {
				return;
			}

			// The feed's own stylesheets, scripts and per-feed CSS are enqueued by
			// the shortcode itself (rendered in handle_preview_page(), before wp_head()).

			// Preview page layout CSS (inline after a virtual handle).
			wp_register_style( 'capsf-preview-layout', false, array(), CAPSF_VERSION ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			wp_enqueue_style( 'capsf-preview-layout' );
			wp_add_inline_style( 'capsf-preview-layout', $this->get_preview_css() );

			// Preview page interaction JS (device switcher).
			wp_register_script( 'capsf-preview-ui', false, array( 'jquery' ), CAPSF_VERSION, true ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			wp_enqueue_script( 'capsf-preview-ui' );
			wp_add_inline_script( 'capsf-preview-ui', $this->get_preview_js() );
		}

		// ── Preview Page Handler ──────────────────────────────────────────────

		/**
		 * Handle ?capsf_preview=FEED_ID - output standalone preview HTML page.
		 * Uses wp_head() / wp_footer() so all WP-enqueued assets are output correctly.
		 */
		public function handle_preview_page() {
			$feed_id = intval( get_query_var( 'capsf_preview' ) );
			if ( ! $feed_id ) {
				return;
			}

			// Admin-only.
			if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
				wp_die(
					esc_html__( 'You must be logged in as an administrator to view this preview.', 'captain-social-feed' ),
					esc_html__( 'Preview Restricted', 'captain-social-feed' ),
					array( 'response' => 403 )
				);
			}

			$feed_settings    = $this->get_feed_settings( $feed_id );
			$shortcode_output = do_shortcode( '[captain-social-feed id="' . absint( $feed_id ) . '"]' );

			// Feed name for title bar.
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- admin-only preview, plugin's own table, must be live.
			$feed_name = $wpdb->get_var( $wpdb->prepare( "SELECT feed_name FROM {$wpdb->prefix}capsf_feeds WHERE id = %d", $feed_id ) );

			$editor_url = admin_url( 'admin.php?page=captain-social-feed#/edit?id=' . absint( $feed_id ) );
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display flag only, admin-only page.
			$is_embed = ! empty( $_GET['capsf_embed'] );

			nocache_headers();
			?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="robots" content="noindex, nofollow">
	<title><?php echo $feed_name ? esc_html( $feed_name ) : esc_html__( 'Feed Preview', 'captain-social-feed' ); ?> &mdash; <?php esc_html_e( 'Captain Social Feed', 'captain-social-feed' ); ?></title>
			<?php wp_head(); ?>
</head>
<body class="capsf-preview-page<?php if ( $is_embed ) : ?> capsf-preview-embed<?php endif; ?>">

			<?php if ( ! $is_embed ) : ?>
	<!-- ── Top bar ── -->
	<div class="capsf-prev-bar">
		<a class="capsf-prev-bar-back" href="<?php echo esc_url( $editor_url ); ?>">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
				<?php esc_html_e( 'Back to Editor', 'captain-social-feed' ); ?>
		</a>

		<span class="capsf-prev-bar-center">
				<?php echo $feed_name ? esc_html( $feed_name ) : esc_html__( 'Feed Preview', 'captain-social-feed' ); ?>
			&middot;
			<strong><?php esc_html_e( 'LIVE PREVIEW', 'captain-social-feed' ); ?></strong>
		</span>

		<div class="capsf-prev-bar-actions">
			<div class="capsf-prev-devices" role="group" aria-label="<?php esc_attr_e( 'Device preview', 'captain-social-feed' ); ?>">
				<button class="capsf-prev-device-btn active" data-frame="desktop">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
					<?php esc_html_e( 'Desktop', 'captain-social-feed' ); ?>
				</button>
				<button class="capsf-prev-device-btn" data-frame="tablet">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
					<?php esc_html_e( 'Tablet', 'captain-social-feed' ); ?>
				</button>
				<button class="capsf-prev-device-btn" data-frame="mobile">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
					<?php esc_html_e( 'Mobile', 'captain-social-feed' ); ?>
				</button>
			</div>

			<a href="<?php echo esc_url( $editor_url ); ?>" class="capsf-prev-close">
				&times; <?php esc_html_e( 'Close Preview', 'captain-social-feed' ); ?>
			</a>
		</div>
	</div>
	<?php endif; ?>

	<!-- ── Preview canvas ── -->
	<div class="capsf-prev-canvas">
		<div class="capsf-prev-frame" id="capsfFrame">
			<?php if ( ! empty( $shortcode_output ) && strlen( trim( wp_strip_all_tags( $shortcode_output ) ) ) > 0 ) : ?>
				<?php echo wp_kses( $shortcode_output, Capsf_Shortcode::allowed_html_tags() ); ?>
			<?php elseif ( $feed_id > 0 ) : ?>
				<div class="capsf-prev-empty">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
					</svg>
					<h3><?php esc_html_e( 'No posts to display', 'captain-social-feed' ); ?></h3>
					<p>
						<?php esc_html_e( 'Go to the feed editor → Connect step → enter your platform credentials, then save.', 'captain-social-feed' ); ?>
						<br><br>
						<?php esc_html_e( 'Your shortcode:', 'captain-social-feed' ); ?>
						<code>[captain-social-feed id="<?php echo absint( $feed_id ); ?>"]</code>
					</p>
				</div>
			<?php else : ?>
				<div class="capsf-prev-empty">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
					<h3><?php esc_html_e( 'Invalid feed ID', 'captain-social-feed' ); ?></h3>
					<p><?php esc_html_e( 'Please open this preview from the feed editor.', 'captain-social-feed' ); ?></p>
				</div>
			<?php endif; ?>
		</div>
	</div>

			<?php wp_footer(); ?>
</body>
</html>
			<?php
			exit;
		}

		/**
		 * Redirect stray CPT front-end URLs to home.
		 */
		public function redirect_cpt_urls() {
			if ( isset( $_GET['post_type'] ) && 'capsf_preview_feed' === $_GET['post_type'] ) { // phpcs:ignore WordPress.Security.NonceVerification
				wp_safe_redirect( home_url( '/' ), 301 );
				exit;
			}
			if ( is_post_type_archive( 'capsf_preview_feed' ) || is_singular( 'capsf_preview_feed' ) ) {
				wp_safe_redirect( home_url( '/' ), 301 );
				exit;
			}
		}

		// ── Helpers ──────────────────────────────────────────────────────────

		/**
		 * Get decoded feed settings from DB.
		 *
		 * @param int $feed_id Feed ID.
		 * @return array
		 */
		private function get_feed_settings( $feed_id ) {
			if ( ! $feed_id ) {
				return array();
			}
			global $wpdb;
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- admin-only preview, plugin's own table, must be live.
			$row = $wpdb->get_row( $wpdb->prepare( "SELECT settings FROM {$wpdb->prefix}capsf_feeds WHERE id = %d", $feed_id ), ARRAY_A );
			if ( empty( $row['settings'] ) ) {
				return array();
			}
			$decoded = json_decode( $row['settings'], true );
			return is_array( $decoded ) ? $decoded : array();
		}

		/**
		 * Preview page layout CSS - passed to wp_add_inline_style(), NOT echoed.
		 *
		 * @return string
		 */
		private function get_preview_css() {
			return '
html, body {
	margin: 0;
	background: #f0f2f5;
	min-height: 100vh;
	font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
	color: #1a1a1a;
	-webkit-font-smoothing: antialiased;
}

.capsf-preview-page #wpadminbar,
.capsf-preview-page .wp-toolbar { display: none !important; }
html.wp-toolbar { padding-top: 0 !important; }

/* ── Top bar ── */
.capsf-prev-bar {
	position: fixed;
	top: 0; left: 0; right: 0;
	height: 52px;
	background: #1f2937;
	border-bottom: 1px solid #374151;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 20px;
	z-index: 9999;
	gap: 16px;
}

.capsf-prev-bar-back {
	display: flex;
	align-items: center;
	gap: 7px;
	font-size: 13px;
	font-weight: 700;
	color: #f9fafb;
	text-decoration: none;
	white-space: nowrap;
}
.capsf-prev-bar-back svg { width: 17px; height: 17px; }
.capsf-prev-bar-back:hover { color: #93c5fd; }

.capsf-prev-bar-center {
	font-size: 12px;
	color: #9ca3af;
	flex: 1;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.capsf-prev-bar-center strong { color: #d1d5db; }

.capsf-prev-bar-actions {
	display: flex;
	align-items: center;
	gap: 8px;
	flex-shrink: 0;
}

/* ── Device switcher ── */
.capsf-prev-devices {
	display: flex;
	gap: 3px;
	background: #111827;
	border-radius: 8px;
	padding: 4px;
}

.capsf-prev-device-btn {
	background: transparent;
	border: none;
	color: #9ca3af;
	cursor: pointer;
	padding: 5px 10px;
	border-radius: 6px;
	font-size: 12px;
	font-family: inherit;
	display: flex;
	align-items: center;
	gap: 5px;
	transition: background .15s, color .15s;
	white-space: nowrap;
}
.capsf-prev-device-btn svg { width: 14px; height: 14px; }
.capsf-prev-device-btn:hover { background: #374151; color: #e5e7eb; }
.capsf-prev-device-btn.active { background: #2271B1; color: #fff; }

/* ── Close ── */
.capsf-prev-close {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	background: #374151;
	color: #d1d5db;
	border: 1px solid #4b5563;
	border-radius: 7px;
	padding: 6px 13px;
	font-size: 12px;
	font-weight: 600;
	text-decoration: none;
	font-family: inherit;
	transition: background .15s, color .15s;
	white-space: nowrap;
}
.capsf-prev-close:hover { background: #4b5563; color: #fff; }

/* ── Canvas ── */
.capsf-prev-canvas {
	padding-top: 72px;
	padding-bottom: 48px;
	min-height: 100vh;
	display: flex;
	align-items: flex-start;
	justify-content: center;
}

/* ── Frame ── */
.capsf-prev-frame {
	width: 100%;
	max-width: 1200px;
	background: #ffffff;
	border-radius: 12px;
	padding: 28px;
	margin: 0 20px;
	box-shadow: 0 4px 24px rgba(0,0,0,.10);
	transition: max-width .3s ease;
	min-height: 300px;
	border: 1px solid #e5e7eb;
	overflow: hidden;
	box-sizing: border-box;
}
.capsf-prev-frame.tablet { max-width: 768px; }
.capsf-prev-frame.mobile { max-width: 390px; border-radius: 24px; }

/* ── Embed mode (editor Live Preview modal): no bar, no frame chrome ── */
.capsf-preview-embed .capsf-prev-canvas {
	padding: 16px 0;
	min-height: 0;
}
.capsf-preview-embed .capsf-prev-frame {
	max-width: none;
	margin: 0 16px;
	padding: 0;
	border: 0;
	border-radius: 0;
	box-shadow: none;
	background: transparent;
	overflow: visible;
}

/* ── Empty state ── */
.capsf-prev-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 14px;
	min-height: 280px;
	color: #9ca3af;
	text-align: center;
}
.capsf-prev-empty svg { width: 48px; height: 48px; stroke: #4b5563; }
.capsf-prev-empty h3 { font-size: 18px; color: #374151; margin: 0; }
.capsf-prev-empty p { font-size: 13px; line-height: 1.7; margin: 0; color: #6b7280; }
.capsf-prev-empty code {
	display: inline-block;
	background: #f3f4f6;
	border: 1px solid #e5e7eb;
	border-radius: 6px;
	padding: 4px 10px;
	font-size: 13px;
	color: #2271B1;
	margin-top: 8px;
}
			';
		}

		/**
		 * Preview page JS - device switcher. Passed to wp_add_inline_script(), NOT echoed.
		 *
		 * @return string
		 */
		private function get_preview_js() {
			return '
(function () {
	"use strict";

	var frame   = document.getElementById("capsfFrame");
	var buttons = document.querySelectorAll(".capsf-prev-device-btn");

	if ( ! frame || ! buttons.length ) { return; }

	buttons.forEach(function (btn) {
		btn.addEventListener("click", function () {
			var device = this.dataset.frame;
			frame.classList.remove("tablet", "mobile");
			buttons.forEach(function (b) { b.classList.remove("active"); });
			if ("desktop" !== device) { frame.classList.add(device); }
			this.classList.add("active");
		});
	});
})();
			';
		}
	}

	Capsf_Posttype::get_instance();
}
