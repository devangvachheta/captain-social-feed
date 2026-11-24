<?php
/**
 * Template for social feed card - Style 2
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_s2_link_class     = isset( $capsf_link_class ) ? $capsf_link_class : ( isset( $link_class ) ? $link_class : '' );
$capsf_s2_lightbox_href   = isset( $capsf_lightbox_href ) ? $capsf_lightbox_href : ( isset( $lightbox_href ) ? $lightbox_href : $video_link );
$capsf_s2_link_target     = isset( $capsf_link_target ) ? $capsf_link_target : ( isset( $link_target ) ? $link_target : '_blank' );
$capsf_s2_glightbox_attr = isset( $capsf_glightbox_attr ) ? $capsf_glightbox_attr : ( isset( $glightbox_attr ) ? $glightbox_attr : '' );
$capsf_s2_item_class     = isset( $capsf_item_class ) ? $capsf_item_class : ( isset( $item_class ) ? $item_class : '' );
$capsf_s2_item_attrs     = isset( $capsf_item_attrs ) ? $capsf_item_attrs : ( isset( $item_attrs ) ? $item_attrs : '' );

// Determine href and target based on play mode.
$capsf_card_href   = 'capsf-glightbox' === $capsf_s2_link_class ? $capsf_s2_lightbox_href : $video_link;
$capsf_card_target = '' !== $capsf_s2_link_target ? esc_attr( $capsf_s2_link_target ) : '_blank';
$capsf_card_class  = 'capsf-card-item' . ( ! empty( $capsf_s2_link_class ) ? ' ' . esc_attr( $capsf_s2_link_class ) : '' ) . ( ! empty( $capsf_s2_item_class ) ? ' ' . esc_attr( $capsf_s2_item_class ) : '' );
$capsf_extra_attrs = ! empty( $capsf_s2_glightbox_attr ) ? ' ' . $capsf_s2_glightbox_attr : '';
?>

<a href="<?php echo esc_url( $capsf_card_href ); ?>" class="<?php echo esc_attr( $capsf_card_class ); ?>" target="<?php echo esc_attr( $capsf_card_target ); ?>"<?php echo $capsf_extra_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above ?><?php echo $capsf_s2_item_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>

	<div class="capsf-card-thumb-wrap">
		<img class="capsf-card-thumbnail"
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
			<div class="capsf-card-play-overlay"><?php echo Capsf_Shortcode::play_icons( 'capsf-card' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></div>
		<?php endif; ?>

		<?php if ( ! empty( $duration_label ) ) : ?>
			<span class="capsf-card-duration"><?php echo esc_html( $duration_label ); ?></span>
		<?php endif; ?>
	</div>

	<div class="capsf-card-body">
		<span class="capsf-card-badge">
			<?php echo Capsf_Shortcode::avatar_or_icon( $capsf_card, 18 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?>
			<?php echo esc_html( $channel ); ?><?php echo Capsf_Shortcode::trailing_platform_icon( $capsf_card ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?>
		</span>

		<h3 dir="auto"><?php echo esc_html( $title ); ?></h3>

		<?php if ( ! empty( $views_label ) || ! empty( $time_ago_label ) ) : ?>
			<p class="capsf-card-stats">
				<?php
				$capsf_s2_stats = array();
				if ( ! empty( $views_label ) ) {
					/* translators: %s: formatted like count, e.g. "186" */
					$capsf_s2_stats[] = sprintf( esc_html__( '%s Likes', 'captain-social-feed' ), esc_html( $views_label ) );
				}
				if ( ! empty( $time_ago_label ) ) {
					$capsf_s2_stats[] = esc_html( $time_ago_label );
				}
				echo esc_html( implode( ' • ', $capsf_s2_stats ) );
				?>
			</p>
		<?php endif; ?>

		<div class="capsf-card-footer">
			<span class="capsf-card-channel"><?php echo esc_html( $channel ); ?></span>
			<div class="capsf-card-arrow">
				<svg viewBox="0 0 24 24">
					<line x1="5" y1="12" x2="19" y2="12"/>
					<polyline points="12 5 19 12 12 19"/>
				</svg>
			</div>
		</div>
	</div>
</a>
