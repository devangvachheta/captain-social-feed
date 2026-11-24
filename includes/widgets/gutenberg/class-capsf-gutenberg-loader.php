<?php
/**
 * Gutenberg integration loader for Captain Social Feed.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Gutenberg_Loader' ) ) {

	/**
	 * Manages Gutenberg block registration.
	 */
	class Capsf_Gutenberg_Loader {

		/**
		 * Instance of this class.
		 *
		 * @var Capsf_Gutenberg_Loader
		 */
		private static $instance;

		/**
		 * Get instance of this class.
		 *
		 * @return Capsf_Gutenberg_Loader
		 */
		public static function get_instance() {
			if ( ! isset( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}

		/**
		 * Constructor.
		 */
		public function __construct() {
			add_action( 'init', array( $this, 'register_gutenberg_widget' ) );
			add_filter( 'block_categories_all', array( $this, 'register_gutenberg_category' ), 10, 2 );
		}

		/**
		 * Register custom Gutenberg block category.
		 *
		 * @param array  $categories Array of block categories.
		 * @param object $editor_context The current editor context. Unused, but required by the `block_categories_all` filter signature.
		 * @return array
		 */
		public function register_gutenberg_category( $categories, $editor_context ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
			return array_merge(
				$categories,
				array(
					array(
						'slug'  => 'captain-social-feed',
						'title' => esc_html__( 'Captain Social Feed', 'captain-social-feed' ),
						'icon'  => 'video-alt3',
					),
				)
			);
		}

		/**
		 * Register Gutenberg block/widget.
		 *
		 * @return void
		 */
		public function register_gutenberg_widget() {
			$block_path = CAPSF_PATH . 'includes/widgets/gutenberg/class-capsf-gutenberg-feed-block.php';

			if ( ! class_exists( 'Capsf_Gutenberg_Feed_Block' ) && file_exists( $block_path ) ) {
				require_once $block_path;
			}

			if ( class_exists( 'Capsf_Gutenberg_Feed_Block' ) ) {
				Capsf_Gutenberg_Feed_Block::get_instance();
			}
		}
	}

	Capsf_Gutenberg_Loader::get_instance();
}
