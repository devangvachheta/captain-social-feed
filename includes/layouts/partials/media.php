<?php
/**
 * Partial: post image / video thumbnail. Clicking follows the Click Action
 * (popup, inline player or the original post - see get_play_attrs()).
 * Text-only posts (no image) render nothing. Used by social-1 and social-2.
 *
 * Expects $capsf_card plus the loop's $link_class, $link_target,
 * $lightbox_href, $glightbox_attr, $video_link and $title.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( '' === $capsf_card['image'] ) {
	return;
}

$capsf_media_popup  = ! empty( $link_class ) && 'capsf-glightbox' === $link_class;
$capsf_media_href   = $capsf_media_popup && ! empty( $lightbox_href ) ? $lightbox_href : $video_link;
$capsf_media_target = isset( $link_target ) && '' !== $link_target ? $link_target : '_blank';
$capsf_media_class  = 'capsf-sc-media' . ( ! empty( $link_class ) ? ' ' . $link_class : '' ) . ( $capsf_card['is_video'] ? ' capsf-sc-media--video' : '' );
$capsf_media_label  = $capsf_card['is_video'] ? __( 'Play video', 'captain-social-feed' ) : __( 'Open post', 'captain-social-feed' );
?>
<a class="<?php echo esc_attr( $capsf_media_class ); ?>" href="<?php echo esc_url( $capsf_media_href ); ?>" target="<?php echo esc_attr( $capsf_media_target ); ?>"<?php if ( '_blank' === $capsf_media_target ) : ?> rel="noopener noreferrer"<?php endif; ?> aria-label="<?php echo esc_attr( $capsf_media_label ); ?>"<?php if ( ! empty( $capsf_glightbox ) ) : ?> data-glightbox="<?php echo esc_attr( $capsf_glightbox ); ?>"<?php endif; ?><?php if ( ! empty( $capsf_inline_src ) ) : ?> data-inline-src="<?php echo esc_url( $capsf_inline_src ); ?>"<?php endif; ?>>
	<img class="capsf-sc-image" src="<?php echo esc_url( $capsf_card['image'] ); ?>" alt="<?php echo esc_attr( $title ); ?>" loading="lazy" width="600" height="600">
	<?php if ( $capsf_card['is_video'] ) : ?>
		<span class="capsf-sc-play"><?php echo wp_kses( Capsf_Shortcode::play_icons( 'capsf-sc' ), Capsf_Shortcode::allowed_svg_tags() ); ?></span>
	<?php endif; ?>
</a>
