<?php
/**
 * Template for social feed card - Style 3
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_s3_link_class     = isset( $capsf_link_class ) ? $capsf_link_class : ( isset( $link_class ) ? $link_class : '' );
$capsf_s3_lightbox_href   = isset( $capsf_lightbox_href ) ? $capsf_lightbox_href : ( isset( $lightbox_href ) ? $lightbox_href : $video_link );
$capsf_s3_link_target     = isset( $capsf_link_target ) ? $capsf_link_target : ( isset( $link_target ) ? $link_target : '_blank' );
$capsf_s3_glightbox_attr = isset( $capsf_glightbox_attr ) ? $capsf_glightbox_attr : ( isset( $glightbox_attr ) ? $glightbox_attr : '' );
$capsf_s3_item_class     = isset( $capsf_item_class ) ? $capsf_item_class : ( isset( $item_class ) ? $item_class : '' );
$capsf_s3_item_attrs     = isset( $capsf_item_attrs ) ? $capsf_item_attrs : ( isset( $item_attrs ) ? $item_attrs : '' );

// Determine href, target, class based on play mode.
$capsf_s3_href    = 'capsf-glightbox' === $capsf_s3_link_class ? $capsf_s3_lightbox_href : $video_link;
$capsf_s3_target  = '' !== $capsf_s3_link_target ? esc_attr( $capsf_s3_link_target ) : '_blank';
$capsf_s3_class   = 'capsf-s3-card' . ( ! empty( $capsf_s3_link_class ) ? ' ' . esc_attr( $capsf_s3_link_class ) : '' ) . ( ! empty( $capsf_s3_item_class ) ? ' ' . esc_attr( $capsf_s3_item_class ) : '' );
$capsf_s3_extra   = ! empty( $capsf_s3_glightbox_attr ) ? ' ' . $capsf_s3_glightbox_attr : '';
?>

<a href="<?php echo esc_url( $capsf_s3_href ); ?>" class="<?php echo esc_attr( $capsf_s3_class ); ?>" target="<?php echo esc_attr( $capsf_s3_target ); ?>"<?php echo $capsf_s3_extra; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php echo $capsf_s3_item_attrs; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>

	<!-- Thumbnail -->
	<img class="capsf-s3-thumb"
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

	<?php if ( ! empty( $duration_label ) ) : ?>
		<span class="capsf-s3-duration"><?php echo esc_html( $duration_label ); ?></span>
	<?php endif; ?>

	<?php if ( $capsf_card['is_video'] ) : ?>
	<!-- Play circle (hover) -->
	<div class="capsf-s3-play">
		<svg class="capsf-s3-icon-play" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<polygon points="5,3 19,12 5,21"/>
		</svg>
		<svg class="capsf-s3-icon-pause" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<rect x="5" y="3" width="5" height="18"/>
			<rect x="14" y="3" width="5" height="18"/>
		</svg>
	</div>
	<?php endif; ?>

	<!-- Gradient overlay with content -->
	<div class="capsf-s3-overlay">

		<!-- Channel badge -->
		<div class="capsf-s3-meta">
			<span class="capsf-s3-channel-badge">
				<?php echo Capsf_Shortcode::avatar_or_icon( $capsf_card, 16 ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?>
				<?php echo esc_html( $channel ); ?><?php echo Capsf_Shortcode::trailing_platform_icon( $capsf_card ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in the helper. ?>
			</span>
		</div>

		<!-- Title -->
		<h3 class="capsf-s3-title" dir="auto"><?php echo esc_html( $title ); ?></h3>

		<?php if ( ! empty( $views_label ) || ! empty( $time_ago_label ) ) : ?>
			<p class="capsf-s3-stats">
				<?php
				$capsf_s3_stats = array();
				if ( ! empty( $views_label ) ) {
					/* translators: %s: formatted like count, e.g. "186" */
					$capsf_s3_stats[] = sprintf( esc_html__( '%s Likes', 'captain-social-feed' ), esc_html( $views_label ) );
				}
				if ( ! empty( $time_ago_label ) ) {
					$capsf_s3_stats[] = esc_html( $time_ago_label );
				}
				echo esc_html( implode( ' • ', $capsf_s3_stats ) );
				?>
			</p>
		<?php endif; ?>

		<!-- Description (reveals on hover) -->
		<p class="capsf-s3-desc" dir="auto">
			<?php echo ! empty( $description ) ? esc_html( $description ) : ''; ?>
		</p>
	</div>

</a>
