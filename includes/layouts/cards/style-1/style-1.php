<?php
/**
 * Template for social feed card - Style 1
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Lightbox support.
$capsf_s1_link_class     = isset( $capsf_link_class ) ? $capsf_link_class : ( isset( $link_class ) ? $link_class : '' );
$capsf_s1_lightbox_href   = isset( $capsf_lightbox_href ) ? $capsf_lightbox_href : ( isset( $lightbox_href ) ? $lightbox_href : $video_link );
$capsf_s1_link_target     = isset( $capsf_link_target ) ? $capsf_link_target : ( isset( $link_target ) ? $link_target : '_blank' );
$capsf_s1_glightbox_attr = isset( $capsf_glightbox_attr ) ? $capsf_glightbox_attr : ( isset( $glightbox_attr ) ? $glightbox_attr : '' );
$capsf_s1_item_class     = isset( $capsf_item_class ) ? $capsf_item_class : ( isset( $item_class ) ? $item_class : '' );
$capsf_s1_item_attrs     = isset( $capsf_item_attrs ) ? $capsf_item_attrs : ( isset( $item_attrs ) ? $item_attrs : '' );

$capsf_s1_href    = 'capsf-glightbox' === $capsf_s1_link_class ? $capsf_s1_lightbox_href : $video_link;
$capsf_s1_target  = '' !== $capsf_s1_link_target ? esc_attr( $capsf_s1_link_target ) : '_blank';
$capsf_s1_class   = 'capsf-s1-thumb-wrap yt-card-thumb-wrap' . ( ! empty( $capsf_s1_link_class ) ? ' ' . esc_attr( $capsf_s1_link_class ) : '' );
$capsf_s1_extra   = ! empty( $capsf_s1_glightbox_attr ) ? ' ' . $capsf_s1_glightbox_attr : '';
$capsf_s1_item_cl = ! empty( $capsf_s1_item_class ) ? ' ' . esc_attr( $capsf_s1_item_class ) : '';
?>
<div class="capsf-s1-card yt-card<?php echo $capsf_s1_item_cl; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>"<?php echo $capsf_s1_item_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<a class="<?php echo esc_attr( $capsf_s1_class ); ?>" href="<?php echo esc_url( $capsf_s1_href ); ?>" target="<?php echo esc_attr( $capsf_s1_target ); ?>"<?php echo $capsf_s1_extra; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<img class="capsf-s1-thumbnail yt-card-thumbnail"
			src="<?php echo esc_url( $medium ); ?>"
			srcset="
				<?php echo esc_url( $default ); ?> 120w,
				<?php echo esc_url( $medium ); ?> 320w,
				<?php echo esc_url( $high ); ?> 480w
			"
			sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
			loading="lazy"
			width="480"
			height="360"
			alt="<?php echo esc_attr( $title ); ?>">

		<?php if ( $capsf_card['is_video'] ) : ?>
			<div class="capsf-s1-play-btn yt-card-play-btn"><?php echo Capsf_Shortcode::play_icons( 'capsf-s1' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></div>
		<?php endif; ?>

		<?php if ( ! empty( $duration_label ) ) : ?>
			<span class="capsf-s1-duration yt-card-duration"><?php echo esc_html( $duration_label ); ?></span>
		<?php endif; ?>
	</a>

	<div class="capsf-s1-content yt-card-content">
		<h3 class="capsf-s1-title yt-card-title" dir="auto"><?php echo esc_html( $title ); ?></h3>

		<?php if ( ! empty( $views_label ) || ! empty( $time_ago_label ) ) : ?>
			<p class="capsf-s1-stats yt-card-stats">
				<?php
				$capsf_s1_stats = array();
				if ( ! empty( $views_label ) ) {
					/* translators: %s: formatted like count, e.g. "186" */
					$capsf_s1_stats[] = sprintf( esc_html__( '%s Likes', 'captain-social-feed' ), esc_html( $views_label ) );
				}
				if ( ! empty( $time_ago_label ) ) {
					$capsf_s1_stats[] = esc_html( $time_ago_label );
				}
				echo esc_html( implode( ' • ', $capsf_s1_stats ) );
				?>
			</p>
		<?php endif; ?>

		<?php if ( ! empty( $description ) ) : ?>
			<p class="capsf-s1-description yt-card-description" dir="auto"><?php echo esc_html( $description ); ?></p>
		<?php endif; ?>

		<div class="capsf-s1-channel-info yt-channel-info">
			<div class="capsf-s1-channel-dot yt-channel-dot"><?php echo Capsf_Shortcode::avatar_or_icon( $capsf_card, 28 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?></div>
			<span class="capsf-s1-channel-name yt-channel-name"><?php echo esc_html( $channel ); ?></span>
			<span class="capsf-s1-channel-platform yt-channel-platform"><?php echo Capsf_Shortcode::trailing_platform_icon( $capsf_card ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?></span>
		</div>
	</div>
</div>
