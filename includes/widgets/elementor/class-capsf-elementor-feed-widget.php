<?php
/**
 * Elementor feed widget - Captain Social Feed.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Elementor\Widget_Base;
use Elementor\Controls_Manager;

if ( class_exists( 'Elementor\Widget_Base' ) && ! class_exists( 'Capsf_Elementor_Feed_Widget' ) ) {

	/**
	 * Elementor widget that renders a Captain Social Feed shortcode.
	 *
	 * The widget only exposes the Feed selector - feed type and
	 * layout/style are managed from the plugin dashboard, not overridden
	 * per widget instance.
	 */
	class Capsf_Elementor_Feed_Widget extends Widget_Base {

		/**
		 * Return the widget name (slug).
		 *
		 * @return string
		 */
		public function get_name() {
			return 'capsf-social-feed';
		}

		/**
		 * Return the widget display title.
		 *
		 * @return string
		 */
		public function get_title() {
			return esc_html__( 'Captain Social Feed', 'captain-social-feed' );
		}

		/**
		 * Return the widget icon (Elementor icon class).
		 *
		 * @return string
		 */
		public function get_icon() {
			return 'eicon-posts-grid';
		}

		/**
		 * Return the Elementor category slug this widget belongs to.
		 *
		 * @return string[]
		 */
		public function get_categories() {
			return array( 'captain-social-feed' );
		}

		/**
		 * Stylesheet handles the widget depends on (loaded in frontend + preview).
		 *
		 * @return string[]
		 */
		public function get_style_depends() {
			return Capsf_Shortcode::get_style_handles();
		}

		// ── Controls ─────────────────────────────────────────────────────

		/**
		 * Register Elementor controls (panel fields).
		 *
		 * @return void
		 */
		protected function register_controls() {

			// ── Feed Settings ────────────────────────────────────────────
			$this->start_controls_section(
				'capsf_content',
				array(
					'label' => esc_html__( 'Feed Settings', 'captain-social-feed' ),
					'tab'   => Controls_Manager::TAB_CONTENT,
				)
			);

			$this->add_control(
				'feed_id',
				array(
					'label'   => esc_html__( 'Social Feed', 'captain-social-feed' ),
					'type'    => Controls_Manager::SELECT,
					'options' => $this->get_feed_options(),
					'default' => '',
				)
			);

			$this->end_controls_section();

			// ── Documentation ─────────────────────────────────────────────
			$this->start_controls_section(
				'capsf_documentation',
				array(
					'label' => esc_html__( 'Documentation', 'captain-social-feed' ),
					'tab'   => Controls_Manager::TAB_CONTENT,
				)
			);

			$create_feed_url = admin_url( 'admin.php?page=captain-social-feed#/create' );

			$this->add_control(
				'capsf_create_feed_help',
				array(
					'type'            => Controls_Manager::RAW_HTML,
					/* translators: link to create a feed */
					'raw'             => '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 14px 16px;line-height:1.5;">' .
						'<p style="margin:0 0 12px;color:#475569;font-size:13px;">' .
						esc_html__( 'If you have not created any feeds yet, create one first from the plugin dashboard.', 'captain-social-feed' ) .
						'</p>' .
						'<a href="' . esc_url( $create_feed_url ) . '" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;background:#2271b1;color:#fff;padding:9px 14px;border-radius:5px;text-decoration:none;font-weight:600;font-size:13px;">' .
						esc_html__( 'Create a Feed', 'captain-social-feed' ) .
						'</a></div>',
					'content_classes' => 'capsf-elementor-docs',
				)
			);

			$this->end_controls_section();
		}

		// ── Helpers ──────────────────────────────────────────────────────

		/**
		 * Build the feed picker options array from the database.
		 *
		 * @return array<string, string>
		 */
		private function get_feed_options() {
			global $wpdb;

			$options    = array( '' => esc_html__( 'None', 'captain-social-feed' ) );
			$table_name = $wpdb->prefix . 'capsf_feeds';

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$feeds = $wpdb->get_results(
				// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
				"SELECT id, feed_name FROM `{$table_name}` ORDER BY last_modified DESC",
				ARRAY_A
			);

			if ( ! empty( $feeds ) && is_array( $feeds ) ) {
				foreach ( $feeds as $feed ) {
					$feed_id = ! empty( $feed['id'] ) ? absint( $feed['id'] ) : 0;
					if ( $feed_id ) {
						$options[ $feed_id ] = ! empty( $feed['feed_name'] )
							? sanitize_text_field( $feed['feed_name'] )
							/* translators: %d: feed ID number */
							: sprintf( esc_html__( 'Feed #%d', 'captain-social-feed' ), $feed_id );
					}
				}
			}

			return $options;
		}

		// ── Render ───────────────────────────────────────────────────────

		/**
		 * Render the widget HTML on the frontend (and in Elementor preview).
		 *
		 * @return void
		 */
		protected function render() {
			$settings = $this->get_settings_for_display();
			$feed_id  = ! empty( $settings['feed_id'] ) ? absint( $settings['feed_id'] ) : 0;

			if ( ! $feed_id ) {
				$create_feed_url = admin_url( 'admin.php?page=captain-social-feed#/create' );
				?>
				<div class="capsf-editor-placeholder" style="padding:40px;text-align:center;background:#ffffff;border:2px dashed #cbd5e1;border-radius:12px;max-width:450px;margin:20px auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
					<h3 style="font-size:16px;font-weight:600;color:#0f172a;margin:0 0 8px;"><?php esc_html_e( 'Captain Social Feed', 'captain-social-feed' ); ?></h3>
					<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 20px;"><?php esc_html_e( 'Select a Feed from the widget settings panel on the left.', 'captain-social-feed' ); ?></p>
					<a href="<?php echo esc_url( $create_feed_url ); ?>" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;background:#2271b1;color:#fff;font-weight:600;font-size:13px;text-decoration:none;padding:10px 18px;border-radius:6px;"><?php esc_html_e( 'Create a Feed', 'captain-social-feed' ); ?></a>
				</div>
				<?php
				return;
			}

			echo wp_kses( do_shortcode( '[captain-social-feed id="' . absint( $feed_id ) . '"]' ), Capsf_Shortcode::allowed_html_tags() );

			// ── Elementor editor fix: print newly-queued assets on AJAX partial renders ──
			// When a widget is dragged into the canvas without a full page reload,
			// Elementor fetches its markup via an AJAX request that calls this
			// render() method directly. Any wp_enqueue_style()/wp_enqueue_script()
			// calls made above (inside the shortcode's own render logic) get queued
			// in $wp_styles/$wp_scripts as usual, but since this AJAX response has
			// no wp_head()/wp_footer() pass, they'd normally never actually be
			// printed - the browser never receives them, so the grid/card CSS
			// silently fails to load even though everything *registered* correctly.
			// A full page load (real frontend, or a full editor iframe refresh)
			// doesn't hit this because wp_head()/wp_footer() print the queue as usual.
			if ( wp_doing_ajax() && did_action( 'elementor/loaded' ) ) {
				ob_start();
				wp_styles()->do_items( array_diff( wp_styles()->queue, wp_styles()->done ) );
				wp_scripts()->do_items( array_diff( wp_scripts()->queue, wp_scripts()->done ) );
				echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
		}
	}
}
