<?php
/**
 * Gutenberg block registration - Captain Social Feed.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Gutenberg_Feed_Block' ) ) {

	/**
	 * Registers and renders the Captain Social Feed Gutenberg block.
	 */
	class Capsf_Gutenberg_Feed_Block {

		/**
		 * Instance of this class.
		 *
		 * @var Capsf_Gutenberg_Feed_Block
		 */
		private static $instance;

		/**
		 * Get the singleton instance.
		 *
		 * @return Capsf_Gutenberg_Feed_Block
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Constructor - hook into WordPress.
		 */
		public function __construct() {
			// Capsf_Gutenberg_Loader creates this instance DURING `init` - a new
			// `init` callback added at that point would never run, so register now.
			if ( did_action( 'init' ) ) {
				$this->register_block();
			} else {
				add_action( 'init', array( $this, 'register_block' ) );
			}
		}

		// ── Registration ─────────────────────────────────────────────────

		/**
		 * Register the block type and its editor script.
		 *
		 * @return void
		 */
		public function register_block() {
			if ( ! function_exists( 'register_block_type' ) ) {
				return;
			}

			$script_url  = CAPSF_URL . 'includes/widgets/gutenberg/gutenberg-feed-block.js';
			$script_path = CAPSF_PATH . 'includes/widgets/gutenberg/gutenberg-feed-block.js';

			wp_register_script(
				'capsf-gutenberg-block',
				$script_url,
				array( 'wp-blocks', 'wp-element', 'wp-components', 'wp-i18n', 'wp-server-side-render', 'wp-block-editor' ),
				file_exists( $script_path ) ? (string) filemtime( $script_path ) : CAPSF_VERSION,
				true
			);

			// Pass runtime data to the block script.
			$feeds = $this->get_feed_options();
			wp_add_inline_script(
				'capsf-gutenberg-block',
				'window.capsfBlockFeeds=' . wp_json_encode( $feeds ) . ';' .
				'window.capsfCreateFeedUrl="' . esc_url( admin_url( 'admin.php?page=captain-social-feed#/create' ) ) . '";',
				'before'
			);

			register_block_type(
				'captain-social-feed/feed',
				array(
					'api_version'     => 2,
					'editor_script'   => 'capsf-gutenberg-block',
					// The editor shows the server-rendered feed - give it the feed's CSS.
					'editor_style'    => Capsf_Shortcode::get_style_handles(),
					'render_callback' => array( $this, 'render_block_output' ),
					'attributes'      => array(
						'feedId' => array(
							'type'    => 'number',
							'default' => 0,
						),
					),
				)
			);

			// Register block category if the filter is available.
			add_filter( 'block_categories_all', array( $this, 'register_block_category' ), 10, 1 );
		}

		/**
		 * Add a custom block category for the plugin.
		 *
		 * @param  array $categories Existing block categories.
		 * @return array
		 */
		public function register_block_category( $categories ) {
			$slugs = array_column( $categories, 'slug' );
			if ( in_array( 'captain-social-feed', $slugs, true ) ) {
				return $categories;
			}
			return array_merge(
				array(
					array(
						'slug'  => 'captain-social-feed',
						'title' => esc_html__( 'Captain Social Feed', 'captain-social-feed' ),
						'icon'  => null,
					),
				),
				$categories
			);
		}

		// ── Render ───────────────────────────────────────────────────────

		/**
		 * Server-side render callback for the block.
		 *
		 * @param  array $attributes Block attributes.
		 * @return string            Rendered HTML.
		 */
		public function render_block_output( $attributes ) {
			$feed_id = ! empty( $attributes['feedId'] ) ? absint( $attributes['feedId'] ) : 0;

			if ( ! $feed_id ) {
				$create_feed_url = admin_url( 'admin.php?page=captain-social-feed#/create' );
				return sprintf(
					'<div class="capsf-block-placeholder" style="padding:40px;text-align:center;background:#ffffff;border:2px dashed #cbd5e1;border-radius:12px;max-width:450px;margin:20px auto;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">
						<h3 style="font-size:16px;font-weight:600;color:#0f172a;margin:0 0 8px;">%1$s</h3>
						<p  style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 20px;">%2$s</p>
						<a  href="%3$s" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;background:#2271b1;color:#fff;font-weight:600;font-size:13px;text-decoration:none;padding:10px 18px;border-radius:6px;">%4$s</a>
					</div>',
					esc_html__( 'Captain Social Feed', 'captain-social-feed' ),
					esc_html__( 'Please select a feed in the block settings panel.', 'captain-social-feed' ),
					esc_url( $create_feed_url ),
					esc_html__( 'Create a Feed', 'captain-social-feed' )
				);
			}

			return do_shortcode( '[captain-social-feed id="' . absint( $feed_id ) . '"]' );
		}

		// ── Helpers ──────────────────────────────────────────────────────

		/**
		 * Build the feed picker options from the database.
		 *
		 * @return array<int, string> Feed ID → feed name map.
		 */
		private function get_feed_options() {
			global $wpdb;

			$options    = array();
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
	}

	Capsf_Gutenberg_Feed_Block::get_instance();
}
