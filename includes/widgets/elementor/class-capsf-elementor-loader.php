<?php
/**
 * Elementor integration loader for Captain Social Feed.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Elementor_Loader' ) ) {

	/**
	 * Manages Elementor custom category and widget registration.
	 */
	class Capsf_Elementor_Loader {

		/**
		 * Instance of this class.
		 *
		 * @var Capsf_Elementor_Loader
		 */
		private static $instance;

		/**
		 * Get instance of this class.
		 *
		 * @return Capsf_Elementor_Loader
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
			// Register custom category.
			add_action( 'elementor/init', array( $this, 'register_elementor_category' ) );
			add_action( 'elementor/elements/categories_registered', array( $this, 'register_elementor_category' ) );

			// Register widget.
			add_action( 'elementor/widgets/register', array( $this, 'register_elementor_widget' ) );

			// Enqueue frontend layout CSS inside Elementor editor.
			add_action( 'elementor/editor/before_enqueue_scripts', array( $this, 'enqueue_editor_assets' ) );
			add_action( 'elementor/preview/enqueue_styles', array( $this, 'enqueue_preview_styles' ) );
		}

		/**
		 * Enqueue all layout CSS in Elementor preview iframe so feed renders correctly.
		 *
		 * @return void
		 */
		public function enqueue_preview_styles() {
			// Same registered handles the widget depends on (single source of truth).
			foreach ( Capsf_Shortcode::get_style_handles() as $handle ) {
				wp_enqueue_style( $handle );
			}
		}

		/**
		 * Enqueue editor panel assets (widget interaction script).
		 *
		 * @return void
		 */
		public function enqueue_editor_assets() {
			// Nothing extra needed in the editor panel itself beyond the widget script.
		}

		/**
		 * Register custom Elementor category.
		 *
		 * @param object|null $elements_manager Elementor elements manager instance.
		 * @return void
		 */
		public function register_elementor_category( $elements_manager = null ) {
			static $category_registered = false;
			if ( $category_registered ) {
				return;
			}

			if ( ! $elements_manager ) {
				if ( class_exists( 'Elementor\Plugin' ) && isset( \Elementor\Plugin::$instance->elements_manager ) ) {
					$elements_manager = \Elementor\Plugin::$instance->elements_manager;
				}
			}

			if ( $elements_manager && method_exists( $elements_manager, 'add_category' ) ) {
				$elements_manager->add_category(
					'captain-social-feed',
					array(
						'title' => esc_html__( 'Captain Social Feed', 'captain-social-feed' ),
						'icon'  => 'eicon-posts-grid',
					),
					1
				);
				$category_registered = true;
			}
		}

		/**
		 * Register Elementor widget.
		 *
		 * @param object $widgets_manager Elementor widgets manager instance.
		 * @return void
		 */
		public function register_elementor_widget( $widgets_manager ) {
			static $registered = false;
			if ( $registered ) {
				return;
			}

			if ( ! class_exists( 'Elementor\Widget_Base' ) || ! class_exists( 'Elementor\Controls_Manager' ) ) {
				return;
			}

			$widget_path = CAPSF_PATH . 'includes/widgets/elementor/class-capsf-elementor-feed-widget.php';

			if ( ! class_exists( 'Capsf_Elementor_Feed_Widget' ) && file_exists( $widget_path ) ) {
				require_once $widget_path;
			}

			if ( class_exists( 'Capsf_Elementor_Feed_Widget' ) ) {
				$widgets_manager->register( new \Capsf_Elementor_Feed_Widget() );
				$registered = true;
			}
		}
	}

	Capsf_Elementor_Loader::get_instance();
}
