<?php
/**
 * Template for social feed card - Reel Card
 *
 * Portrait thumbnail, caption, like count and the platform logo - a
 * Reels-style browse card for any platform.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_reel_link_cl    = isset( $capsf_link_class ) ? $capsf_link_class : ( isset( $link_class ) ? $link_class : '' );
$capsf_reel_lb_href    = isset( $capsf_lightbox_href ) ? $capsf_lightbox_href : ( isset( $lightbox_href ) ? $lightbox_href : $video_link );
$capsf_reel_target_raw = isset( $capsf_link_target ) ? $capsf_link_target : ( isset( $link_target ) ? $link_target : '' );
$capsf_reel_gb_attr    = isset( $capsf_glightbox_attr ) ? $capsf_glightbox_attr : ( isset( $glightbox_attr ) ? $glightbox_attr : '' );
$capsf_reel_it_cl      = isset( $capsf_item_class ) ? $capsf_item_class : ( isset( $item_class ) ? $item_class : '' );
$capsf_reel_it_at      = isset( $capsf_item_attrs ) ? $capsf_item_attrs : ( isset( $item_attrs ) ? $item_attrs : '' );

$capsf_reel_idx    = isset( $capsf_item_index ) ? absint( $capsf_item_index ) : ( isset( $index ) ? absint( $index ) : 0 );
$capsf_reel_href   = 'capsf-glightbox' === $capsf_reel_link_cl ? $capsf_reel_lb_href : $video_link;
$capsf_reel_target = '' !== $capsf_reel_target_raw ? $capsf_reel_target_raw : '_blank';
$capsf_reel_class  = 'capsf-reel-thumb-wrap' . ( ! empty( $capsf_reel_link_cl ) ? ' ' . $capsf_reel_link_cl : '' );
$capsf_reel_card_c = 'capsf-reel-card' . ( ! empty( $capsf_reel_it_cl ) ? ' ' . $capsf_reel_it_cl : '' );
?>
<div class="<?php echo esc_attr( $capsf_reel_card_c ); ?>" data-capsf-item data-capsf-index="<?php echo absint( $capsf_reel_idx ); ?>">
	<a class="<?php echo esc_attr( $capsf_reel_class ); ?>" href="<?php echo esc_url( $capsf_reel_href ); ?>" target="<?php echo esc_attr( $capsf_reel_target ); ?>"<?php if ( '_blank' === $capsf_reel_target ) : ?> rel="noopener noreferrer"<?php endif; ?><?php if ( ! empty( $capsf_glightbox ) ) : ?> data-glightbox="<?php echo esc_attr( $capsf_glightbox ); ?>"<?php endif; ?><?php if ( ! empty( $capsf_inline_src ) ) : ?> data-inline-src="<?php echo esc_url( $capsf_inline_src ); ?>"<?php endif; ?>>
		<img class="capsf-reel-thumbnail"
			src="<?php echo esc_url( $medium ); ?>"
			srcset="
				<?php echo esc_url( $medium ); ?> 320w,
				<?php echo esc_url( $high ); ?> 480w
			"
			sizes="(max-width: 480px) 50vw, (max-width: 768px) 33vw, 20vw"
			loading="lazy"
			width="360"
			height="480"
			alt="<?php echo esc_attr( $title ); ?>">

		<?php if ( $capsf_card['is_video'] ) : ?>
			<div class="capsf-reel-play-btn"><?php echo wp_kses( Capsf_Shortcode::play_icons( 'capsf-reel' ), Capsf_Shortcode::allowed_svg_tags() ); ?></div>
		<?php endif; ?>

		<?php if ( ! empty( $duration_label ) ) : ?>
			<span class="capsf-reel-duration"><?php echo esc_html( $duration_label ); ?></span>
		<?php endif; ?>
	</a>

	<div class="capsf-reel-content">
		<h3 class="capsf-reel-title" dir="auto"><?php echo esc_html( $title ); ?></h3>
		<?php echo wp_kses( Capsf_Shortcode::platform_icon( $capsf_card['platform'] ), Capsf_Shortcode::allowed_svg_tags() ); ?>
	</div>

	<?php if ( ! empty( $views_label ) ) : ?>
		<p class="capsf-reel-views">
			<?php /* translators: %s: formatted like count, e.g. "1.8M" */ echo esc_html( sprintf( __( '%s likes', 'captain-social-feed' ), $views_label ) ); ?>
		</p>
	<?php endif; ?>
</div>
