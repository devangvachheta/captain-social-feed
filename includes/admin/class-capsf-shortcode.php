<?php
/**
 * Captain Social Feed Shortcode.
 *
 * @since 1.0.0
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
 * Capsf_Shortcode.
 *
 * @since 1.0.0
 * */
if ( ! class_exists( 'Capsf_Shortcode' ) ) {

	/**
	 * Capsf_Shortcode
	 *
	 * @since 1.0.0
	 */
	class Capsf_Shortcode {

		/**
		 * Slider display modes (Step 2 "Slider" toggle → "Style").
		 *   slider-1 → Equal Cards: side arrows + dots.
		 *   slider-2 → Spotlight: active card enlarged in the center.
		 *   slider-3 → Carousel: counter + arrows above, progress bar below.
		 *
		 * @var string[]
		 */
		const SLIDER_MODES = array( 'slider-1', 'slider-2', 'slider-3' );

		/**
		 * Every card design that can be rendered. Any other saved value falls
		 * back to 'style-1'.
		 *
		 * @var string[]
		 */
		const CARD_STYLES = array( 'social-1', 'social-2', 'style-1', 'style-2', 'style-3', 'style-6', 'style-8', 'reel-1', 'x-timeline', 'x-grid' );

		/**
		 * Twitter / X designs - X feeds use only these two, other platforms never.
		 *
		 * @var string[]
		 */
		const X_STYLES = array( 'x-timeline', 'x-grid' );

		/**
		 * Grid-family designs (can be a Slider, or one centered "Single" card).
		 *
		 * @var string[]
		 */
		const GRID_STYLES = array( 'social-1', 'social-2', 'style-1', 'style-2', 'style-3', 'style-8' );

		/**
		 * Social Post designs - author header, caption with Show More / scroll,
		 * like / comment / share row.
		 *
		 * @var string[]
		 */
		const SOCIAL_STYLES = array( 'social-1', 'social-2' );

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
		 * Render counter used to keep multiple shortcode instances isolated.
		 *
		 * @var int
		 */
		private static $render_instance = 0;

		/**
		 * Tracks whether load-more inline CSS has been printed.
		 *
		 * @var bool
		 */
		private static $load_more_css_printed = false;

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
			add_shortcode( 'captain-social-feed', array( $this, 'render_feed_shortcode' ) );
			add_action( 'init', array( $this, 'register_styles' ) );
			add_action( 'wp_ajax_capsf_load_more_videos', array( $this, 'ajax_load_more_videos' ) );
			add_action( 'wp_ajax_nopriv_capsf_load_more_videos', array( $this, 'ajax_load_more_videos' ) );
		}

		/**
		 * Register all layout stylesheets.
		 *
		 * @return void
		 */
		public function register_styles() {
			// Shared by every design: platform icons, play icon, Social Post parts.
			wp_register_style( 'capsf-frontend', CAPSF_URL . 'assets/css/frontend.css', array(), CAPSF_VERSION, 'all' );
			$deps = array( 'capsf-frontend' );
			wp_register_style( 'capsf-social-1', CAPSF_URL . 'includes/layouts/cards/social-1/social-1.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-social-2', CAPSF_URL . 'includes/layouts/cards/social-2/social-2.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-style-1', CAPSF_URL . 'includes/layouts/cards/style-1/card.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-style-2', CAPSF_URL . 'includes/layouts/cards/style-2/style-2.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-style-3', CAPSF_URL . 'includes/layouts/cards/style-3/style-3.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-style-6', CAPSF_URL . 'includes/layouts/cards/style-6/card.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-style-8', CAPSF_URL . 'includes/layouts/cards/style-8/card.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-reel-1', CAPSF_URL . 'includes/layouts/cards/reel-1/card.css', $deps, CAPSF_VERSION, 'all' );
			// Both X designs share one stylesheet; the per-design handles only pull it in.
			wp_register_style( 'capsf-x-tweet', CAPSF_URL . 'includes/layouts/cards/x-tweet/x-tweet.css', $deps, CAPSF_VERSION, 'all' );
			wp_register_style( 'capsf-x-timeline', false, array( 'capsf-x-tweet' ), CAPSF_VERSION );
			wp_register_style( 'capsf-x-grid', false, array( 'capsf-x-tweet' ), CAPSF_VERSION );
			wp_register_script( 'capsf-caption', CAPSF_URL . 'assets/js/capsf-caption.js', array(), CAPSF_VERSION, true );
			// Simple Grid: the post popup (photo / album slider / video).
			wp_register_script( 'capsf-post-popup', CAPSF_URL . 'assets/js/capsf-post-popup.js', array(), CAPSF_VERSION, true );
			wp_register_style( 'capsf-glightbox', CAPSF_URL . 'assets/css/glightbox.min.css', array(), CAPSF_VERSION, 'all' );
		}

		/**
		 * Every stylesheet a feed can need. Page builders whose editor renders the
		 * feed without a normal page load (Elementor preview, the block editor)
		 * load all of them up front - see the Elementor widget and Gutenberg block.
		 *
		 * @return string[] Registered style handles.
		 */
		public static function get_style_handles() {
			return array( 'capsf-frontend', 'capsf-social-1', 'capsf-social-2', 'capsf-style-1', 'capsf-style-2', 'capsf-style-3', 'capsf-style-6', 'capsf-style-8', 'capsf-reel-1', 'capsf-x-tweet', 'capsf-glightbox' );
		}

		/**
		 * Shortcode Function
		 *
		 * @since 1.0.0
		 * @param array $atts Shortcode attributes.
		 * @return string Shortcode output.
		 */
		public function render_feed_shortcode( $atts ) {

			$atts = shortcode_atts(
				array(
					'id' => '0',
				),
				$atts
			);

			$feed_id = intval( $atts['id'] );

			$feed_data = $this->get_query_userfeed( $feed_id );

			// Don't render if feed is inactive.
			if ( ! empty( $feed_data['status'] ) && 'inactive' === strtolower( trim( $feed_data['status'] ) ) ) {
				return '';
			}

			$feed_settings = ! empty( $feed_data['settings'] ) && is_array( $feed_data['settings'] ) ? $feed_data['settings'] : array();
			$feed_type     = ! empty( $feed_data['feed_type'] ) ? strtolower( trim( $feed_data['feed_type'] ) ) : '';

			// "Show Title" / "Show Channel Name" - Step 4 (Settings). Default
			// to true so existing feeds saved before these existed keep
			// showing everything, exactly as before.
			$capsf_show_title   = ! isset( $feed_settings['show_title'] ) || $feed_settings['show_title'];
			$capsf_show_channel = ! isset( $feed_settings['show_channel_name'] ) || $feed_settings['show_channel_name'];
			$capsf_show_desc    = ! isset( $feed_settings['show_description'] ) || $feed_settings['show_description'];

			// "Show View Count" (drives duration badge + views) / "Show Date"
			// (drives the "1 week ago" label) - Step 4 (Settings). On by
			// default; only off if the user explicitly unchecks it.
			$capsf_show_stats = ! isset( $feed_settings['show_view_count'] ) || $feed_settings['show_view_count'];
			$capsf_show_date  = ! isset( $feed_settings['show_date'] ) || $feed_settings['show_date'];

			$max_results_limit = ! empty( $feed_settings['max_results'] ) ? absint( $feed_settings['max_results'] ) : 6;

			// Slider layouts (Slider Style 1/2/3) never show a "Load More"
			// button - every fetched post already sits in one scrollable
			// track. Skip pagination entirely for them, otherwise only the
			// "Initial Posts" batch would ever be fetched, silently capping
			// the slider below Max Posts with no button to fetch the rest.
			$capsf_feed_is_slider = in_array( $feed_settings['grid_slider_style'] ?? '', self::SLIDER_MODES, true );
			$load_more_settings   = $capsf_feed_is_slider
				? $this->get_load_more_settings( array( 'pagination_type' => 'none' ), $max_results_limit )
				: $this->get_load_more_settings( $feed_settings, $max_results_limit );

			if ( ! empty( $load_more_settings['enabled'] ) ) {
				$feed_data['settings']['api_max_results'] = $load_more_settings['initial'];
			}

			$capsf_loop_data = $this->get_platform_posts( $feed_data );

			if ( is_wp_error( $capsf_loop_data ) ) {
				return $this->get_error_markup( $capsf_loop_data );
			}

			ob_start();

			if ( ! empty( $capsf_loop_data['items'] ) ) {

					// ── Standard card layouts ───────────────────────────────────
					$card_style = ! empty( $feed_settings['card_style'] ) ? sanitize_key( $feed_settings['card_style'] ) : 'style-1';

					// Only allow known styles. Any saved style that no longer
					// exists safely falls back to 'style-1' instead of erroring.
				$card_style = self::resolve_card_style( $card_style, $feed_type, $feed_settings );

					wp_enqueue_style( 'capsf-' . $card_style );

					// Simple Grid: every post opens in the post popup.
				if ( 'style-8' === $card_style ) {
					wp_enqueue_script( 'capsf-post-popup' );
				}

				// Social Post designs: "Show More" toggle script.
				if ( in_array( $card_style, self::SOCIAL_STYLES, true ) && 'scroll' !== ( $feed_settings['caption_mode'] ?? '' ) ) {
					wp_enqueue_script( 'capsf-caption' );
				}

					// ── "Single Videos" feed type + Classic Card / Professional /
					// Dark Cinematic (style-1/2/3): these 3 designs also work for
					// a Single Videos feed - no new style is built for this, the
					// SAME style-1/2/3 card template is reused, just displayed
					// differently depending on how many video IDs were entered:
					// - exactly 1 video  → a single centered card
					// - more than 1      → the SAME slider mechanism already
					// used for Slider style 1 is reused,
					// instead of building a new slider
					// each time.
					$capsf_is_grid_style = in_array( $card_style, self::GRID_STYLES, true );
					// "Slider" applies on top of the 3 grid designs AND the
					// Reel Card design - any of these can be shown as a
					// slider. "Single Videos" centered/slider behavior below
					// stays grid-only (Reel was never a "Single" category
					// option), hence the separate $capsf_is_grid_style check.
					$capsf_is_slider_capable = $capsf_is_grid_style || 'reel-1' === $card_style;
					$capsf_is_single_feed    = ( 0 === strcasecmp( $feed_type, 'single videos' ) );
					// "Single" is also selectable as a Step 2 category for a
					// non-"Single Videos" feed type (e.g. Channel, Playlist) -
					// it isn't gated to the dedicated feed type there. In that
					// case there's no "how many video IDs were entered" to go
					// by (it's a normal multi-video query), so it always
					// renders as ONE centered card using just the first
					// fetched video - never a slider of the whole feed.
					$capsf_is_single_category = ! empty( $feed_settings['layout_category'] ) && 'single' === $feed_settings['layout_category'];
					$capsf_single_grid_style  = ( $capsf_is_single_feed || $capsf_is_single_category ) && $capsf_is_grid_style;
					$capsf_single_item_count  = ! $capsf_single_grid_style
						? 0
						: ( $capsf_is_single_feed ? count( $capsf_loop_data['items'] ) : 1 );
					$capsf_single_as_slider   = $capsf_single_grid_style && $capsf_single_item_count > 1;
					$capsf_single_as_centered = $capsf_single_grid_style && $capsf_single_item_count <= 1;

					// ── "Slider" display mode (v2.0.0) - applies on top of any
					// of the 3 grid designs OR the Reel Card design, chosen in
					// Step 2 ("Layout: Grid/Reel + Slider toggle" → "Style:
					// 1/2"). Not its own design.
					// 'slider-1' → full-width track, arrows at the far edges
					// (same mechanism the old standalone "Slider"
					// style-5 design used)
					// 'slider-2' → active card enlarged/centered, side cards
					// peeking, arrows beside the active card
					// (same mechanism the old standalone
					// "Centered Carousel" / style-7 design used)
					// A "Single Videos" feed with 2+ video IDs always uses
					// slider-1 automatically (see $capsf_single_as_slider
					// above) - the Slider toggle isn't shown for that feed
					// type in Step 2, so there's nothing for the user to pick there.
				if ( $capsf_single_as_slider ) {
					$capsf_slider_mode = 'slider-1';
				} elseif ( $capsf_single_as_centered ) {
					// Never let a leftover/stale grid_slider_style value
					// leak in here - a single centered card always wins.
					$capsf_slider_mode = '';
				} elseif ( $capsf_is_slider_capable && ! $capsf_is_single_feed && ! $capsf_is_single_category ) {
					$capsf_slider_mode = ! empty( $feed_settings['grid_slider_style'] ) ? sanitize_key( $feed_settings['grid_slider_style'] ) : '';
					if ( ! in_array( $capsf_slider_mode, self::SLIDER_MODES, true ) ) {
						$capsf_slider_mode = '';
					}
				} else {
					$capsf_slider_mode = '';
				}

					// ── Generate scoped inline CSS from style_settings ─────────────────────
					$all_inline_css = '';

					$style_settings    = ! empty( $feed_settings['style_settings'] ) ? $feed_settings['style_settings'] : array();
					$css_generator     = new Capsf_Style_CSS_Generator( $feed_id, $style_settings, $card_style );
					$element_style_css = $css_generator->get_css(); // raw CSS string, no <style> tag.
				if ( ! empty( $element_style_css ) ) {
					$all_inline_css .= $element_style_css;
				}

					// ── Social Post designs - "Mode" Dark preset ──
				// Their CSS (assets/css/frontend.css) is driven by custom
				// properties; set the dark palette here, before the Styles-tab
				// CSS below so the user's own colours still win.
				if ( in_array( $card_style, self::SOCIAL_STYLES, true ) && ! empty( $feed_settings['style_preset'] ) && 'dark' === $feed_settings['style_preset'] ) {
					$all_inline_css .= '.capsf-feed-' . absint( $feed_id ) . '{' .
						'--capsf-sc-bg:#1e293b;' .
						'--capsf-sc-border:#334155;' .
						'--capsf-sc-text:#cbd5e1;' .
						'--capsf-sc-heading:#f1f5f9;' .
						'--capsf-sc-muted:#94a3b8;' .
						'--capsf-more-color:#f1f5f9;' .
						'--capsf-sb-thumb:#475569;' .
						'}';
				}

				if ( in_array( $card_style, self::X_STYLES, true ) && ! empty( $feed_settings['style_preset'] ) && 'dark' === $feed_settings['style_preset'] ) {
					$all_inline_css .= '.capsf-feed-' . absint( $feed_id ) . '{' .
						'--capsf-x-bg:#15202b;' .
						'--capsf-x-border:#38444d;' .
						'--capsf-x-text:#f7f9f9;' .
						'--capsf-x-muted:#8b98a5;' .
						'--capsf-x-hover:#1e2732;' .
						'}';
				}

				// ── Styles tab panels (Step 4) ──
					// Playlist-family card styles (one featured post + a list -
					// style-6) get their own panel CSS; every other card style
					// uses the shared Background / Title / Description / Image /
					// Stats panels. Keep in sync with PLAYLIST_CARD_STYLES in edit_feed.jsx.
				if ( 'style-6' === $card_style ) {
					$all_inline_css .= Capsf_Style_CSS_Generator::get_playlist_panel_css( $feed_id, $feed_settings, $card_style );
				} else {
					$all_inline_css .= Capsf_Style_CSS_Generator::get_panel_css( $feed_id, $feed_settings, $card_style );
				}

					// ── Scoped selectors - defined once, used by gap + columns CSS ──
					$scope     = '.capsf-feed-' . absint( $feed_id );
					$grid_sels = $scope . ' .capsf-card-list,' .
								$scope . ' .capsf-s3-list,' .
								$scope . ' .capsf-reel-grid';

					// ── Playlist (style-6) - "Mode" preset (Light/Dark) support ──
					// Style-6's CSS (card.css) is already written against CSS
					// custom properties (--capsf-card-bg, --capsf-s6-title,
					// etc.) with light-mode fallback values, but - unlike
					// style-1/2/3 - it isn't wired into Capsf_Style_CSS_Generator
					// (it has no per-element Style tab controls), so those
					// variables were never actually being SET when "Dark Mode"
					// was selected: the front end always fell back to the
					// hardcoded light defaults. This sets them directly from
					// the same preset colors Step 3 (Mode) uses for the other
					// card styles.
				if ( 'style-6' === $card_style && ! empty( $feed_settings['style_preset'] ) && 'dark' === $feed_settings['style_preset'] ) {
					$all_inline_css .= $scope . '{' .
						'--capsf-card-bg:#1e293b;' .
						'--capsf-card-border:#334155;' .
						'--capsf-card-shadow:0 4px 20px rgba(0,0,0,0.4);' .
						'--capsf-s6-title:#f1f5f9;' .
						'--capsf-s6-meta:#94a3b8;' .
						'}';
				}

					// ── "Show Title" / "Show Description" / "Show Channel Name"
					// (Step 4 Settings) ── The 7 card styles each mark up
					// title/description/channel differently (different class
					// names, some with an icon "badge" wrapper around the
					// channel name, description only exists on style-1 and
					// style-3) - rather than touching every template, this
					// hides the right container per style with scoped CSS,
					// generated once here and reused for anything the "Load
					// More" button appends afterwards (that AJAX response is
					// inserted into this same scope, so it picks up these
					// rules automatically).
				if ( ! $capsf_show_title || ! $capsf_show_channel || ! $capsf_show_desc ) {
					$title_channel_sels = array(
						'style-1'    => array(
							'title'       => $scope . ' .capsf-s1-title',
							'channel'     => $scope . ' .capsf-s1-channel-info',
							'description' => $scope . ' .capsf-s1-description',
						),
						'style-2'    => array(
							'title'   => $scope . ' .capsf-card-body h3',
							'channel' => $scope . ' .capsf-card-badge,' . $scope . ' .capsf-card-channel',
						),
						'style-3'    => array(
							'title'       => $scope . ' .capsf-s3-title',
							'channel'     => $scope . ' .capsf-s3-meta',
							'description' => $scope . ' .capsf-s3-desc',
						),
						'style-6'    => array(
							'title'   => $scope . ' .capsf-s6-featured-title,' . $scope . ' .capsf-s6-title',
							'channel' => $scope . ' .capsf-s6-featured-channel,' . $scope . ' .capsf-s6-ch',
						),
						'reel-1'     => array(
							'title' => $scope . ' .capsf-reel-title',
						),
						'social-1'   => array(
							'title'       => $scope . ' .capsf-sc-nothing',
							'channel'     => $scope . ' .capsf-sc-author-name',
							'description' => $scope . ' .capsf-sc-caption',
						),
						'social-2'   => array(
							'title'       => $scope . ' .capsf-sc-nothing',
							'channel'     => $scope . ' .capsf-sc-author-name',
							'description' => $scope . ' .capsf-sc-caption',
						),
						'x-timeline' => array(
							'title'       => $scope . ' .capsf-sc-nothing',
							'channel'     => $scope . ' .capsf-x-names',
							'description' => $scope . ' .capsf-x-text',
						),
						'x-grid'     => array(
							'title'       => $scope . ' .capsf-sc-nothing',
							'channel'     => $scope . ' .capsf-x-names',
							'description' => $scope . ' .capsf-x-text',
						),
					);
					// Note: $card_style is only ever 'style-1'/'2'/'3'/'6'/'reel-1'
					// at this point - Slider style 1/2 (see
					// $capsf_slider_mode) reuse these SAME selectors,
					// they don't change $card_style, they only change the
					// wrapper the cards sit inside.

					if ( isset( $title_channel_sels[ $card_style ] ) ) {
						$sels = $title_channel_sels[ $card_style ];
						if ( ! $capsf_show_title ) {
							$all_inline_css .= $sels['title'] . '{display:none!important;}';
						}
						if ( ! $capsf_show_channel ) {
							$all_inline_css .= $sels['channel'] . '{display:none!important;}';
						}
						if ( ! $capsf_show_desc && ! empty( $sels['description'] ) ) {
							$all_inline_css .= $sels['description'] . '{display:none!important;}';
						}
					}
				}

					// ── Gap - column_gap and row_gap from GapControl { value, unit } ──
					// (Not applicable to any Slider mode or the "Single Videos"
					// centered mode - those get their own spacing instead of a
					// grid gap: the slider uses --s5-gap/--s7 track gap, and the
					// centered single card doesn't need a gap at all.)
				if ( '' === $capsf_slider_mode && ! $capsf_single_as_centered ) {
					$col_gap_val  = ! empty( $feed_settings['column_gap']['value'] ) ? absint( $feed_settings['column_gap']['value'] ) : 20;
					$col_gap_unit = ! empty( $feed_settings['column_gap']['unit'] ) ? sanitize_key( $feed_settings['column_gap']['unit'] ) : 'px';
					$row_gap_val  = ! empty( $feed_settings['row_gap']['value'] ) ? absint( $feed_settings['row_gap']['value'] ) : 20;
					$row_gap_unit = ! empty( $feed_settings['row_gap']['unit'] ) ? sanitize_key( $feed_settings['row_gap']['unit'] ) : 'px';

					$gap_css         = $grid_sels . '{column-gap:' . $col_gap_val . $col_gap_unit . '!important;row-gap:' . $row_gap_val . $row_gap_unit . '!important;}';
					$all_inline_css .= $gap_css;

					// ── Columns - responsive, injected via wp_add_inline_style() ──
					$col_desktop = max( 1, min( 4, ! empty( $feed_settings['columns'] ) ? absint( $feed_settings['columns'] ) : 3 ) );
					$col_tablet  = max( 1, min( 4, ! empty( $feed_settings['columns_tablet'] ) ? absint( $feed_settings['columns_tablet'] ) : min( 2, $col_desktop ) ) );
					$col_mobile  = max( 1, min( 4, ! empty( $feed_settings['columns_mobile'] ) ? absint( $feed_settings['columns_mobile'] ) : 1 ) );

					// Desktop (default - no media query needed).
					$columns_css = $grid_sels . '{grid-template-columns:repeat(' . $col_desktop . ',minmax(0,1fr))!important;}';
					// Tablet ≤ 1024px.
					$columns_css .= '@media(max-width:1024px){' . $grid_sels . '{grid-template-columns:repeat(' . $col_tablet . ',minmax(0,1fr))!important;}}';
					// Mobile ≤ 640px.
					$columns_css    .= '@media(max-width:640px){' . $grid_sels . '{grid-template-columns:repeat(' . $col_mobile . ',minmax(0,1fr))!important;}}';
					$all_inline_css .= $columns_css;

					if ( 'x-grid' === $card_style ) {
						$x_sel           = $scope . ' .capsf-x-grid';
						$all_inline_css .= $x_sel . '{columns:' . $col_desktop . ';column-gap:' . $col_gap_val . $col_gap_unit . ';}'
							. $x_sel . ' > *{margin-bottom:' . $row_gap_val . $row_gap_unit . ';}'
							. '@media(max-width:1024px){' . $x_sel . '{columns:' . $col_tablet . ';}}'
							. '@media(max-width:640px){' . $x_sel . '{columns:' . $col_mobile . ';}}';
					}
				} elseif ( $capsf_single_as_centered ) {
					// One video - a single centered card, no grid at all.
					$all_inline_css .= $scope . ' .capsf-single-centered{display:flex;justify-content:center;}';
					$all_inline_css .= $scope . ' .capsf-single-centered .capsf-single-card-wrap{width:100%;max-width:420px;}';
				}

					// Scoped CSS injected via wp_add_inline_style().
				if ( ! empty( $all_inline_css ) ) {
					wp_add_inline_style( 'capsf-' . $card_style, wp_strip_all_tags( $all_inline_css ) );
				}

					// ── Video Play Mode - 'platform' (default), 'lightbox' or 'inline' ──────────────
					$video_play_mode = ! empty( $feed_settings['video_play_mode'] )
						? sanitize_key( $feed_settings['video_play_mode'] )
						: 'platform';

					// "Load More" doesn't apply to a slider - a slider already
					// shows/scrolls through every loaded video, there's no
					// separate paginated grid to append into. Covers Slider
					// style 1 and Slider style 2 (see $capsf_slider_mode),
					// including when reused for a "Single Videos" feed with
					// 2+ videos. Also doesn't apply to a single centered card
					// - there's only ever the one video shown, nothing to load more of.
					$capsf_is_slider_layout = ( '' !== $capsf_slider_mode ) || $capsf_single_as_centered;

				if ( ! empty( $load_more_settings['enabled'] ) && ! $capsf_is_slider_layout ) {
					$this->enqueue_load_more_assets();
				}

				if ( 'lightbox' === $video_play_mode ) {
					wp_enqueue_style( 'capsf-glightbox' );
					wp_enqueue_script(
						'capsf-glightbox',
						CAPSF_URL . 'assets/js/glightbox.min.js',
						array(),
						CAPSF_VERSION,
						true
					);
					// Init GLightbox scoped to this feed.
					wp_add_inline_script(
						'capsf-glightbox',
						'document.addEventListener("DOMContentLoaded",function(){' .
						'if(typeof GLightbox!=="undefined"){' .
						'GLightbox({selector:".capsf-feed-' . absint( $feed_id ) . ' .capsf-glightbox",touchNavigation:true,loop:false,autoplayVideos:true});' .
						'}});'
					);
				} elseif ( 'inline' === $video_play_mode ) {
					wp_enqueue_script( 'capsf-inline-play', CAPSF_URL . 'assets/js/capsf-inline-play.js', array(), CAPSF_VERSION, true );
				}

					// Wrapper class per style.
					$wrapper_class_map = array(
						'style-1'    => 'capsf-card-list',
						'style-2'    => 'capsf-card-list',
						'style-3'    => 'capsf-s3-list',
						'style-6'    => 'capsf-s6-wrapper',
						'style-8'    => 'capsf-card-list',
						'social-1'   => 'capsf-card-list',
						'social-2'   => 'capsf-card-list',
						'reel-1'     => 'capsf-reel-grid',
						'x-timeline' => 'capsf-x-list',
						'x-grid'     => 'capsf-x-grid',
					);
					$wrapper_class     = isset( $wrapper_class_map[ $card_style ] ) ? $wrapper_class_map[ $card_style ] : 'capsf-card-list';

					// v2.0.0: "Slider" (either style) or a "Single Videos" feed
					// with 1 video: swap the wrapper - the card markup itself
					// (style-1/2/3.php) is always unchanged.
					// Slider Style 1 and Style 3 share the same track mechanism
					// (style-5/card.css + capsf-slider.js); Style 3 only adds the
					// "--carousel" modifier (counter + arrows toolbar, progress bar).
					$capsf_is_s5_slider = ( 'slider-1' === $capsf_slider_mode || 'slider-3' === $capsf_slider_mode );

					if ( $capsf_single_as_centered ) {
						$wrapper_class = 'capsf-single-centered';
					} elseif ( $capsf_is_s5_slider ) {
						$wrapper_class = 'capsf-s5-track';
					} elseif ( 'slider-2' === $capsf_slider_mode ) {
						$wrapper_class = 'capsf-s7-track';
					}

					// Equal Card Height (Behaviors tab, off by default): cards in the same
					// row stretch to the tallest one, a one-line title still reserves two
					// lines, and the bottom row is pinned to the card's bottom edge. Only
					// for the plain grid of the styles with text below the image (1, 2) -
					// style-3 is an overlay card, style-8 is image-only and sliders /
					// single / playlist have their own layouts. CSS lives in each
					// style's own stylesheet.
					if (
						'capsf-card-list' === $wrapper_class
						&& in_array( $card_style, array( 'style-1', 'style-2', 'social-1', 'social-2' ), true )
					) {
						// Off: cards keep their own height (a grid stretches them by default).
						$wrapper_class .= ( ! empty( $feed_settings['equal_height'] ) && rest_sanitize_boolean( $feed_settings['equal_height'] ) )
							? ' capsf-equal-h'
							: ' capsf-natural-h';
					}

					$instance_id = $this->get_shortcode_instance_id( $feed_id );

					// ── Slider style 1 / 3 - enqueue slider CSS + JS ────────────────
					// The same mechanism the old standalone "Slider" / style-5
					// design used - now reused for any grid design in Slider
					// style 1 or 3 mode, and for a "Single Videos" feed with 2+ videos.
					if ( $capsf_is_s5_slider ) {
						wp_enqueue_style(
							'capsf-style-5',
							CAPSF_URL . 'includes/layouts/cards/style-5/card.css',
							array(),
							CAPSF_VERSION,
							'all'
						);
						wp_enqueue_script(
							'capsf-slider',
							CAPSF_URL . 'assets/js/capsf-slider.js',
							array(),
							CAPSF_VERSION,
							true
						);
					}

					// ── Slider style 2 - enqueue centered-carousel CSS + JS ─────────
					// The same mechanism the old standalone "Centered Carousel" /
					// style-7 design used - now reused for any grid design in
					// Slider style 2 mode.
					if ( 'slider-2' === $capsf_slider_mode ) {
						wp_enqueue_style(
							'capsf-style-7',
							CAPSF_URL . 'includes/layouts/cards/style-7/card.css',
							array(),
							CAPSF_VERSION,
							'all'
						);
						wp_enqueue_script(
							'capsf-centered-slider',
							CAPSF_URL . 'assets/js/capsf-centered-slider.js',
							array(),
							CAPSF_VERSION,
							true
						);
					}

					// ── Style-6: Playlist - enqueue playlist CSS + click-to-play-in-main-player JS ──
					if ( 'style-6' === $card_style ) {
						wp_enqueue_style(
							'capsf-style-6',
							CAPSF_URL . 'includes/layouts/cards/style-6/card.css',
							array(),
							CAPSF_VERSION,
							'all'
						);
						wp_enqueue_script(
							'capsf-playlist',
							CAPSF_URL . 'assets/js/capsf-playlist.js',
							array(),
							CAPSF_VERSION,
							true
						);
					}

					// ── Outer scoped wrapper ────────────────────────────────────────
					?>
					<div class="capsf-feed capsf-feed-<?php echo absint( $feed_id ); ?> capsf-feed-instance-<?php echo esc_attr( $instance_id ); ?>"
						data-capsf-instance="<?php echo esc_attr( $instance_id ); ?>"
						data-capsf-label-slide="<?php esc_attr_e( 'Slide %d', 'captain-social-feed' ); ?>"
						data-capsf-label-stop="<?php esc_attr_e( 'Stop video', 'captain-social-feed' ); ?>"
						data-capsf-label-player="<?php esc_attr_e( 'Video player', 'captain-social-feed' ); ?>"
						data-capsf-label-close="<?php esc_attr_e( 'Close', 'captain-social-feed' ); ?>"
						data-capsf-label-prev="<?php esc_attr_e( 'Previous photo', 'captain-social-feed' ); ?>"
						data-capsf-label-next="<?php esc_attr_e( 'Next photo', 'captain-social-feed' ); ?>"
						data-capsf-label-prevpost="<?php esc_attr_e( 'Previous post', 'captain-social-feed' ); ?>"
						data-capsf-label-nextpost="<?php esc_attr_e( 'Next post', 'captain-social-feed' ); ?>">
					<?php

					// Section title (Settings → Layout), any design.
					if ( ! empty( $feed_settings['feed_title'] ) ) {
						echo '<h2 class="capsf-feed-title">' . esc_html( $feed_settings['feed_title'] ) . '</h2>';
					}

					// X Profile Timeline / Sidebar Widget: profile header + scrolling list.
					$capsf_x_source = 'twitter' === $feed_type ? Capsf_Api_Twitter::get_source( $feed_settings ) : '';
					if ( 'x-timeline' === $card_style ) {
						?>
						<div class="<?php echo esc_attr( 'capsf-x-timeline' . ( 'sidebar' === $capsf_x_source ? ' capsf-x-timeline--sidebar' : '' ) ); ?>">
						<?php
						$capsf_profile = ! empty( $capsf_loop_data['profile'] ) && is_array( $capsf_loop_data['profile'] ) ? $capsf_loop_data['profile'] : array();
						if ( $capsf_profile && ( ! isset( $feed_settings['x_show_header'] ) || rest_sanitize_boolean( $feed_settings['x_show_header'] ) ) ) {
							require CAPSF_PATH . 'includes/layouts/partials/x-profile.php';
						}
					}

					// Slider style 1 / 3: outer wrapper - same mechanism the old
					// standalone "Slider" / style-5 design used, now reused for
					// any grid design in Slider style 1 or 3 mode, and for a
					// "Single Videos" feed with 2+ videos (only $col_count's
					// source differs). Style 3 swaps the side arrows + dots for
					// a counter + arrows toolbar ABOVE the track and a progress
					// bar below it (the "--carousel" modifier).
					if ( $capsf_is_s5_slider ) {
						$col_count     = $capsf_single_as_slider
							? min( max( 1, $capsf_single_item_count ), 3 )
							: max( 1, min( 4, ! empty( $feed_settings['columns'] ) ? absint( $feed_settings['columns'] ) : 3 ) );
						$col_gap       = ! empty( $feed_settings['column_gap']['value'] ) ? absint( $feed_settings['column_gap']['value'] ) : 16;
						$auto_slide    = ! isset( $feed_settings['auto_slide'] ) || rest_sanitize_boolean( $feed_settings['auto_slide'] );
						$infinite_loop = ! isset( $feed_settings['infinite_loop'] ) || rest_sanitize_boolean( $feed_settings['infinite_loop'] );
						$is_carousel   = ( 'slider-3' === $capsf_slider_mode );
						// Counter/progress bar count in "pages" of $col_count cards
						// each - the same unit capsf-slider.js tracks, so the number
						// shown before JS runs matches what JS keeps in sync.
						$page_count = max( 1, (int) ceil( count( $capsf_loop_data['items'] ) / max( 1, $col_count ) ) );

						?>
						<div role="region" aria-roledescription="<?php esc_attr_e( 'carousel', 'captain-social-feed' ); ?>" aria-label="<?php esc_attr_e( 'Posts', 'captain-social-feed' ); ?>" class="<?php echo esc_attr( 'capsf-s5-wrapper' . ( $is_carousel ? ' capsf-s5-wrapper--carousel' : '' ) ); ?>" style="--s5-cols:<?php echo absint( $col_count ); ?>;--s5-gap:<?php echo absint( $col_gap ); ?>px" data-auto-slide="<?php echo esc_attr( $auto_slide ? '1' : '0' ); ?>" data-infinite-loop="<?php echo esc_attr( $infinite_loop ? '1' : '0' ); ?>">
						<?php
						if ( $is_carousel ) {
							?>
							<div class="capsf-s5-toolbar">
								<span class="capsf-s5-counter" data-total="<?php echo absint( $page_count ); ?>">01 / <?php echo esc_html( str_pad( (string) $page_count, 2, '0', STR_PAD_LEFT ) ); ?></span>
								<?php
								self::print_slider_button( 'capsf-s5', 'prev' );
								self::print_slider_button( 'capsf-s5', 'next' );
								?>
							</div>
							<?php
						} else {
							self::print_slider_button( 'capsf-s5', 'prev' );
						}
						echo '<div class="' . esc_attr( $wrapper_class ) . '" data-capsf-grid>';
					} elseif ( 'slider-2' === $capsf_slider_mode ) {
						// Slider style 2: outer wrapper with arrows + dots -
						// same mechanism the old standalone "Centered
						// Carousel" / style-7 design used.
						$auto_slide    = ! isset( $feed_settings['auto_slide'] ) || rest_sanitize_boolean( $feed_settings['auto_slide'] );
						$infinite_loop = ! isset( $feed_settings['infinite_loop'] ) || rest_sanitize_boolean( $feed_settings['infinite_loop'] );
						?>
						<div role="region" aria-roledescription="<?php esc_attr_e( 'carousel', 'captain-social-feed' ); ?>" aria-label="<?php esc_attr_e( 'Posts', 'captain-social-feed' ); ?>" class="capsf-s7-wrapper" data-auto-slide="<?php echo esc_attr( $auto_slide ? '1' : '0' ); ?>" data-infinite-loop="<?php echo esc_attr( $infinite_loop ? '1' : '0' ); ?>">
						<?php
						self::print_slider_button( 'capsf-s7', 'prev' );
						echo '<div class="' . esc_attr( $wrapper_class ) . '" data-capsf-grid>';
					} elseif ( 'style-6' === $card_style ) {
						// Playlist: open the wrapper div (closed later alongside the other styles).
						// data-capsf-grid lives on .capsf-s6-list (in style-6.php), not here,
						// so "Load More" appends new items inside the list only (not after the button).
						echo '<div class="' . esc_attr( $wrapper_class ) . '">';
					} else {
						echo '<div class="' . esc_attr( $wrapper_class ) . '" data-capsf-grid>';
					}

					$capsf_s6_index = 0;
					// A "Single" category design on a non-"Single Videos" feed
					// (see $capsf_is_single_category above) only ever shows
					// the first fetched video, not the whole feed.
					$capsf_render_items = ( $capsf_single_as_centered && ! $capsf_is_single_feed )
						? array_slice( $capsf_loop_data['items'], 0, 1, true )
						: $capsf_loop_data['items'];

					foreach ( $capsf_render_items as $index => $item ) {

						$title       = esc_html( $item['title'] );
						$description = esc_html( $item['description'] );
						$channel     = esc_html( $capsf_loop_data['channelTitle'] );
						$video_link  = esc_url( $item['video_link'] );

						$thumb = $item['thumbnail'];

						$default    = ! empty( $thumb['default'] ) ? esc_url( $thumb['default'] ) : '';
						$medium     = ! empty( $thumb['medium'] ) ? esc_url( $thumb['medium'] ) : $default;
						$high       = ! empty( $thumb['high'] ) ? esc_url( $thumb['high'] ) : $medium;
						$embed_link = ! empty( $item['video_url'] ) ? esc_url( $item['video_url'] ) : '';
						$video_id   = ! empty( $item['video_id'] ) ? preg_replace( '/[^A-Za-z0-9_-]/', '', $item['video_id'] ) : '';

						// No "duration" concept for social posts - badge simply
						// never renders (every card template null-checks it).
						$duration_label = '';
						$views_label    = '';
						$time_ago_label = '';
						if ( $capsf_show_stats && ! empty( $item['like_count'] ) ) {
							$views_label = $this->capsf_format_count( $item['like_count'] );
						}
						if ( $capsf_show_date && ! empty( $item['publishedAt'] ) ) {
							$time_ago_label = $this->capsf_time_ago( $item['publishedAt'] );
						}

						// Link behaviour per play mode - only offer lightbox/inline when the post
						// really has something playable/showable (see get_play_attrs()).
						$play                 = $this->get_play_attrs( $item, $video_play_mode );
						$lightbox_href        = $play['lightbox_href'];
						$capsf_lightbox_href  = $play['lightbox_href'];
						$link_class           = $play['link_class'];
						$capsf_link_class     = $play['link_class'];
						$link_target          = $play['link_target'];
						$capsf_link_target    = $play['link_target'];
						$glightbox_attr       = $play['glightbox_attr'];
						$capsf_glightbox_attr = $play['glightbox_attr'];
						$capsf_glightbox      = $play['data_glightbox'];
						$capsf_inline_src     = $play['data_inline_src'];
						$capsf_item_index     = absint( $index );

						// Style-6 playlist: list-item clicks always swap the featured player and play - independent of Video Play Mode.
						$s6_embed_src       = $play['embed_raw'];
						$capsf_s6_embed_src = $play['embed_raw'];

						$item_class       = $this->get_load_more_item_class( $index, $load_more_settings );
						$capsf_item_class = $item_class;
						$item_attrs       = ' data-capsf-item data-capsf-index="' . esc_attr( $index ) . '"';
						$capsf_item_attrs = $item_attrs;

						if ( $capsf_is_s5_slider ) {
							echo '<div class="capsf-s5-slide">';
						} elseif ( 'slider-2' === $capsf_slider_mode ) {
							echo '<div class="capsf-s7-slide">';
						} elseif ( $capsf_single_as_centered ) {
							echo '<div class="capsf-single-card-wrap">';
						}

						$capsf_card = $this->get_card_data( $item, $capsf_loop_data, $feed_settings );
						require CAPSF_PATH . 'includes/layouts/cards/' . $card_style . '/' . $card_style . '.php';

						if ( '' !== $capsf_slider_mode || $capsf_single_as_centered ) {
							echo '</div>';
						}

						++$capsf_s6_index;
					}

					// Close style-6 playlist list - Load More goes inside the side column,
					// but as a SIBLING after the list (not inside it), or new AJAX items
					// (appended via grid.appendChild) would land after the button.
					if ( 'style-6' === $card_style ) {
						echo '</div>'; // .capsf-s6-list
						$this->print_load_more_button( $feed_id, $instance_id, $load_more_settings, count( $capsf_loop_data['items'] ), $capsf_loop_data['nextPageToken'] );
						echo '</div>'; // .capsf-s6-list-col
					}

					echo '</div>'; // .capsf-card-list / .capsf-s5-track / .capsf-s7-track / .capsf-s6-wrapper

					// Slider style 1: next button + dots - same mechanism the
					// old standalone "Slider" / style-5 design used (also
					// reused, unchanged, for "Single Videos" 2+ videos).
					if ( 'slider-1' === $capsf_slider_mode ) {
						self::print_slider_button( 'capsf-s5', 'next' );
						echo '<div class="capsf-s5-dots"></div>';
						echo '</div>'; // .capsf-s5-wrapper
					} elseif ( 'slider-3' === $capsf_slider_mode ) {
						// Style 3's next button already sits in the toolbar, so
						// only the progress bar is left.
						echo '<div class="capsf-s5-progress" aria-hidden="true"><div class="capsf-s5-progress-bar"></div></div>';
						echo '</div>'; // .capsf-s5-wrapper
					} elseif ( 'slider-2' === $capsf_slider_mode ) {
						// Slider style 2: next button + dots - same mechanism
						// the old standalone "Centered Carousel" / style-7
						// design used.
						self::print_slider_button( 'capsf-s7', 'next' );
						echo '<div class="capsf-s7-dots"></div>';
						echo '</div>'; // .capsf-s7-wrapper
					}

					if ( 'x-timeline' === $card_style ) {
						echo '</div>'; // .capsf-x-timeline
					}

					if ( 'style-6' !== $card_style && ! $capsf_is_slider_layout ) {
						$this->print_load_more_button( $feed_id, $instance_id, $load_more_settings, count( $capsf_loop_data['items'] ), $capsf_loop_data['nextPageToken'] );
					}

					// Close outer scoped feed wrapper.
					echo '</div>'; // .capsf-feed

			}

			return ob_get_clean();
		}

		/**
		 * ARIA attributes for a slider wrapper - announced as a "carousel"
		 * region of posts by screen readers.
		 *
		 * @return string Escaped attribute string.
		 */
		private static function get_carousel_attrs() {
			return 'role="region" aria-roledescription="' . esc_attr__( 'carousel', 'captain-social-feed' ) . '" aria-label="' . esc_attr__( 'Posts', 'captain-social-feed' ) . '"';
		}

		/**
		 * Translated labels for the feed's frontend scripts (slider dots,
		 * the inline player's stop button and player title), read from the
		 * feed wrapper since those scripts are plain JS without i18n.
		 *
		 * @return string Escaped attribute string, with a leading space.
		 */
		private static function get_feed_label_attrs() {
			return sprintf(
				' data-capsf-label-slide="%1$s" data-capsf-label-stop="%2$s" data-capsf-label-player="%3$s" data-capsf-label-close="%4$s" data-capsf-label-prev="%5$s" data-capsf-label-next="%6$s" data-capsf-label-prevpost="%7$s" data-capsf-label-nextpost="%8$s"',
				/* translators: %d: slide number. Keep "%d" as is - the script fills it in. */
				esc_attr__( 'Slide %d', 'captain-social-feed' ),
				esc_attr__( 'Stop video', 'captain-social-feed' ),
				esc_attr__( 'Video player', 'captain-social-feed' ),
				// Post popup (Simple Grid).
				esc_attr__( 'Close', 'captain-social-feed' ),
				esc_attr__( 'Previous photo', 'captain-social-feed' ),
				esc_attr__( 'Next photo', 'captain-social-feed' ),
				esc_attr__( 'Previous post', 'captain-social-feed' ),
				esc_attr__( 'Next post', 'captain-social-feed' )
			);
		}

		/**
		 * Render one slider arrow button directly.
		 *
		 * @param string $prefix    Class prefix ('capsf-s5' | 'capsf-s7').
		 * @param string $direction 'prev' | 'next'.
		 * @return void
		 */
		public static function print_slider_button( $prefix, $direction ) {
			$is_prev = 'prev' === $direction;
			?>
			<button type="button" class="<?php echo esc_attr( $prefix . '-btn ' . $prefix . '-' . ( $is_prev ? 'prev' : 'next' ) ); ?>" aria-label="<?php echo esc_attr( $is_prev ? __( 'Previous', 'captain-social-feed' ) : __( 'Next', 'captain-social-feed' ) ); ?>">
				<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="<?php echo esc_attr( $is_prev ? '15 18 9 12 15 6' : '9 18 15 12 9 6' ); ?>"/>
				</svg>
			</button>
			<?php
		}

		/**
		 * Markup of one slider arrow button.
		 *
		 * @param string $prefix    Class prefix ('capsf-s5' | 'capsf-s7').
		 * @param string $direction 'prev' | 'next'.
		 * @return string
		 */
		private static function get_slider_button( $prefix, $direction ) {
			ob_start();
			self::print_slider_button( $prefix, $direction );
			return ob_get_clean();
		}

		/**
		 * Return sanitized load-more settings.
		 *
		 * Initial Videos and Videos Per Click can be set per-breakpoint
		 * (desktop/tablet/mobile) - a Pro feature. Since the server has no
		 * way to know the visitor's real viewport width before any JS
		 * runs, the *initial* server-side fetch always pulls the LARGEST
		 * of the three configured counts, and each rendered item is
		 * tagged (see get_load_more_item_class()) with a CSS class that
		 * hides it above/below its owning breakpoint's count - mirroring
		 * how the Columns setting already works, just for item count
		 * instead of grid-template-columns. "Videos Per Click" doesn't
		 * have this problem at all: the Load More click happens entirely
		 * client-side, so the JS reads window width at click time and
		 * tells the AJAX handler exactly how many videos to fetch (see
		 * ajax_load_more_videos()) - no guessing needed there.
		 *
		 * @param array $settings Feed settings.
		 * @param int   $total_limit Maximum configured videos for this feed.
		 * @return array
		 */
		private function get_load_more_settings( $settings, $total_limit ) {
			$pagination_type = ! empty( $settings['pagination_type'] ) ? sanitize_key( $settings['pagination_type'] ) : ( ! empty( $settings['show_load_more'] ) ? 'load_more' : 'none' );
			$enabled         = 'load_more' === $pagination_type;

			$initial_desktop = ! empty( $settings['initial_videos'] ) ? absint( $settings['initial_videos'] ) : 6;
			$initial_desktop = max( 1, min( 50, $initial_desktop ) );
			// Tablet/Mobile fall back to the desktop value when unset (free
			// users, or a Pro feed that hasn't customised them) - identical
			// behaviour across all breakpoints, exactly like before.
			$initial_tablet = ! empty( $settings['initial_videos_tablet'] ) ? max( 1, min( 50, absint( $settings['initial_videos_tablet'] ) ) ) : $initial_desktop;
			$initial_mobile = ! empty( $settings['initial_videos_mobile'] ) ? max( 1, min( 50, absint( $settings['initial_videos_mobile'] ) ) ) : $initial_desktop;

			$initial = max( $initial_desktop, $initial_tablet, $initial_mobile );

			$per_load_desktop = ! empty( $settings['load_more_count'] ) ? absint( $settings['load_more_count'] ) : 3;
			$per_load_desktop = max( 1, min( 50, $per_load_desktop ) );
			$per_load_tablet  = ! empty( $settings['load_more_count_tablet'] ) ? max( 1, min( 50, absint( $settings['load_more_count_tablet'] ) ) ) : $per_load_desktop;
			$per_load_mobile  = ! empty( $settings['load_more_count_mobile'] ) ? max( 1, min( 50, absint( $settings['load_more_count_mobile'] ) ) ) : $per_load_desktop;

			$total_limit = max( 1, min( 50, absint( $total_limit ) ) );

			if ( $initial >= $total_limit ) {
				$enabled = false;
			}

			return array(
				'enabled'          => $enabled,
				'initial'          => $initial,
				'initial_desktop'  => $initial_desktop,
				'initial_tablet'   => $initial_tablet,
				'initial_mobile'   => $initial_mobile,
				'per_load'         => $per_load_desktop,
				'per_load_desktop' => $per_load_desktop,
				'per_load_tablet'  => $per_load_tablet,
				'per_load_mobile'  => $per_load_mobile,
				'max'              => $total_limit,
			);
		}

		/**
		 * Build a unique ID for each shortcode render.
		 *
		 * @param int $feed_id Feed ID.
		 * @return string
		 */
		private function get_shortcode_instance_id( $feed_id ) {
			++self::$render_instance;
			return 'feed-' . absint( $feed_id ) . '-' . self::$render_instance;
		}

		/**
		 * Return extra item classes for load-more visibility.
		 *
		 * Beyond the base class, tags each item with a hide-class for any
		 * breakpoint whose configured "Initial Videos" count it exceeds -
		 * e.g. with Desktop=6 / Tablet=9 / Mobile=3, item index 4 (the 5th
		 * item) gets 'capsf-hide-m' (hidden on mobile, shown elsewhere)
		 * while item index 7 gets both 'capsf-hide-m capsf-hide-d'.
		 * The matching CSS lives in enqueue_load_more_assets(). Clicking
		 * "Load More" reveals these already-rendered items first (no
		 * extra API call) before fetching anything new - see the inline
		 * JS in enqueue_load_more_assets().
		 *
		 * @param int   $index    Item index (0-based).
		 * @param array $settings Load-more settings from get_load_more_settings().
		 * @return string
		 */
		private function get_load_more_item_class( $index, $settings ) {
			$classes = 'capsf-feed-item';

			// No Load More on this feed: nothing is hidden. (The hide classes'
			// CSS is printed once per page, so tagging items here would hide
			// them as soon as ANOTHER feed on the same page uses Load More).
			if ( empty( $settings['enabled'] ) ) {
				return $classes;
			}

			if ( isset( $settings['initial_desktop'] ) && $index >= $settings['initial_desktop'] ) {
				$classes .= ' capsf-hide-d';
			}
			if ( isset( $settings['initial_tablet'] ) && $index >= $settings['initial_tablet'] ) {
				$classes .= ' capsf-hide-t';
			}
			if ( isset( $settings['initial_mobile'] ) && $index >= $settings['initial_mobile'] ) {
				$classes .= ' capsf-hide-m';
			}

			return $classes;
		}

		/**
		 * Enqueue shared load-more CSS and JS.
		 *
		 * @return void
		 */
		private function enqueue_load_more_assets() {
			wp_register_script( 'capsf-load-more', false, array(), CAPSF_VERSION, true );
			wp_enqueue_script( 'capsf-load-more' );

			// Click handler:
			// 1. Works out the visitor's breakpoint from window width.
			// 2. Reveals any already-rendered-but-hidden items for that
			// breakpoint first (capsf-hide-d/t/m - see
			// get_load_more_item_class()) - no network request needed.
			// 3. Only calls the AJAX endpoint for the remainder still
			// needed to satisfy that breakpoint's "Videos Per Click"
			// count, telling the server exactly how many to fetch.
			$js = <<<'JS'
(function(){
	if(window.__capsfLoadMoreInit){return;}
	window.__capsfLoadMoreInit=true;

	function breakpoint(){
		var w=window.innerWidth;
		if(w<=640){return'm';}
		if(w<=1024){return't';}
		return'd';
	}
	function hideClassFor(bp){
		return bp==='m'?'capsf-hide-m':(bp==='t'?'capsf-hide-t':'capsf-hide-d');
	}
	function perClickFor(btn,bp){
		var attr=bp==='m'?'countMobile':(bp==='t'?'countTablet':'countDesktop');
		var v=parseInt(btn.dataset[attr],10);
		return(!isNaN(v)&&v>0)?v:(parseInt(btn.dataset.count,10)||3);
	}

	document.addEventListener('click',function(e){
		var btn=e.target.closest('[data-capsf-load-more]');
		if(!btn||btn.disabled){return;}
		var feed=btn.closest('[data-capsf-instance]');
		if(!feed){return;}
		var grid=feed.querySelector('[data-capsf-grid]');
		if(!grid){return;}

		var bp=breakpoint();
		var hideClass=hideClassFor(bp);
		var need=perClickFor(btn,bp);

		var hidden=Array.prototype.slice.call(grid.querySelectorAll('.'+hideClass));
		var toReveal=hidden.slice(0,need);
		toReveal.forEach(function(el){el.classList.remove(hideClass);});
		var remaining=need-toReveal.length;

		function maybeHideButton(){
			var stillHidden=grid.querySelectorAll('.'+hideClass).length>0;
			if(!stillHidden&&!btn.dataset.pageToken){
				btn.parentNode.style.display='none';
			}
		}

		if(remaining<=0){
			maybeHideButton();
			return;
		}

		var form=new FormData();
		form.append('action','capsf_load_more_videos');
		form.append('nonce',btn.dataset.nonce||'');
		form.append('feed_id',btn.dataset.feedId||'0');
		form.append('page_token',btn.dataset.pageToken||'');
		form.append('loaded',btn.dataset.loaded||'0');
		form.append('count',remaining);

		btn.disabled=true;
		btn.classList.add('is-loading');
		var oldText=btn.textContent;
		btn.textContent=btn.dataset.loadingText||'Loading...';

		fetch(btn.dataset.ajaxUrl,{method:'POST',credentials:'same-origin',body:form})
			.then(function(r){return r.json();})
			.then(function(res){
				if(!res||!res.success||!res.data){throw new Error('Load more failed');}
				if(res.data.html){
					var temp=document.createElement('div');
					temp.innerHTML=res.data.html;
					Array.prototype.slice.call(temp.children).forEach(function(node){grid.appendChild(node);});
					if(typeof GLightbox!=='undefined'){
						GLightbox({selector:'.capsf-feed-'+(btn.dataset.feedId||'0')+' .capsf-glightbox',touchNavigation:true,loop:false,autoplayVideos:true});
					}
				}
				btn.dataset.loaded=res.data.loaded||btn.dataset.loaded;
				btn.dataset.pageToken=res.data.next_page_token||'';
				if(res.data.done||!res.data.next_page_token){
					maybeHideButton();
				}
			})
			.catch(function(){
				btn.textContent=btn.dataset.errorText||'Try again';
			})
			.finally(function(){
				if(btn.parentNode&&btn.parentNode.style.display!=='none'){
					btn.disabled=false;
					btn.classList.remove('is-loading');
					if(btn.textContent!==btn.dataset.errorText){btn.textContent=oldText;}
				}
			});
	});
})();
JS;

			wp_add_inline_script( 'capsf-load-more', $js );

			// The button's own look lives in assets/css/frontend.css.
			$css = '';
			// Responsive Initial Videos (Pro) - see get_load_more_item_class().
			// Desktop is the unqualified default (no media query); Tablet and
			// Mobile each get their own item hidden/shown purely by CSS, so
			// resizing the viewport updates visibility with no JS involved.
			$css .= '.capsf-hide-d{display:none!important}';
			$css .= '@media(max-width:1024px){.capsf-hide-d{display:block!important}.capsf-hide-t{display:none!important}}';
			$css .= '@media(max-width:640px){.capsf-hide-t{display:block!important}.capsf-hide-m{display:none!important}}';
			if ( ! self::$load_more_css_printed ) {
				wp_enqueue_style( 'capsf-frontend' );
				wp_add_inline_style( 'capsf-frontend', $css );
				self::$load_more_css_printed = true;
			}
		}

		/**
		 * Render load-more button directly.
		 *
		 * @param int    $feed_id Feed ID.
		 * @param string $instance_id Shortcode instance ID.
		 * @param array  $settings Load-more settings.
		 * @param int    $loaded_items Loaded item count.
		 * @param string $next_page_token Next page token.
		 * @return void
		 */
		public function print_load_more_button( $feed_id, $instance_id, $settings, $loaded_items, $next_page_token ) {
			if ( empty( $settings['enabled'] ) || empty( $next_page_token ) || $loaded_items >= $settings['max'] ) {
				return;
			}
			?>
			<div class="capsf-load-more-wrap">
				<button type="button" class="capsf-load-more-btn"
					data-capsf-load-more="<?php echo esc_attr( $instance_id ); ?>"
					data-feed-id="<?php echo absint( $feed_id ); ?>"
					data-page-token="<?php echo esc_attr( $next_page_token ); ?>"
					data-loaded="<?php echo absint( $loaded_items ); ?>"
					data-count="<?php echo absint( $settings['per_load_desktop'] ?? $settings['per_load'] ); ?>"
					data-count-desktop="<?php echo absint( $settings['per_load_desktop'] ?? $settings['per_load'] ); ?>"
					data-count-tablet="<?php echo absint( $settings['per_load_tablet'] ?? $settings['per_load'] ); ?>"
					data-count-mobile="<?php echo absint( $settings['per_load_mobile'] ?? $settings['per_load'] ); ?>"
					data-nonce="<?php echo esc_attr( wp_create_nonce( 'capsf_load_more_' . absint( $feed_id ) ) ); ?>"
					data-ajax-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"
					data-loading-text="<?php esc_attr_e( 'Loading...', 'captain-social-feed' ); ?>"
					data-error-text="<?php esc_attr_e( 'Try again', 'captain-social-feed' ); ?>">
					<?php esc_html_e( 'Load More', 'captain-social-feed' ); ?>
				</button>
			</div>
			<?php
		}

		/**
		 * Build load-more button markup.
		 *
		 * @param int    $feed_id Feed ID.
		 * @param string $instance_id Shortcode instance ID.
		 * @param array  $settings Load-more settings.
		 * @param int    $loaded_items Loaded item count.
		 * @param string $next_page_token Next page token.
		 * @return string
		 */
		private function get_load_more_button_markup( $feed_id, $instance_id, $settings, $loaded_items, $next_page_token ) {
			ob_start();
			$this->print_load_more_button( $feed_id, $instance_id, $settings, $loaded_items, $next_page_token );
			return ob_get_clean();
		}

		/**
		 * AJAX callback for dynamic frontend load more.
		 *
		 * @return void
		 */
		public function ajax_load_more_videos() {
			$feed_id = isset( $_POST['feed_id'] ) ? absint( wp_unslash( $_POST['feed_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
			$nonce   = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Missing

			if ( ! $feed_id || ! wp_verify_nonce( $nonce, 'capsf_load_more_' . $feed_id ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Invalid request.', 'captain-social-feed' ) ) );
			}

			// Public (nopriv) endpoint: cap requests per visitor so it can't be used to hammer the platform APIs.
			if ( ! $this->load_more_allowed() ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Too many requests. Please wait a moment.', 'captain-social-feed' ) ), 429 );
			}

			$loaded = isset( $_POST['loaded'] ) ? absint( wp_unslash( $_POST['loaded'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing
			// Sent by the JS click handler based on the visitor's actual
			// viewport width at click time (see enqueue_load_more_assets()).
			// Clamped below against this feed's own configured per-click
			// values so a tampered request can't pull an oversized batch.
			$requested_count = isset( $_POST['count'] ) ? absint( wp_unslash( $_POST['count'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Missing

			$feed_data = $this->get_query_userfeed( $feed_id );
			if ( empty( $feed_data ) || ! is_array( $feed_data ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Feed not found.', 'captain-social-feed' ) ) );
			}

			if ( ! empty( $feed_data['status'] ) && 'inactive' === strtolower( trim( $feed_data['status'] ) ) ) {
				wp_send_json_error( array( 'message' => esc_html__( 'Feed is inactive.', 'captain-social-feed' ) ) );
			}

			$settings           = ! empty( $feed_data['settings'] ) && is_array( $feed_data['settings'] ) ? $feed_data['settings'] : array();
			$max_results_limit  = ! empty( $settings['max_results'] ) ? absint( $settings['max_results'] ) : 6;
			$load_more_settings = $this->get_load_more_settings( $settings, $max_results_limit );
			$remaining          = max( 0, $load_more_settings['max'] - $loaded );

			if ( empty( $load_more_settings['enabled'] ) || 0 === $remaining ) {
				wp_send_json_success(
					array(
						'html'            => '',
						'loaded'          => $loaded,
						'next_page_token' => '',
						'done'            => true,
					)
				);
			}

			// Trust the client's requested count for WHICH breakpoint's
			// per-click value to use, but never let it exceed the largest
			// per-click value actually configured for this feed.
			$max_allowed_count = max( $load_more_settings['per_load_desktop'], $load_more_settings['per_load_tablet'], $load_more_settings['per_load_mobile'] );
			$requested_count   = $requested_count > 0 ? min( $requested_count, $max_allowed_count ) : $load_more_settings['per_load'];

			$batch_size = min( $requested_count, $remaining );

			// Platform APIs (Instagram/Facebook/Twitter/Threads/Pinterest) don't
			// expose a page-token cursor, so Load More instead
			// re-requests up to (already loaded + this batch) posts - cheap since
			// get_platform_posts() caches per feed - and slices off just the new
			// ones. Simpler and just as correct as cursor pagination for feed sizes
			// this plugin targets.
			$feed_data['settings']['api_max_results'] = $loaded + $batch_size;

			$capsf_loop_data = $this->get_platform_posts( $feed_data );
			if ( is_wp_error( $capsf_loop_data ) ) {
				wp_send_json_error( array( 'message' => $this->public_error_message( $capsf_loop_data ) ) );
			}

			if ( ! empty( $capsf_loop_data['items'] ) && is_array( $capsf_loop_data['items'] ) ) {
				$capsf_loop_data['items'] = array_slice( $capsf_loop_data['items'], $loaded, $batch_size );
			}

			if ( empty( $capsf_loop_data['items'] ) || ! is_array( $capsf_loop_data['items'] ) ) {
				wp_send_json_success(
					array(
						'html'            => '',
						'loaded'          => $loaded,
						'next_page_token' => '',
						'done'            => true,
					)
				);
			}

			$html       = $this->render_ajax_feed_items( $feed_id, $feed_data, $capsf_loop_data );
			$new_loaded = $loaded + count( $capsf_loop_data['items'] );
			$next_token = ! empty( $capsf_loop_data['nextPageToken'] ) && $new_loaded < $load_more_settings['max'] ? 'more' : '';

			wp_send_json_success(
				array(
					'html'            => $html,
					'loaded'          => $new_loaded,
					'next_page_token' => $next_token,
					'done'            => empty( $next_token ) || $new_loaded >= $load_more_settings['max'],
				)
			);
		}

		/**
		 * Render only feed item markup for AJAX append.
		 *
		 * @param int   $feed_id Feed ID.
		 * @param array $feed_data Feed data.
		 * @param array $capsf_loop_data Normalized feed data.
		 * @return string
		 */
		private function render_ajax_feed_items( $feed_id, $feed_data, $capsf_loop_data ) {
			$feed_type     = ! empty( $feed_data['feed_type'] ) ? strtolower( trim( $feed_data['feed_type'] ) ) : '';
			$feed_settings = ! empty( $feed_data['settings'] ) && is_array( $feed_data['settings'] ) ? $feed_data['settings'] : array();

			$card_style = ! empty( $feed_settings['card_style'] ) ? sanitize_key( $feed_settings['card_style'] ) : 'style-1';
			// Any saved style that no longer exists (e.g. a style removed in
			// a future update) safely falls back to 'style-1' instead of erroring.
			$card_style = self::resolve_card_style( $card_style, $feed_type, $feed_settings );

			$capsf_show_stats = ! isset( $feed_settings['show_view_count'] ) || $feed_settings['show_view_count'];
			$capsf_show_date  = ! isset( $feed_settings['show_date'] ) || $feed_settings['show_date'];

			ob_start();

				$video_play_mode = ! empty( $feed_settings['video_play_mode'] ) ? sanitize_key( $feed_settings['video_play_mode'] ) : 'platform';
			foreach ( $capsf_loop_data['items'] as $index => $item ) {
				$title       = esc_html( $item['title'] );
				$description = esc_html( $item['description'] );
				$channel     = esc_html( $capsf_loop_data['channelTitle'] );
				$video_link  = esc_url( $item['video_link'] );
				$thumb       = $item['thumbnail'];
				$default     = ! empty( $thumb['default'] ) ? esc_url( $thumb['default'] ) : '';
				$medium      = ! empty( $thumb['medium'] ) ? esc_url( $thumb['medium'] ) : $default;
				$high        = ! empty( $thumb['high'] ) ? esc_url( $thumb['high'] ) : $medium;
				$embed_link  = ! empty( $item['video_url'] ) ? esc_url( $item['video_url'] ) : '';
				$video_id    = ! empty( $item['video_id'] ) ? preg_replace( '/[^A-Za-z0-9_-]/', '', $item['video_id'] ) : '';

				$duration_label = '';
				$views_label    = '';
				$time_ago_label = '';
				if ( $capsf_show_stats && ! empty( $item['like_count'] ) ) {
					$views_label = $this->capsf_format_count( $item['like_count'] );
				}
				if ( $capsf_show_date && ! empty( $item['publishedAt'] ) ) {
					$time_ago_label = $this->capsf_time_ago( $item['publishedAt'] );
				}

				$play                 = $this->get_play_attrs( $item, $video_play_mode );
				$lightbox_href        = $play['lightbox_href'];
				$capsf_lightbox_href  = $play['lightbox_href'];
				$link_class           = $play['link_class'];
				$capsf_link_class     = $play['link_class'];
				$link_target          = $play['link_target'];
				$capsf_link_target    = $play['link_target'];
				$glightbox_attr       = $play['glightbox_attr'];
				$capsf_glightbox_attr = $play['glightbox_attr'];
				$capsf_glightbox      = $play['data_glightbox'];
				$capsf_inline_src     = $play['data_inline_src'];
				$capsf_item_index     = absint( $index );

				// Style-6 playlist: list-item clicks always swap the featured player and play.
				$s6_embed_src       = $play['embed_raw'];
				$capsf_s6_embed_src = $play['embed_raw'];

				$item_class       = 'capsf-feed-item';
				$capsf_item_class = $item_class;
				$item_attrs       = ' data-capsf-item data-capsf-index="' . esc_attr( $index ) . '"';
				$capsf_item_attrs = $item_attrs;

				$capsf_card = $this->get_card_data( $item, $capsf_loop_data, $feed_settings );
						require CAPSF_PATH . 'includes/layouts/cards/' . $card_style . '/' . $card_style . '.php';
			}

			return ob_get_clean();
		}

		/**
		 * Get Query User Feed
		 *
		 * @since 1.0.0
		 * @param int $id Feed ID.
		 * @return array Feed data.
		 * */
		public function get_query_userfeed( $id ) {
			global $wpdb;

			$table_name = $wpdb->prefix . 'capsf_feeds';

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$results = $wpdb->get_row(
				$wpdb->prepare(
					// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
					"SELECT * FROM {$table_name} WHERE id = %d",
					$id
				),
				ARRAY_A
			);

			if ( ! empty( $results['settings'] ) ) {
				$results['settings'] = json_decode( $results['settings'], true );
			}

			return $results;
		}

		/**
		 * Get cache duration in seconds from global settings.
		 *
		 * @since 1.0.0
		 * @return int Seconds.
		 */
		public function get_cache_duration() {
			$global   = get_option( 'capsf_global_settings', array() );
			$duration = isset( $global['cache_duration'] ) ? absint( $global['cache_duration'] ) : 0;
			$allowed  = array( 1800, 3600, 21600, 43200, 86400 );
			return in_array( $duration, $allowed, true ) ? $duration : 3 * HOUR_IN_SECONDS;
		}

		/**
		 * Fetch this feed's posts from its connected platform (via
		 * Capsf_Api_Factory), cache the normalized result in a transient, and
		 * adapt it into the normalized `['items' => [...], 'channelTitle' => ...]`
		 * shape the card templates and load-more code expect.
		 *
		 * @since 0.0.1
		 * @param array $feed_data Feed data (including settings + feed_type/platform).
		 * @return array|WP_Error ['items' => [...], 'channelTitle' => string, 'nextPageToken' => string]
		 */
		public function get_platform_posts( $feed_data ) {
			$settings = isset( $feed_data['settings'] ) && is_array( $feed_data['settings'] ) ? $feed_data['settings'] : array();
			$feed_id  = isset( $feed_data['id'] ) ? absint( $feed_data['id'] ) : 0;

			$platform = ! empty( $settings['platform'] )
				? sanitize_key( $settings['platform'] )
				: ( ! empty( $feed_data['feed_type'] ) ? sanitize_key( $feed_data['feed_type'] ) : '' );

			if ( empty( $platform ) ) {
				return new WP_Error( 'capsf_no_platform', esc_html__( 'This feed is not connected to a platform yet.', 'captain-social-feed' ) );
			}

			$api = Capsf_Api_Factory::get( $platform );
			if ( ! $api ) {
				return new WP_Error( 'capsf_unsupported_platform', esc_html__( 'Unsupported platform.', 'captain-social-feed' ) );
			}

			// How many posts the caller wants to SEE...
			$display_limit = isset( $settings['api_max_results'] ) ? absint( $settings['api_max_results'] ) : ( isset( $settings['max_results'] ) ? absint( $settings['max_results'] ) : 6 );
			$display_limit = max( 1, min( 50, $display_limit ) );

			// … versus how many we FETCH + cache. Fetching the feed's full configured size once
			// means Load More / initial render / previews all share ONE cache entry and one API call.
			$fetch_limit = ! empty( $settings['max_results'] ) ? absint( $settings['max_results'] ) : 6;
			$fetch_limit = max( $display_limit, max( 1, min( 50, $fetch_limit ) ) );

			// "Show posts" (Layout tab): only videos / photos / text posts. Fetch
			// more than needed so the filtered feed can still fill its slots.
			$post_filter = isset( $settings['post_filter'] ) && in_array( $settings['post_filter'], self::POST_FILTERS, true ) ? $settings['post_filter'] : 'all';
			if ( 'all' !== $post_filter ) {
				$fetch_limit = min( 100, max( 25, $fetch_limit * 4 ) );
			}

			$transient_key = self::get_posts_cache_key( $platform, $fetch_limit, $settings );

			// Transient or the plugin's own table, depending on Settings > Cache Storage.
			$posts = Capsf_Cache::get( $transient_key );

			if ( false === $posts ) {
				$posts = $api->fetch_posts( $settings, $fetch_limit );

				if ( is_wp_error( $posts ) ) {
					// Negative-cache failures briefly so a dead token / API outage can't make every
					// page view wait on a slow outbound request (and burn the platform's rate limit).
					Capsf_Cache::set(
						$transient_key,
						array(
							'__capsf_error' => array(
								'code'    => $posts->get_error_code(),
								'message' => $posts->get_error_message(),
							),
						),
						5 * MINUTE_IN_SECONDS
					);
					self::register_cache_key( $feed_id, $transient_key );

					// Serve the last known-good posts instead of an empty feed, if any.
					$fallback = Capsf_Cache::store_failure( $transient_key, $posts->get_error_message() );
					if ( null === $fallback ) {
						return $posts;
					}
					$posts = $fallback;
				} else {
					Capsf_Cache::set( $transient_key, $posts, $this->get_cache_duration() );
					Capsf_Cache::store_success( $transient_key, $posts );
					self::register_cache_key( $feed_id, $transient_key );
				}
			} elseif ( is_array( $posts ) && isset( $posts['__capsf_error'] ) ) {
				$fallback = Capsf_Cache::get_fallback( $transient_key );
				if ( null === $fallback ) {
					return new WP_Error( (string) $posts['__capsf_error']['code'], (string) $posts['__capsf_error']['message'] );
				}
				$posts = $fallback;
			}

			// X account feeds carry the profile header data next to the posts.
			$profile = array();
			if ( is_array( $posts ) && isset( $posts['__profile'] ) ) {
				$profile = is_array( $posts['__profile'] ) ? $posts['__profile'] : array();
				unset( $posts['__profile'] );
				$posts = array_values( $posts );
			}

			if ( empty( $posts ) || ! is_array( $posts ) ) {
				return array(
					'items'         => array(),
					'channelTitle'  => '',
					'nextPageToken' => '',
					'profile'       => $profile,
				);
			}

			if ( 'all' !== $post_filter ) {
				$posts = array_values( array_filter( $posts, array( __CLASS__, 'post_matches_filter_' . $post_filter ) ) );
			}

			$total_posts = count( $posts );
			// Some APIs (X, Pinterest) never return fewer than 5 - always honour the requested count.
			$posts = array_slice( $posts, 0, $display_limit );

			$channel_title = ! empty( $posts[0]['author_name'] ) ? $posts[0]['author_name'] : '';
			$items         = array();

			foreach ( $posts as $post ) {
				$image = ! empty( $post['image'] ) ? $post['image'] : '';
				$parts = $this->split_caption( (string) $post['caption'] );

				$items[] = array(
					'video_id'        => $post['id'],
					'title'           => $parts['title'],
					'description'     => $parts['description'],
					'caption'         => (string) $post['caption'],
					'thumbnail'       => array(
						'default'  => $image,
						'medium'   => $image,
						'high'     => $image,
						'standard' => $image,
						'maxres'   => $image,
					),
					'video_link'      => ! empty( $post['permalink'] ) ? $post['permalink'] : '',
					'video_url'       => ! empty( $post['video_url'] ) ? $post['video_url'] : '',
					'post_type'       => $post['type'],
					'channelTitle'    => ! empty( $post['author_name'] ) ? $post['author_name'] : $channel_title,
					'publishedAt'     => ! empty( $post['timestamp'] ) ? gmdate( 'c', $post['timestamp'] ) : '',
					'like_count'      => isset( $post['like_count'] ) ? absint( $post['like_count'] ) : 0,
					'comment_count'   => isset( $post['comment_count'] ) ? absint( $post['comment_count'] ) : 0,
					'share_count'     => isset( $post['share_count'] ) ? absint( $post['share_count'] ) : 0,
					'author_avatar'   => ! empty( $post['author_avatar'] ) ? $post['author_avatar'] : '',
					'embed_url'       => ! empty( $post['embed_url'] ) ? $post['embed_url'] : '',
					// X only (empty elsewhere).
					'author_username' => (string) ( $post['author_username'] ?? '' ),
					'author_verified' => ! empty( $post['author_verified'] ),
					'images'          => isset( $post['images'] ) && is_array( $post['images'] ) ? $post['images'] : array(),
					'reposted_by'     => (string) ( $post['reposted_by'] ?? '' ),
					'no_metrics'      => ! empty( $post['no_metrics'] ),
					'gallery'         => isset( $post['gallery'] ) && is_array( $post['gallery'] ) ? $post['gallery'] : array(),
				);
			}

			return array(
				'items'         => $items,
				'channelTitle'  => $channel_title,
				'platform'      => $platform,
				'profile'       => $profile,
				// Accurate now: there is "more" only if we actually fetched more than we are showing.
				'nextPageToken' => ( $total_posts > $display_limit ) ? 'more' : '',
			);
		}

		/**
		 * Version of the cached post shape. Bump it whenever the normalized
		 * post gains fields (0.0.6: avatar, shares, embed player) so posts
		 * cached by an older version are refetched instead of shown without them.
		 *
		 * @var int
		 */
		const POSTS_CACHE_VERSION = 3;

		/**
		 * Allowed values of the "Show posts" setting.
		 *
		 * @var string[]
		 */
		const POST_FILTERS = array( 'all', 'video', 'photo', 'text' );

		/**
		 * "Show posts: Videos" - video posts and reels.
		 *
		 * @param array $post Normalized post.
		 * @return bool
		 */
		public static function post_matches_filter_video( $post ) {
			return 'video' === ( $post['type'] ?? '' );
		}

		/**
		 * "Show posts: Photos" - posts with a picture that are not videos (albums included).
		 *
		 * @param array $post Normalized post.
		 * @return bool
		 */
		public static function post_matches_filter_photo( $post ) {
			return 'video' !== ( $post['type'] ?? '' ) && ! empty( $post['image'] );
		}

		/**
		 * "Show posts: Text only" - posts without any picture or video.
		 *
		 * @param array $post Normalized post.
		 * @return bool
		 */
		public static function post_matches_filter_text( $post ) {
			return 'video' !== ( $post['type'] ?? '' ) && empty( $post['image'] );
		}

		/**
		 * Cache key of a feed's fetched posts. It mirrors the credential fields,
		 * so changing a token / ID busts the cache automatically.
		 *
		 * @param string $platform    Platform key.
		 * @param int    $fetch_limit Number of posts fetched.
		 * @param array  $settings    Feed settings.
		 * @return string
		 */
		public static function get_posts_cache_key( $platform, $fetch_limit, $settings ) {
			$parts = array( $platform, absint( $fetch_limit ), 'v' . self::POSTS_CACHE_VERSION );
			foreach ( array( 'access_token', 'bearer_token', 'account_id', 'page_id', 'board_id', 'username', 'x_source', 'x_query', 'x_tweet_ids' ) as $field ) {
				if ( ! empty( $settings[ $field ] ) ) {
					$parts[] = $settings[ $field ];
				}
			}
			if ( 'twitter' === $platform ) {
				$parts[] = ( empty( $settings['x_show_reposts'] ) ? 'r0' : 'r1' ) . ( empty( $settings['x_show_replies'] ) ? 'p0' : 'p1' );
			}
			return 'capsf_' . sanitize_key( $platform ) . '_' . md5( implode( '_', $parts ) );
		}

		/**
		 * Remember which transients belong to which feed so one feed's cache can be
		 * cleared without wiping every other feed (and burning their API quota).
		 *
		 * @param int    $feed_id Feed id (0 = unknown, nothing stored).
		 * @param string $key     Transient key.
		 * @return void
		 */
		public static function register_cache_key( $feed_id, $key ) {
			$feed_id = absint( $feed_id );
			if ( ! $feed_id ) {
				return;
			}
			$index = get_option( 'capsf_cache_keys', array() );
			$index = is_array( $index ) ? $index : array();
			if ( empty( $index[ $feed_id ] ) || ! in_array( $key, $index[ $feed_id ], true ) ) {
				$index[ $feed_id ][] = $key;
				// Keep the registry bounded per feed (old keys are orphaned by credential edits).
				$index[ $feed_id ] = array_slice( array_values( array_unique( $index[ $feed_id ] ) ), -20 );
				update_option( 'capsf_cache_keys', $index, false );
			}
		}

		/**
		 * Delete the cached posts of ONE feed.
		 *
		 * @param int $feed_id Feed id.
		 * @return int Number of transients deleted.
		 */
		public static function clear_feed_transients( $feed_id ) {
			$feed_id = absint( $feed_id );
			$index   = get_option( 'capsf_cache_keys', array() );
			$deleted = 0;
			if ( $feed_id && is_array( $index ) && ! empty( $index[ $feed_id ] ) ) {
				foreach ( $index[ $feed_id ] as $key ) {
					if ( Capsf_Cache::delete( $key ) ) {
						++$deleted;
					}
				}
				unset( $index[ $feed_id ] );
				update_option( 'capsf_cache_keys', $index, false );
			}
			return $deleted;
		}

		/**
		 * Work out link/lightbox/inline-play attributes for one post.
		 *
		 * Lightbox/inline play are only used when there is something that can really be
		 * shown in them:
		 * - a direct video file → our video player;
		 * - a video without a file but with the platform's own embeddable player
		 *   (Facebook video plugin, X / Pinterest embeds) → that player in an iframe;
		 * - an image → image lightbox.
		 * Social-network permalinks (instagram.com, x.com, …) refuse to be framed, so
		 * every other post just opens the original post in a new tab.
		 *
		 * @param array  $item Normalized item (see get_platform_posts()).
		 * @param string $mode 'lightbox' | 'inline' | anything else.
		 * @return array
		 */
		private function get_play_attrs( $item, $mode ) {
			$video_link = ! empty( $item['video_link'] ) ? esc_url_raw( $item['video_link'] ) : '';
			$embed_raw  = ! empty( $item['video_url'] ) ? esc_url_raw( $item['video_url'] ) : '';
			$is_video   = ! empty( $item['post_type'] ) && 'video' === $item['post_type'];
			// Only a direct video FILE can be played inside our lightbox/inline player.
			// Anything else (a social page URL) can't be framed - treat it as "no embed".
			if ( $embed_raw && ! preg_match( '#\.(?:mp4|webm|ogv|m4v|mov)(?:$|[?\#])#i', $embed_raw ) ) {
				$embed_raw = '';
			}
			$is_file = '' !== $embed_raw;
			// No file: fall back to the platform's own embeddable player, if any.
			if ( ! $is_file && $is_video && ! empty( $item['embed_url'] ) && self::is_allowed_embed( $item['embed_url'] ) ) {
				$embed_raw = esc_url_raw( $item['embed_url'] );
			}
			$thumb     = ! empty( $item['thumbnail'] ) && is_array( $item['thumbnail'] ) ? $item['thumbnail'] : array();
			$image_raw = '';
			foreach ( array( 'high', 'medium', 'default' ) as $size ) {
				if ( ! empty( $thumb[ $size ] ) ) {
					$image_raw = esc_url_raw( $thumb[ $size ] );
					break;
				}
			}

			$out = array(
				'link_class'      => '',
				'link_target'     => '_blank',
				'glightbox_attr'  => '',
				'data_glightbox'  => '',
				'data_inline_src' => '',
				'lightbox_href'   => $video_link,
				'embed_raw'       => $embed_raw,
			);

			if ( 'lightbox' === $mode ) {
				if ( $embed_raw ) {
					$out['link_class']     = 'capsf-glightbox';
					$out['link_target']    = '';
					$out['lightbox_href']  = $embed_raw;
					$out['data_glightbox'] = 'type: external; height: 80vh; description: ' . (string) ( $item['title'] ?? '' );
					$out['glightbox_attr'] = 'data-glightbox="' . esc_attr( $out['data_glightbox'] ) . '"';
				} elseif ( $image_raw && ! $is_video ) {
					// A video we can't play opens the original post, never its still image.
					$out['link_class']     = 'capsf-glightbox';
					$out['link_target']    = '';
					$out['lightbox_href']  = $image_raw;
					$out['data_glightbox'] = 'type: image; description: ' . (string) ( $item['title'] ?? '' );
					$out['glightbox_attr'] = 'data-glightbox="' . esc_attr( $out['data_glightbox'] ) . '"';
				}
			} elseif ( 'inline' === $mode && $embed_raw ) {
				$out['link_class']      = 'capsf-inline-play';
				$out['link_target']     = '';
				$out['data_inline_src'] = $embed_raw;
				$out['glightbox_attr']  = 'data-inline-src="' . esc_url( $embed_raw ) . '"';
			}

			return $out;
		}

		/**
		 * Everything the card templates need beyond the legacy variables:
		 * platform, author, counts and the caption ("Show More" / scroll).
		 * Text values are raw - templates escape them on output.
		 *
		 * @param array $item      Item from get_platform_posts().
		 * @param array $loop_data get_platform_posts() result.
		 * @param array $settings  Feed settings.
		 * @return array
		 */
		private function get_card_data( $item, $loop_data, $settings ) {
			$show_stats = ! isset( $settings['show_view_count'] ) || $settings['show_view_count'];
			$show_date  = ! isset( $settings['show_date'] ) || $settings['show_date'];
			$author     = ! empty( $item['channelTitle'] ) ? (string) $item['channelTitle'] : (string) ( $loop_data['channelTitle'] ?? '' );
			$platform   = ! empty( $loop_data['platform'] ) ? sanitize_key( $loop_data['platform'] ) : '';
			$caption    = (string) ( $item['caption'] ?? $item['description'] ?? '' );

			$mode   = ( isset( $settings['caption_mode'] ) && 'scroll' === $settings['caption_mode'] ) ? 'scroll' : 'show_more';
			$length = isset( $settings['caption_length'] ) ? absint( $settings['caption_length'] ) : 120;
			$length = max( 20, min( 1000, $length ? $length : 120 ) );
			$short  = '';
			if ( 'show_more' === $mode && ( function_exists( 'mb_strlen' ) ? mb_strlen( $caption ) : strlen( $caption ) ) > $length ) {
				// Drop the excerpt's trailing "…" (the template adds " ..."). Not
				// rtrim(): it strips BYTES, and would cut a trailing emoji in half
				// (invalid UTF-8 - esc_html() then prints nothing).
				$short = preg_replace( '/…$/u', '', $this->capsf_excerpt( $caption, $length ) );
			}

			$more = isset( $settings['show_more_text'] ) ? sanitize_text_field( $settings['show_more_text'] ) : '';
			$less = isset( $settings['show_less_text'] ) ? sanitize_text_field( $settings['show_less_text'] ) : '';

			return array(
				'platform'       => $platform,
				'platform_label' => Capsf_Api_Factory::get_label( $platform ),
				'is_video'       => ! empty( $item['post_type'] ) && 'video' === $item['post_type'],
				'author'         => $author,
				'avatar'         => ! empty( $item['author_avatar'] ) ? (string) $item['author_avatar'] : '',
				'initial'        => function_exists( 'mb_substr' ) ? mb_strtoupper( mb_substr( $author, 0, 1 ) ) : strtoupper( substr( $author, 0, 1 ) ),
				'permalink'      => ! empty( $item['video_link'] ) ? (string) $item['video_link'] : '',
				'image'          => ! empty( $item['thumbnail']['high'] ) ? (string) $item['thumbnail']['high'] : '',
				'time_ago'       => ( $show_date && ! empty( $item['publishedAt'] ) ) ? $this->capsf_time_ago( $item['publishedAt'] ) : '',
				'show_stats'     => $show_stats,
				'likes'          => $this->capsf_format_count( $item['like_count'] ?? 0 ),
				'comments'       => $this->capsf_format_count( $item['comment_count'] ?? 0 ),
				'shares'         => $this->capsf_format_count( $item['share_count'] ?? 0 ),
				'caption'        => $caption,
				'caption_short'  => $short,
				'caption_mode'   => $mode,
				'more_text'      => '' !== $more ? $more : __( 'Show More', 'captain-social-feed' ),
				'less_text'      => '' !== $less ? $less : __( 'Show Less', 'captain-social-feed' ),
				// X designs.
				'username'       => (string) ( $item['author_username'] ?? '' ),
				'verified'       => ! empty( $item['author_verified'] ),
				'images'         => isset( $item['images'] ) && is_array( $item['images'] ) ? array_slice( $item['images'], 0, 4 ) : array(),
				'reposted_by'    => (string) ( $item['reposted_by'] ?? '' ),
				'replies'        => $this->capsf_format_count( $item['comment_count'] ?? 0 ),
				// Posts read from X's free embed have no counts.
				'no_metrics'     => ! empty( $item['no_metrics'] ),
				'stars'          => 'twitter' === $platform && 'testimonials' === Capsf_Api_Twitter::get_source( $settings ),
				// Post popup (Simple Grid).
				'gallery'        => $this->popup_gallery( $item ),
				'profile_url'    => self::profile_url( $platform, (string) ( $item['author_username'] ?? '' ) ? (string) $item['author_username'] : $author, $settings ),
				'date_full'      => ! empty( $item['publishedAt'] ) ? self::full_date( $item['publishedAt'] ) : '',
				'dark'           => ! empty( $settings['style_preset'] ) && 'dark' === $settings['style_preset'],
			);
		}

		/**
		 * Slides of the post popup: every photo / video of a multi-media post,
		 * or the post's one picture / video. A video plays from its file, or
		 * the platform's own player when that is allowed; otherwise its still
		 * image links to the post.
		 *
		 * @param array $item Item from get_platform_posts().
		 * @return array[] { type: image|video|embed, src, poster }
		 */
		private function popup_gallery( $item ) {
			$slides = array();
			foreach ( (array) ( $item['gallery'] ?? array() ) as $entry ) {
				if ( empty( $entry['type'] ) ) {
					continue;
				}
				if ( 'video' === $entry['type'] && ! empty( $entry['src'] ) && preg_match( '#\.(?:mp4|webm|ogv|m4v|mov)(?:$|[?\#])#i', $entry['src'] ) ) {
					$slides[] = array(
						'type'   => 'video',
						'src'    => $entry['src'],
						'poster' => $entry['poster'] ?? '',
					);
				} elseif ( 'video' === $entry['type'] ) {
					// Not playable here - show the still; the popup links it to the post.
					if ( ! empty( $entry['poster'] ) ) {
						$slides[] = array(
							'type'     => 'image',
							'src'      => $entry['poster'],
							'poster'   => '',
							'is_video' => true,
						);
					}
				} elseif ( ! empty( $entry['src'] ) ) {
					$slides[] = array(
						'type'   => 'image',
						'src'    => $entry['src'],
						'poster' => '',
					);
				}
			}
			if ( count( $slides ) > 1 ) {
				return $slides;
			}

			$image = ! empty( $item['thumbnail']['high'] ) ? (string) $item['thumbnail']['high'] : '';
			if ( ! empty( $item['post_type'] ) && 'video' === $item['post_type'] ) {
				$play = $this->get_play_attrs( $item, 'lightbox' );
				$src  = (string) $play['embed_raw'];
				if ( $src && preg_match( '#\.(?:mp4|webm|ogv|m4v|mov)(?:$|[?\#])#i', $src ) ) {
					return array(
						array(
							'type'   => 'video',
							'src'    => $src,
							'poster' => $image,
						),
					);
				}
				if ( $src ) {
					return array(
						array(
							'type'   => 'embed',
							'src'    => $src,
							'poster' => $image,
						),
					);
				}
				return $image ? array(
					array(
						'type'     => 'image',
						'src'      => $image,
						'poster'   => '',
						'is_video' => true,
					),
				) : array();
			}
			return $image ? array(
				array(
					'type'   => 'image',
					'src'    => $image,
					'poster' => '',
				),
			) : array();
		}

		/**
		 * Link to the account on its platform (popup "Follow").
		 *
		 * @param string $platform Platform key.
		 * @param string $handle   Username / account name.
		 * @param array  $settings Feed settings (Facebook uses the Page ID).
		 * @return string
		 */
		public static function profile_url( $platform, $handle, $settings ) {
			$handle = ltrim( trim( (string) $handle ), '@' );
			switch ( $platform ) {
				case 'instagram':
					return preg_match( '/^[\w.]+$/', $handle ) ? 'https://www.instagram.com/' . rawurlencode( $handle ) . '/' : '';
				case 'threads':
					return preg_match( '/^[\w.]+$/', $handle ) ? 'https://www.threads.net/@' . rawurlencode( $handle ) : '';
				case 'pinterest':
					return preg_match( '/^[\w.]+$/', $handle ) ? 'https://www.pinterest.com/' . rawurlencode( $handle ) . '/' : '';
				case 'twitter':
					return preg_match( '/^\w{1,15}$/', $handle ) ? 'https://x.com/' . rawurlencode( $handle ) : '';
				case 'facebook':
					return ! empty( $settings['page_id'] ) ? 'https://www.facebook.com/' . rawurlencode( (string) $settings['page_id'] ) : '';
			}
			return '';
		}

		/**
		 * Date as "September 30" (with the year when it is not this year).
		 *
		 * @param string $published ISO date.
		 * @return string
		 */
		public static function full_date( $published ) {
			$ts = strtotime( (string) $published );
			if ( ! $ts ) {
				return '';
			}
			$format = gmdate( 'Y', $ts ) === gmdate( 'Y' ) ? _x( 'F j', 'post date without year', 'captain-social-feed' ) : _x( 'F j, Y', 'post date with year', 'captain-social-feed' );
			return wp_date( $format, $ts );
		}

		/**
		 * Post text with links, @mentions and #hashtags linked to the
		 * platform (where it has such pages). Escaped.
		 *
		 * @param string $text     Plain text.
		 * @param string $platform Platform key.
		 * @return string HTML.
		 */
		public static function linkify( $text, $platform ) {
			$bases = array(
				'twitter'   => array( 'https://x.com/', 'https://x.com/hashtag/' ),
				'instagram' => array( 'https://www.instagram.com/', 'https://www.instagram.com/explore/tags/' ),
				'threads'   => array( 'https://www.threads.net/@', 'https://www.threads.net/search?q=%23' ),
				'facebook'  => array( '', 'https://www.facebook.com/hashtag/' ),
			);
			$base  = $bases[ $platform ] ?? array( '', '' );
			$html  = esc_html( (string) $text );
			return preg_replace_callback(
				'~(https?://[^\s<]+)|(?<![\w@])@([\w.]{1,30})|(?<![\w&])#(\w+)~u',
				function ( $m ) use ( $base ) {
					if ( ! empty( $m[1] ) ) {
						return '<a href="' . esc_url( html_entity_decode( $m[1] ) ) . '" target="_blank" rel="noopener noreferrer nofollow">' . $m[1] . '</a>';
					}
					if ( ! empty( $m[2] ) ) {
						$user = rtrim( $m[2], '.' );
						return $base[0] ? '<a href="' . esc_url( $base[0] . $user ) . '" target="_blank" rel="noopener noreferrer">@' . $user . '</a>' . substr( $m[2], strlen( $user ) ) : $m[0];
					}
					return $base[1] ? '<a href="' . esc_url( $base[1] . rawurlencode( $m[3] ) ) . '" target="_blank" rel="noopener noreferrer">#' . $m[3] . '</a>' : $m[0];
				},
				$html
			);
		}

		/**
		 * Card design to render. X feeds only use the two X designs (picked
		 * from "What to show" when an older design is saved); other platforms
		 * never use them. Unknown values fall back to 'style-1'.
		 *
		 * @param string $card_style Saved design.
		 * @param string $feed_type  Feed platform.
		 * @param array  $settings   Feed settings.
		 * @return string
		 */
		public static function resolve_card_style( $card_style, $feed_type, $settings ) {
			$is_x = 'twitter' === $feed_type || 'twitter' === ( $settings['platform'] ?? '' );
			if ( $is_x ) {
				if ( in_array( $card_style, self::X_STYLES, true ) ) {
					return $card_style;
				}
				return in_array( Capsf_Api_Twitter::get_source( $settings ), array( 'profile_timeline', 'sidebar' ), true ) ? 'x-timeline' : 'x-grid';
			}
			if ( ! in_array( $card_style, self::CARD_STYLES, true ) || in_array( $card_style, self::X_STYLES, true ) ) {
				return 'style-1';
			}
			return $card_style;
		}

		/**
		 * X post text with links, @mentions and #hashtags linked. Escaped.
		 *
		 * @param string $text Plain text.
		 * @return string HTML.
		 */
		public static function x_linkify( $text ) {
			return self::linkify( $text, 'twitter' );
		}

		/**
		 * Allowed SVG tags and attributes for wp_kses.
		 *
		 * @return array
		 */
		public static function allowed_svg_tags() {
			return array(
				'svg'      => array(
					'class'           => true,
					'viewbox'         => true,
					'width'           => true,
					'height'          => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
					'xmlns'           => true,
					'role'            => true,
					'aria-hidden'     => true,
					'aria-label'      => true,
					'focusable'       => true,
				),
				'circle'   => array(
					'cx'   => true,
					'cy'   => true,
					'r'    => true,
					'fill' => true,
				),
				'path'     => array(
					'd'               => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
				),
				'rect'     => array(
					'x'      => true,
					'y'      => true,
					'width'  => true,
					'height' => true,
					'fill'   => true,
					'rx'     => true,
					'ry'     => true,
				),
				'polygon'  => array(
					'points' => true,
					'fill'   => true,
				),
				'polyline' => array(
					'points'          => true,
					'fill'            => true,
					'stroke'          => true,
					'stroke-width'    => true,
					'stroke-linecap'  => true,
					'stroke-linejoin' => true,
				),
				'line'     => array(
					'x1'             => true,
					'y1'             => true,
					'x2'             => true,
					'y2'             => true,
					'stroke'         => true,
					'stroke-width'   => true,
					'stroke-linecap' => true,
				),
				'span'     => array(
					'class'       => true,
					'role'        => true,
					'aria-label'  => true,
					'aria-hidden' => true,
				),
				'img'      => array(
					'class'          => true,
					'src'            => true,
					'alt'            => true,
					'width'          => true,
					'height'         => true,
					'loading'        => true,
					'referrerpolicy' => true,
				),
			);
		}

		/**
		 * Allowed HTML tags for shortcode markup and feed previews.
		 *
		 * @return array Allowed tags.
		 */
		public static function allowed_html_tags() {
			$post_tags = wp_kses_allowed_html( 'post' );
			$svg_tags  = self::allowed_svg_tags();
			$extra     = array(
				'template' => array(
					'class' => true,
					'id'    => true,
				),
				'iframe'   => array(
					'src'             => true,
					'data-src'        => true,
					'title'           => true,
					'allow'           => true,
					'allowfullscreen' => true,
					'width'           => true,
					'height'          => true,
					'loading'         => true,
					'frameborder'     => true,
				),
				'video'    => array(
					'src'         => true,
					'poster'      => true,
					'controls'    => true,
					'playsinline' => true,
					'preload'     => true,
					'autoplay'    => true,
					'muted'       => true,
					'loop'        => true,
					'width'       => true,
					'height'      => true,
				),
				'source'   => array(
					'src'  => true,
					'type' => true,
				),
			);
			return array_merge( $post_tags, $svg_tags, $extra );
		}

		/**
		 * Safely escape SVG markup and icons.
		 *
		 * @param string $svg SVG or icon HTML.
		 * @return string Sanitized markup.
		 */
		public static function esc_svg( $svg ) {
			return wp_kses( (string) $svg, self::allowed_svg_tags() );
		}

		/**
		 * Platform logo, coloured by CSS (see assets/css/frontend.css).
		 *
		 * @param string $platform Platform key.
		 * @param string $label    Accessible name; empty = decorative.
		 * @return string
		 */
		public static function platform_icon( $platform, $label = '' ) {
			$platform = sanitize_key( $platform );
			if ( ! in_array( $platform, Capsf_Api_Factory::get_platforms(), true ) ) {
				return '';
			}
			$a11y = '' !== $label ? ' role="img" aria-label="' . esc_attr( $label ) . '"' : ' aria-hidden="true"';
			return '<span class="capsf-platform-icon capsf-platform-icon--' . esc_attr( $platform ) . '"' . $a11y . '></span>';
		}

		/**
		 * Account picture for the older designs' name rows / badges - or the
		 * platform logo when the platform gave no picture.
		 *
		 * @param array $card Card data (get_card_data()).
		 * @param int   $size Size in px.
		 * @return string
		 */
		public static function avatar_or_icon( $card, $size ) {
			if ( empty( $card['avatar'] ) ) {
				return self::platform_icon( $card['platform'] ?? '' );
			}
			return sprintf(
				'<img class="capsf-avatar" src="%1$s" alt="" width="%2$d" height="%2$d" loading="lazy" referrerpolicy="no-referrer">',
				esc_url( $card['avatar'] ),
				absint( $size )
			);
		}

		/**
		 * Platform logo shown after the name - only when avatar_or_icon()
		 * used the picture (otherwise the logo is already there).
		 *
		 * @param array $card Card data (get_card_data()).
		 * @return string
		 */
		public static function trailing_platform_icon( $card ) {
			return empty( $card['avatar'] ) ? '' : self::platform_icon( $card['platform'] ?? '', $card['platform_label'] ?? '' );
		}

		/**
		 * Neutral round play + pause icons (pause shows while a video plays
		 * inline).
		 *
		 * @param string $prefix Class prefix, e.g. 'capsf-s1' gives capsf-s1-icon-play and capsf-s1-icon-pause.
		 * @return string
		 */
		public static function play_icons( $prefix ) {
			$prefix = sanitize_html_class( $prefix );
			return '<svg class="capsf-play-icon ' . $prefix . '-icon-play" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24" fill="rgba(0,0,0,.55)"/><path d="M19 15l15 9-15 9z" fill="#fff"/></svg>'
				. '<svg class="capsf-play-icon ' . $prefix . '-icon-pause" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="24" cy="24" r="24" fill="rgba(0,0,0,.55)"/><rect x="17" y="15" width="5" height="18" fill="#fff"/><rect x="26" y="15" width="5" height="18" fill="#fff"/></svg>';
		}

		/**
		 * Whether a URL is one of the platform video players we allow to be framed.
		 *
		 * @param string $url URL.
		 * @return bool
		 */
		private static function is_allowed_embed( $url ) {
			$host = wp_parse_url( $url, PHP_URL_HOST );
			$path = (string) wp_parse_url( $url, PHP_URL_PATH );
			if ( 'https' !== wp_parse_url( $url, PHP_URL_SCHEME ) || ! $host ) {
				return false;
			}
			$allowed = array(
				'www.facebook.com'         => '/plugins/video.php',
				'platform.twitter.com'     => '/embed/Tweet.html',
				'assets.pinterest.com'     => '/ext/embed.html',
				// Videos shared on Facebook from YouTube / Vimeo.
				'www.youtube.com'          => '/embed/',
				'www.youtube-nocookie.com' => '/embed/',
				'player.vimeo.com'         => '/video/',
			);
			return isset( $allowed[ $host ] ) && 0 === strpos( $path, $allowed[ $host ] );
		}

		/**
		 * Markup shown in place of a feed that failed to load.
		 * Admins get the real reason; visitors get nothing technical.
		 *
		 * @param WP_Error $error Error from get_platform_posts().
		 * @return string
		 */
		private function get_error_markup( $error ) {
			if ( current_user_can( 'manage_options' ) ) {
				return '<p class="capsf-feed-error">' . esc_html( $error->get_error_message() ) . '</p>';
			}
			$this->log_feed_error( $error );
			// Visitors: render nothing rather than advertising a broken integration.
			return '';
		}

		/**
		 * Message safe to return to the public AJAX caller.
		 *
		 * @param WP_Error $error Error.
		 * @return string
		 */
		private function public_error_message( $error ) {
			if ( current_user_can( 'manage_options' ) ) {
				return $error->get_error_message();
			}
			$this->log_feed_error( $error );
			return esc_html__( 'Could not load more posts right now.', 'captain-social-feed' );
		}

		/**
		 * Log the real error server-side (only when WP_DEBUG_LOG is on).
		 *
		 * @param WP_Error $error Error.
		 * @return void
		 */
		private function log_feed_error( $error ) {
			if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				error_log( '[captain-social-feed] ' . $error->get_error_code() . ': ' . $error->get_error_message() );
			}
		}

		/**
		 * Simple per-visitor throttle for the public load-more endpoint
		 * (30 requests / minute, keyed on a hash of the remote address).
		 *
		 * @return bool
		 */
		private function load_more_allowed() {
			$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
			$key = 'capsf_rl_' . md5( $ip );
			$hit = (int) get_transient( $key );
			if ( $hit >= (int) apply_filters( 'capsf_load_more_rate_limit', 30 ) ) {
				return false;
			}
			set_transient( $key, $hit + 1, MINUTE_IN_SECONDS );
			return true;
		}

		/**
		 * Social posts have one caption, while the older designs show a title
		 * AND a description. Use the caption's first line as the title and the
		 * rest as the description, so the same text is never shown twice. A
		 * one-line caption longer than the title limit keeps the full text as
		 * the description (the title only shows its start).
		 *
		 * @param string $caption Plain-text caption.
		 * @return array { title: string, description: string }
		 */
		private function split_caption( $caption ) {
			$caption = trim( $caption );
			$lines   = preg_split( '/\R+/u', $caption, 2 );
			$first   = trim( (string) ( $lines[0] ?? '' ) );
			$rest    = trim( (string) ( $lines[1] ?? '' ) );
			$title   = $this->capsf_excerpt( $first, 70 );

			return array(
				'title'       => $title,
				'description' => ( $title === $first ) ? $rest : $caption,
			);
		}

		/**
		 * Shorten plain text to a word-boundary-safe excerpt, used to derive
		 * a pseudo "title" from a platform post's caption (which, unlike a
		 * video platform, has no separate title field).
		 *
		 * @since 0.0.1
		 * @param string $text   Source text.
		 * @param int    $length Max length in characters.
		 * @return string
		 */
		public function capsf_excerpt( $text, $length = 70 ) {
			$text = trim( (string) $text );
			if ( '' === $text ) {
				return '';
			}
			if ( function_exists( 'mb_strlen' ) ? mb_strlen( $text ) <= $length : strlen( $text ) <= $length ) {
				return $text;
			}
			$trimmed = function_exists( 'mb_substr' ) ? mb_substr( $text, 0, $length ) : substr( $text, 0, $length );
			$trimmed = preg_replace( '/\s+?(\S+)?$/', '', $trimmed );
			return $trimmed . '…';
		}

		/**
		 * Format a large number in compact form - e.g.
		 * 200000 -> "200K", 4500000 -> "4.5M", 950 -> "950".
		 *
		 * @since 1.2.4
		 * @param int $count Raw count.
		 * @return string
		 */
		public function capsf_format_count( $count ) {
			$count = absint( $count );

			// Round first, then pick the unit, so 999,999 becomes "1M" rather than "1000K".
			if ( $count >= 999950000 ) {
				return round( $count / 1000000000, 1 ) . 'B';
			}
			if ( $count >= 999950 ) {
				return round( $count / 1000000, 1 ) . 'M';
			}
			if ( $count >= 1000 ) {
				return round( $count / 1000, 1 ) . 'K';
			}
			return (string) $count;
		}

		/**
		 * Turn a video's publishedAt timestamp into a "1 week ago" style label.
		 *
		 * @since 1.2.5
		 * @param string $published_at ISO 8601 timestamp from the platform API.
		 * @return string Empty string if the timestamp can't be parsed.
		 */
		public function capsf_time_ago( $published_at ) {
			if ( empty( $published_at ) ) {
				return '';
			}

			$timestamp = strtotime( $published_at );
			if ( ! $timestamp ) {
				return '';
			}

			// Both values must be real UTC timestamps. current_time('timestamp') is
			// shifted by the site's timezone offset and made fresh posts read "5 hours ago" in e.g. IST.
			$now = time();
			if ( $timestamp > $now - MINUTE_IN_SECONDS ) {
				// Under a minute old, or slightly in the future (clock skew).
				return esc_html__( 'Just now', 'captain-social-feed' );
			}

			/* translators: %s: human-readable time difference, e.g. "1 week" */
			return sprintf( esc_html__( '%s ago', 'captain-social-feed' ), human_time_diff( $timestamp, $now ) );
		}
	}

	Capsf_Shortcode::get_instance();
}
