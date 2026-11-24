<?php
/**
 * Capsf Style CSS Generator
 *
 * Converts `style_settings` JSON into scoped CSS for each feed.
 * Selectors are mapped per card style to match actual template class names.
 *
 * Use get_css() with wp_add_inline_style() - compliant with WordPress.org rules.
 *
 * @since   1.0.0
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Style_CSS_Generator' ) ) {

	/**
	 * Capsf_Style_CSS_Generator class.
	 *
	 * Generates CSS rules for layouts from settings.
	 */
	class Capsf_Style_CSS_Generator {

		/**
		 * Feed ID.
		 *
		 * @var int
		 */
		private $feed_id;

		/**
		 * Style settings.
		 *
		 * @var array
		 */
		private $style_settings;

		/**
		 * Active card style key e.g. 'style-1'.
		 *
		 * @var string
		 */
		private $card_style;

		/**
		 * Per-style selector maps.
		 * Keys match element keys in style_settings / STYLE_ELEMENT_MAP.
		 * Values are CSS selectors relative to .capsf-feed-{id}.
		 *
		 * @var array
		 */
		private $selector_maps = array(
			'social-1' => array(
				'card'        => '.capsf-sc-card',
				'title'       => '.capsf-sc-author-name',
				'description' => '.capsf-sc-caption-text',
				'channelName' => '.capsf-sc-time',
			),
			'social-2' => array(
				'card'        => '.capsf-sc-card',
				'title'       => '.capsf-sc-author-name',
				'description' => '.capsf-sc-caption-text',
				'channelName' => '.capsf-sc-time',
			),
			'style-1'  => array(
				'card'          => '.capsf-s1-card',
				'thumbnail'     => '.capsf-s1-thumbnail',
				'title'         => '.capsf-s1-title',
				'description'   => '.capsf-s1-description',
				'channelAvatar' => '.capsf-s1-channel-dot',
				'channelName'   => '.capsf-s1-channel-name',
			),
			'style-2'  => array(
				'card'          => '.capsf-card-item',
				'thumbnail'     => '.capsf-card-thumb-wrap img',
				'title'         => '.capsf-card-body h3',
				'channelAvatar' => '.capsf-card-badge svg',
				'channelName'   => '.capsf-card-channel, .capsf-card-badge',
				'arrow'         => '.capsf-card-arrow',
			),
			'style-3'  => array(
				'card'          => '.capsf-s3-card',
				'thumbnail'     => '.capsf-s3-thumb',
				'title'         => '.capsf-s3-title',
				'description'   => '.capsf-s3-desc',
				'channelAvatar' => '.capsf-s3-channel-badge svg',
				'channelName'   => '.capsf-s3-channel-badge',
			),
			'style-6'  => array(
				'thumbnail'   => '.capsf-s6-thumb',
				'title'       => '.capsf-s6-title',
				'channelName' => '.capsf-s6-ch',
			),
			'style-8'  => array(
				'card'      => '.capsf-s8-item',
				'thumbnail' => '.capsf-s8-thumbnail',
			),
			'reel-1'   => array(
				'card'      => '.capsf-reel-card',
				'thumbnail' => '.capsf-reel-thumbnail',
				'title'     => '.capsf-reel-title',
			),
		);

		/**
		 * Selector maps for the Styles-tab panels (Background / Card Title /
		 * Description / Image / Stats). Unlike $selector_maps above (the
		 * per-element `style_settings` structure used by the Light/Dark
		 * "Mode" presets), these panels are flat feed settings (`card_bg_*`,
		 * `title_*`, `description_*`, `image_*`, `stats_*`) that apply to
		 * every card style, so each style just maps them onto its own class
		 * names. An empty string means that style has no such element.
		 *
		 * @var array
		 */
		private static $panel_selectors = array(
			// Social Post designs: the "title" panel styles the account name.
			'social-1'   => array(
				'card'        => '.capsf-sc-card',
				'image'       => '.capsf-sc-media',
				'title'       => '.capsf-sc-author-name',
				'description' => '.capsf-sc-caption-text',
				'stats'       => '.capsf-sc-stats',
			),
			'social-2'   => array(
				'card'        => '.capsf-sc-card',
				'image'       => '.capsf-sc-media',
				'title'       => '.capsf-sc-author-name',
				'description' => '.capsf-sc-caption-text',
				'stats'       => '.capsf-sc-stats',
			),
			'x-timeline' => array(
				'card'        => '.capsf-x-card',
				'image'       => '.capsf-x-media',
				'title'       => '.capsf-x-name',
				'description' => '.capsf-x-text',
				'stats'       => '.capsf-x-actions',
			),
			'x-grid'     => array(
				'card'        => '.capsf-x-card',
				'image'       => '.capsf-x-media',
				'title'       => '.capsf-x-name',
				'description' => '.capsf-x-text',
				'stats'       => '.capsf-x-actions',
			),
			'style-1'    => array(
				'card'        => '.capsf-s1-card',
				'image'       => '.capsf-s1-thumb-wrap',
				'title'       => '.capsf-s1-title',
				'description' => '.capsf-s1-description',
				'stats'       => '.capsf-s1-stats',
			),
			'style-2'    => array(
				'card'        => '.capsf-card-item',
				'image'       => '.capsf-card-thumb-wrap',
				'title'       => '.capsf-card-body h3',
				'description' => '',
				'stats'       => '.capsf-card-stats',
			),
			'style-3'    => array(
				'card'        => '.capsf-s3-card',
				'image'       => '.capsf-s3-thumb',
				'title'       => '.capsf-s3-title',
				'description' => '.capsf-s3-desc',
				'stats'       => '.capsf-s3-stats',
			),
			// style-6 ("Playlist") is a featured post + a list, not a grid of
			// repeated cards - see $playlist_panel_selectors below.
			'style-8'    => array(
				'card'        => '.capsf-s8-item',
				'image'       => '.capsf-s8-thumbnail',
				'title'       => '',
				'description' => '',
				'stats'       => '',
			),
			'reel-1'     => array(
				'card'        => '.capsf-reel-card',
				'image'       => '.capsf-reel-thumbnail',
				'title'       => '.capsf-reel-title',
				'description' => '',
				'stats'       => '.capsf-reel-views',
			),
		);

		/**
		 * Selector map for Playlist-family card styles (one big featured post
		 * + a list of smaller ones). Kept separate from $panel_selectors: the
		 * featured/list elements don't map onto the grid's single "card".
		 *
		 * @var array
		 */
		private static $playlist_panel_selectors = array(
			'style-6' => array(
				'featured_title' => '.capsf-s6-featured-title',
				'featured_thumb' => '.capsf-s6-featured-thumb',
				'item_title'     => '.capsf-s6-title',
				'item_thumb'     => '.capsf-s6-thumb',
				'item_stats'     => '.capsf-s6-list-stats',
			),
		);

		/**
		 * Scoped CSS for the Playlist-family Styles-tab panels
		 * (PlaylistFeaturedStyle / PlaylistListItemStyle in the editor).
		 *
		 * @param int    $feed_id    Feed ID.
		 * @param array  $settings   Flat feed settings.
		 * @param string $card_style Active card style key e.g. 'style-6'.
		 * @return string Raw CSS (no <style> tag) or empty string.
		 */
		public static function get_playlist_panel_css( $feed_id, $settings, $card_style ) {
			$map = self::$playlist_panel_selectors[ sanitize_key( $card_style ) ] ?? array();
			if ( empty( $map ) || ! is_array( $settings ) ) {
				return '';
			}

			$scope = '.capsf-feed-' . absint( $feed_id );
			$css   = '';

			$css .= self::panel_rule( $scope, $map['featured_title'], self::panel_text( $settings, 'playlist_featured_title' ) );
			$css .= self::panel_rule(
				$scope,
				$map['featured_thumb'],
				array_merge(
					self::panel_border( $settings, 'playlist_featured_thumb_border' ),
					self::panel_shadow( $settings, 'playlist_featured_thumb_shadow' )
				)
			);
			$css .= self::panel_rule( $scope, $map['item_title'], self::panel_text( $settings, 'playlist_item_title' ) );
			$css .= self::panel_rule(
				$scope,
				$map['item_thumb'],
				array_merge(
					self::panel_border( $settings, 'playlist_item_thumb_border' ),
					self::panel_shadow( $settings, 'playlist_item_thumb_shadow' )
				)
			);
			$css .= self::panel_rule( $scope, $map['item_stats'], self::panel_text( $settings, 'playlist_item_stats' ) );

			return $css;
		}

		/**
		 * Scoped CSS for the Styles-tab panels from the flat feed settings.
		 *
		 * The `!important` flags are deliberate: these are per-feed user
		 * overrides and must win over each card style's own stylesheet and
		 * the Light/Dark "Mode" preset rules generated by get_css().
		 *
		 * @param int    $feed_id    Feed ID.
		 * @param array  $settings   Flat feed settings (card_bg_*, title_*, …).
		 * @param string $card_style Active card style key e.g. 'style-1'.
		 * @return string Raw CSS (no <style> tag) or empty string.
		 */
		public static function get_panel_css( $feed_id, $settings, $card_style ) {
			$map = self::$panel_selectors[ sanitize_key( $card_style ) ] ?? array();
			if ( empty( $map ) || ! is_array( $settings ) ) {
				return '';
			}

			$scope = '.capsf-feed-' . absint( $feed_id );
			$css   = '';

			if ( ! empty( $map['card'] ) ) {
				$css .= self::panel_rule(
					$scope,
					$map['card'],
					array_merge(
						self::panel_background( $settings ),
						self::panel_border( $settings, 'card_border' ),
						self::panel_box( $settings, 'card_margin', 'margin' ),
						self::panel_box( $settings, 'card_padding', 'padding' ),
						self::panel_shadow( $settings, 'card_shadow' )
					)
				);
			}

			foreach ( array( 'title', 'description', 'stats' ) as $text_key ) {
				if ( ! empty( $map[ $text_key ] ) ) {
					$css .= self::panel_rule( $scope, $map[ $text_key ], self::panel_text( $settings, $text_key ) );
				}
			}

			if ( ! empty( $map['image'] ) ) {
				$css .= self::panel_rule(
					$scope,
					$map['image'],
					array_merge(
						self::panel_border( $settings, 'image_border' ),
						self::panel_shadow( $settings, 'image_shadow' )
					)
				);
			}

			if ( in_array( $card_style, array( 'social-1', 'social-2' ), true ) ) {
				$css .= self::get_caption_css( $scope, $settings );
			}

			$css .= self::get_arrow_offset_css( $scope, $settings );

			return $css;
		}

		/**
		 * Social Post caption: scroll box height + scrollbar (width, colours,
		 * radius) and the Show More / Show Less link's colour and typography.
		 * Written as custom properties consumed by assets/css/frontend.css.
		 *
		 * @param string $scope    Feed scope selector.
		 * @param array  $settings Flat feed settings.
		 * @return string
		 */
		private static function get_caption_css( $scope, $settings ) {
			$vars    = array();
			$numbers = array(
				'caption_scroll_height' => array( '--capsf-caption-h', 40, 800 ),
				'scrollbar_width'       => array( '--capsf-sb-w', 2, 20 ),
				'scrollbar_radius'      => array( '--capsf-sb-radius', 0, 20 ),
			);
			foreach ( $numbers as $key => $def ) {
				$n = self::panel_num( $settings[ $key ] ?? '' );
				if ( null !== $n ) {
					$vars[] = $def[0] . ':' . max( $def[1], min( $def[2], $n ) ) . 'px;';
				}
			}
			$colors = array(
				'scrollbar_thumb_color' => '--capsf-sb-thumb',
				'scrollbar_track_color' => '--capsf-sb-track',
				'show_more_color'       => '--capsf-more-color',
			);
			foreach ( $colors as $key => $var ) {
				$color = self::panel_color( $settings[ $key ] ?? '' );
				if ( $color ) {
					$vars[] = $var . ':' . $color . ';';
				}
			}

			$css = $vars ? $scope . '{' . implode( '', $vars ) . '}' : '';

			// Show More link typography (its colour is the variable above).
			$typo = self::panel_text( $settings, 'show_more' );
			$typo = array_values(
				array_filter(
					$typo,
					static function ( $rule ) {
						return 0 !== strpos( $rule, 'color:' );
					}
				)
			);
			$css .= self::panel_rule( $scope, '.capsf-sc-more', $typo );

			return $css;
		}

		/**
		 * Slider prev/next arrow nudge (Behaviors tab). Vertical shifts both
		 * buttons down (positive) or up (negative); Horizontal moves them
		 * outward (positive) or inward (negative). Slider Style 3 keeps its
		 * arrows in the toolbar, where these offsets have no effect.
		 *
		 * @param string $scope    Feed scope selector.
		 * @param array  $settings Flat feed settings.
		 * @return string
		 */
		private static function get_arrow_offset_css( $scope, $settings ) {
			$y   = self::panel_num( $settings['slider_arrow_offset_y'] ?? '' );
			$x   = self::panel_num( $settings['slider_arrow_offset_x'] ?? '' );
			$css = '';

			if ( null !== $y ) {
				$css .= $scope . ' .capsf-s5-wrapper:not(.capsf-s5-wrapper--carousel) .capsf-s5-btn,' . $scope . ' .capsf-s7-btn{top:calc(50% + ' . $y . 'px)!important;}';
			}
			if ( null !== $x ) {
				$css .= $scope . ' .capsf-s5-wrapper:not(.capsf-s5-wrapper--carousel) .capsf-s5-prev{left:calc(-16px - ' . $x . 'px)!important;}';
				$css .= $scope . ' .capsf-s5-wrapper:not(.capsf-s5-wrapper--carousel) .capsf-s5-next{right:calc(-16px - ' . $x . 'px)!important;}';
				$css .= $scope . ' .capsf-s7-prev{left:calc(50% - (var(--s7-active-w) / 2) - 52px - ' . $x . 'px)!important;}';
				$css .= $scope . ' .capsf-s7-next{right:calc(50% - (var(--s7-active-w) / 2) - 52px - ' . $x . 'px)!important;}';
			}

			return $css;
		}

		/**
		 * Wrap declarations in a rule scoped to the feed. $selectors may be a
		 * comma-separated list; every part gets the scope prefix.
		 *
		 * @param string $scope        Feed scope selector.
		 * @param string $selectors    Comma-separated selectors relative to the scope.
		 * @param array  $declarations CSS declarations.
		 * @return string
		 */
		private static function panel_rule( $scope, $selectors, $declarations ) {
			if ( empty( $declarations ) || '' === $selectors ) {
				return '';
			}
			$parts = array();
			foreach ( explode( ',', $selectors ) as $selector ) {
				$parts[] = $scope . ' ' . trim( $selector );
			}
			return implode( ',', $parts ) . '{' . implode( '', $declarations ) . '}';
		}

		/**
		 * Numeric setting → float, or null when empty / non-numeric.
		 *
		 * @param mixed $value Raw value.
		 * @return float|null
		 */
		private static function panel_num( $value ) {
			return is_numeric( $value ) ? (float) $value : null;
		}

		/**
		 * Colour setting → validated hex (#rgb / #rrggbb / #rrggbbaa) or ''.
		 *
		 * @param mixed $value Raw value.
		 * @return string
		 */
		private static function panel_color( $value ) {
			if ( ! is_string( $value ) || '' === $value ) {
				return '';
			}
			if ( preg_match( '/^#[0-9a-fA-F]{8}$/', $value ) ) {
				return $value;
			}
			$hex = sanitize_hex_color( $value );
			return $hex ? $hex : '';
		}

		/**
		 * Card background - solid colour or 2-stop linear gradient.
		 *
		 * @param array $s Settings.
		 * @return array
		 */
		private static function panel_background( $s ) {
			if ( 'gradient' === ( $s['card_bg_type'] ?? 'solid' ) ) {
				$c1    = self::panel_color( $s['card_bg_gradient_color_1'] ?? '' );
				$c2    = self::panel_color( $s['card_bg_gradient_color_2'] ?? '' );
				$angle = self::panel_num( $s['card_bg_gradient_angle'] ?? '' );
				$c1    = $c1 ? $c1 : '#2271b1';
				$c2    = $c2 ? $c2 : '#e2e8f0';
				$angle = null === $angle ? 90 : $angle;
				return array( 'background:linear-gradient(' . $angle . 'deg,' . $c1 . ',' . $c2 . ')!important;' );
			}

			$color = self::panel_color( $s['card_bg_color'] ?? '' );
			return $color ? array( 'background:' . $color . '!important;' ) : array();
		}

		/**
		 * Border type / colour / width (linked or per-side) / radius (linked or per-corner).
		 *
		 * @param array  $s      Settings.
		 * @param string $prefix Key prefix e.g. 'card_border'.
		 * @return array
		 */
		private static function panel_border( $s, $prefix ) {
			$rules = array();
			$type  = sanitize_key( $s[ $prefix . '_type' ] ?? '' );

			if ( in_array( $type, array( 'solid', 'dashed', 'dotted', 'double' ), true ) ) {
				$color   = self::panel_color( $s[ $prefix . '_color' ] ?? '' );
				$color   = $color ? $color : '#e2e8f0';
				$rules[] = 'border-style:' . $type . '!important;';
				$rules[] = 'border-color:' . $color . '!important;';

				if ( self::panel_linked( $s, $prefix . '_width_linked' ) ) {
					$w       = self::panel_num( $s[ $prefix . '_width' ] ?? '' );
					$rules[] = 'border-width:' . ( null === $w ? 1 : $w ) . 'px!important;';
				} else {
					$rules[] = 'border-width:' . self::panel_sides( $s, $prefix . '_width', array( 'top', 'right', 'bottom', 'left' ) ) . '!important;';
				}
			}

			// Radius applies even without a border type (rounded corners only).
			if ( self::panel_linked( $s, $prefix . '_radius_linked' ) ) {
				$r = self::panel_num( $s[ $prefix . '_radius' ] ?? '' );
				if ( null !== $r ) {
					$rules[] = 'border-radius:' . $r . 'px!important;';
				}
			} elseif ( self::panel_has_any( $s, $prefix . '_radius', array( 'tl', 'tr', 'br', 'bl' ) ) ) {
				$rules[] = 'border-radius:' . self::panel_sides( $s, $prefix . '_radius', array( 'tl', 'tr', 'br', 'bl' ) ) . '!important;';
			}

			return $rules;
		}

		/**
		 * Margin / padding box - linked single value or per-side values.
		 *
		 * @param array  $s        Settings.
		 * @param string $prefix   Key prefix e.g. 'card_margin'.
		 * @param string $property CSS property ('margin' | 'padding').
		 * @return array
		 */
		private static function panel_box( $s, $prefix, $property ) {
			if ( self::panel_linked( $s, $prefix . '_linked' ) ) {
				$v = self::panel_num( $s[ $prefix ] ?? '' );
				return null === $v ? array() : array( $property . ':' . $v . 'px!important;' );
			}
			if ( ! self::panel_has_any( $s, $prefix, array( 'top', 'right', 'bottom', 'left' ) ) ) {
				return array();
			}
			return array( $property . ':' . self::panel_sides( $s, $prefix, array( 'top', 'right', 'bottom', 'left' ) ) . '!important;' );
		}

		/**
		 * Box shadow - needs a colour to apply; offsets/blur/spread default to the UI placeholders.
		 *
		 * @param array  $s      Settings.
		 * @param string $prefix Key prefix e.g. 'card_shadow'.
		 * @return array
		 */
		private static function panel_shadow( $s, $prefix ) {
			$color = self::panel_color( $s[ $prefix . '_color' ] ?? '' );
			if ( ! $color ) {
				return array();
			}
			$get = static function ( $key, $fallback ) use ( $s, $prefix ) {
				$n = self::panel_num( $s[ $prefix . '_' . $key ] ?? '' );
				return null === $n ? $fallback : $n;
			};
			return array(
				'box-shadow:' . $get( 'x', 0 ) . 'px ' . $get( 'y', 4 ) . 'px ' . $get( 'blur', 12 ) . 'px ' . $get( 'spread', 0 ) . 'px ' . $color . '!important;',
			);
		}

		/**
		 * Text colour + typography for a prefix ('title' | 'description' | 'stats' | …).
		 *
		 * @param array  $s      Settings.
		 * @param string $prefix Key prefix.
		 * @return array
		 */
		private static function panel_text( $s, $prefix ) {
			$rules = array();

			$color = self::panel_color( $s[ $prefix . '_color' ] ?? '' );
			if ( $color ) {
				$rules[] = 'color:' . $color . '!important;';
			}
			$size = self::panel_num( $s[ $prefix . '_font_size' ] ?? '' );
			if ( null !== $size ) {
				$rules[] = 'font-size:' . $size . 'px!important;';
			}
			$weight = (string) ( $s[ $prefix . '_font_weight' ] ?? '' );
			if ( preg_match( '/^[1-9]00$/', $weight ) ) {
				$rules[] = 'font-weight:' . $weight . '!important;';
			}
			$transform = sanitize_key( $s[ $prefix . '_text_transform' ] ?? '' );
			if ( in_array( $transform, array( 'uppercase', 'lowercase', 'capitalize' ), true ) ) {
				$rules[] = 'text-transform:' . $transform . '!important;';
			}
			if ( 'italic' === sanitize_key( $s[ $prefix . '_font_style' ] ?? '' ) ) {
				$rules[] = 'font-style:italic!important;';
			}
			$line_height = self::panel_num( $s[ $prefix . '_line_height' ] ?? '' );
			if ( null !== $line_height ) {
				$rules[] = 'line-height:' . $line_height . 'px!important;';
			}
			$letter_spacing = self::panel_num( $s[ $prefix . '_letter_spacing' ] ?? '' );
			if ( null !== $letter_spacing ) {
				$rules[] = 'letter-spacing:' . $letter_spacing . 'px!important;';
			}

			return $rules;
		}

		/**
		 * Is a "linked sides" toggle on? Defaults to linked when never set.
		 *
		 * @param array  $s   Settings.
		 * @param string $key Settings key.
		 * @return bool
		 */
		private static function panel_linked( $s, $key ) {
			return ! isset( $s[ $key ] ) || rest_sanitize_boolean( $s[ $key ] );
		}

		/**
		 * Whether at least one per-side value is set.
		 *
		 * @param array  $s      Settings.
		 * @param string $prefix Key prefix.
		 * @param array  $sides  Side suffixes.
		 * @return bool
		 */
		private static function panel_has_any( $s, $prefix, $sides ) {
			foreach ( $sides as $side ) {
				if ( null !== self::panel_num( $s[ $prefix . '_' . $side ] ?? '' ) ) {
					return true;
				}
			}
			return false;
		}

		/**
		 * Four per-side values (missing / empty → 0) as a CSS shorthand list.
		 *
		 * @param array  $s      Settings.
		 * @param string $prefix Key prefix.
		 * @param array  $sides  Ordered side suffixes.
		 * @return string
		 */
		private static function panel_sides( $s, $prefix, $sides ) {
			$out = array();
			foreach ( $sides as $side ) {
				$n     = self::panel_num( $s[ $prefix . '_' . $side ] ?? '' );
				$out[] = ( null === $n ? 0 : $n ) . 'px';
			}
			return implode( ' ', $out );
		}

		/**
		 * Constructor.
		 *
		 * @param int    $feed_id         Feed ID.
		 * @param array  $style_settings  Decoded style_settings array.
		 * @param string $card_style      Active card style key e.g. 'style-1'.
		 */
		public function __construct( $feed_id, $style_settings, $card_style = 'style-1' ) {
			$this->feed_id        = absint( $feed_id );
			$this->style_settings = is_array( $style_settings ) ? $style_settings : array();
			$this->card_style     = sanitize_key( $card_style );
		}

		/**
		 * Return raw CSS string (no wrapping <style> tag).
		 * Pass to wp_add_inline_style() per WordPress.org JS/CSS rules.
		 *
		 * @return string Raw CSS or empty string.
		 */
		public function get_css() {
			return $this->generate_css();
		}

		/**
		 * Build all CSS rules using the correct selector map for this card style.
		 *
		 * @return string
		 */
		private function generate_css() {
			$selector_map = $this->selector_maps[ $this->card_style ] ?? array();
			if ( empty( $selector_map ) || empty( $this->style_settings ) ) {
				return '';
			}

			$lines = array();
			// Two classes (.capsf-feed.capsf-feed-ID): each design's own stylesheet is
			// printed in the footer, AFTER this inline CSS, so a same-specificity
			// rule there (e.g. .capsf-card-list .capsf-card-item { background }) would
			// otherwise win and keep a Dark Mode card white.
			$scope         = '.capsf-feed.capsf-feed-' . $this->feed_id;
			$card_selector = $selector_map['card'] ?? null;

			foreach ( $selector_map as $element_key => $selector ) {
				$element = $this->style_settings[ $element_key ] ?? array();
				if ( empty( $element ) ) {
					continue;
				}

				foreach ( array(
					'normal' => false,
					'hover'  => true,
				) as $state => $is_hover ) {
					$state_data = $element[ $state ] ?? array();
					if ( empty( $state_data ) ) {
						continue;
					}

					// Dark Cinematic (style-3) always has a fixed dark
					// background + gradient overlay, independent of the
					// Light/Dark "Mode" preset (that preset is designed for
					// the white/solid card background of other styles). Its
					// title, description and channel-name text must always
					// stay light/white to remain readable - so a Light Mode
					// text color can never make this text go dark on top of
					// the dark overlay.
					if ( 'style-3' === $this->card_style && in_array( $element_key, array( 'title', 'description', 'channelName' ), true ) ) {
						unset( $state_data['color'] );
						if ( empty( $state_data ) ) {
							continue;
						}
					}

					$rules = $this->build_rules( $state_data );
					if ( empty( $rules ) ) {
						continue;
					}

					// A map value may list several selectors (comma separated).
					$parts = array();
					foreach ( array_map( 'trim', explode( ',', $selector ) ) as $part ) {
						if ( ! $is_hover ) {
							$parts[] = $scope . ' ' . $part;
						} elseif ( 'card' === $element_key || ! $card_selector ) {
							// Card itself hovered: .scope .card-sel:hover { }.
							$parts[] = $scope . ' ' . $part . ':hover';
						} else {
							// Child element while card is hovered: .scope .card-sel:hover .child-sel { }.
							$parts[] = $scope . ' ' . $card_selector . ':hover ' . $part;
						}
					}
					$full_selector = implode( ', ', $parts );

					$lines[] = $full_selector . ' {';
					foreach ( $rules as $rule ) {
						$lines[] = "\t" . $rule;
					}
					$lines[] = '}';
				}
			}

			return implode( "\n", $lines );
		}

		/**
		 * Build CSS declarations from one element state's settings.
		 *
		 * @param array $state e.g. style_settings['card']['normal'].
		 * @return array
		 */
		private function build_rules( $state ) {
			$rules = array();

			$has_bg_color = ! empty( $state['bg_color'] ) && is_string( $state['bg_color'] );

			// Text color - only emit a rule when explicitly set. Previously,
			// when bg_color was set but color was left empty, this emitted
			// 'color: inherit;' as a fallback - but on hover that pulled the
			// color from the nearest ancestor (often the page's default
			// black text) instead of preserving the template's own explicit
			// color (e.g. white text on Dark Cinematic), which is what
			// caused card text to turn black on hover. Leaving color alone
			// when it isn't explicitly set lets the template's own CSS win.
			if ( ! empty( $state['color'] ) && is_string( $state['color'] ) ) {
				$rules[] = 'color: ' . $this->sanitize_color( $state['color'] ) . ';';
			}

			// Background / overlay color.
			if ( $has_bg_color ) {
				$rules[] = 'background-color: ' . $this->sanitize_color( $state['bg_color'] ) . ';';
			}

			// Font size.
			$font = $state['font'] ?? array();
			if ( ! empty( $font['size'] ) ) {
				$unit    = $this->sanitize_unit( $font['size_unit'] ?? 'px' );
				$rules[] = 'font-size: ' . floatval( $font['size'] ) . $unit . ';';
			}
			if ( ! empty( $font['weight'] ) ) {
				$rules[] = 'font-weight: ' . absint( $font['weight'] ) . ';';
			}

			// Padding.
			$pad = $this->build_spacing( $state['padding'] ?? array(), 'padding' );
			if ( $pad ) {
				$rules[] = $pad;
			}

			// Margin.
			$mar = $this->build_spacing( $state['margin'] ?? array(), 'margin' );
			if ( $mar ) {
				$rules[] = $mar;
			}

			// Border.
			$rules = array_merge( $rules, $this->build_border( $state['border'] ?? array() ) );

			// Box shadow.
			$shadow = $this->build_box_shadow( $state['box_shadow'] ?? array() );
			if ( $shadow ) {
				$rules[] = $shadow;
			}

			return $rules;
		}

		/**
		 * Build padding/margin shorthand.
		 * PaddingControl/MarginControl save { top, right, bottom, left, unit }.
		 *
		 * @param array  $spacing Spacing settings.
		 * @param string $prop    'padding' | 'margin'.
		 * @return string
		 */
		private function build_spacing( $spacing, $prop ) {
			if ( empty( $spacing ) ) {
				return '';
			}
			$unit = $this->sanitize_unit( $spacing['unit'] ?? 'px' );
			$t    = floatval( $spacing['top'] ?? 0 );
			$r    = floatval( $spacing['right'] ?? 0 );
			$b    = floatval( $spacing['bottom'] ?? 0 );
			$l    = floatval( $spacing['left'] ?? 0 );
			if ( 0.0 === $t && 0.0 === $r && 0.0 === $b && 0.0 === $l ) {
				return '';
			}
			return $prop . ': ' . $t . $unit . ' ' . $r . $unit . ' ' . $b . $unit . ' ' . $l . $unit . ';';
		}

		/**
		 * Build border declarations.
		 * BorderControl saves { width, style, color, radius, unit, radiusUnit }.
		 *
		 * @param array $border Border settings.
		 * @return array
		 */
		private function build_border( $border ) {
			$rules = array();
			if ( empty( $border ) ) {
				return $rules;
			}

			$width  = floatval( $border['width'] ?? 0 );
			$bstyle = sanitize_key( $border['style'] ?? 'solid' );
			if ( ! in_array( $bstyle, array( 'none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset' ), true ) ) {
				$bstyle = 'solid';
			}
			$color = ! empty( $border['color'] ) ? $this->sanitize_color( $border['color'] ) : '';
			$unit  = $this->sanitize_unit( $border['unit'] ?? 'px' );

			if ( 'none' === $bstyle ) {
				$rules[] = 'border: none;';
			} elseif ( $width > 0 && $color ) {
				$rules[] = 'border: ' . $width . $unit . ' ' . $bstyle . ' ' . $color . ';';
			}

			$radius      = floatval( $border['radius'] ?? 0 );
			$radius_unit = $this->sanitize_unit( $border['radiusUnit'] ?? 'px' );
			if ( $radius > 0 ) {
				$rules[] = 'border-radius: ' . $radius . $radius_unit . ';';
			}

			return $rules;
		}

		/**
		 * Build box-shadow declaration.
		 * BoxShadowControl saves { x, y, blur, spread, color (hex/8-hex), inset }.
		 *
		 * @param array $shadow Box shadow settings.
		 * @return string
		 */
		private function build_box_shadow( $shadow ) {
			if ( empty( $shadow ) ) {
				return '';
			}
			$x      = floatval( $shadow['x'] ?? 0 );
			$y      = floatval( $shadow['y'] ?? 0 );
			$blur   = floatval( $shadow['blur'] ?? 0 );
			$spread = floatval( $shadow['spread'] ?? 0 );
			$inset  = ! empty( $shadow['inset'] ) ? 'inset ' : '';
			if ( 0.0 === $x && 0.0 === $y && 0.0 === $blur && 0.0 === $spread ) {
				return '';
			}
			$color = '#00000033';
			if ( ! empty( $shadow['color'] ) ) {
				$raw = $shadow['color'];
				if ( preg_match( '/^#[0-9a-fA-F]{8}$/', $raw ) || preg_match( '/^#[0-9a-fA-F]{6}$/', $raw ) ) {
					$color = $raw;
				}
			}
			return 'box-shadow: ' . $inset . $x . 'px ' . $y . 'px ' . $blur . 'px ' . $spread . 'px ' . $color . ';';
		}

		/**
		 * Sanitize color value - allows 6-char and 8-char hex.
		 *
		 * @param string $color Color to sanitize.
		 * @return string
		 */
		private function sanitize_color( $color ) {
			if ( preg_match( '/^#[0-9a-fA-F]{8}$/', $color ) ) {
				return $color;
			}
			$hex_color = sanitize_hex_color( $color );
			return $hex_color ? $hex_color : '';
		}

		/**
		 * Sanitize CSS unit against allowlist.
		 *
		 * @param string $unit Unit to sanitize.
		 * @return string
		 */
		private function sanitize_unit( $unit ) {
			return in_array( $unit, array( 'px', 'em', 'rem', '%', 'vw', 'vh' ), true ) ? $unit : 'px';
		}
	}
}
