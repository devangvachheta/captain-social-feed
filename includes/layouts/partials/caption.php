<?php
/**
 * Partial: post caption - "Show More" / "Show Less" toggle, or a fixed-height
 * scrollable box (Layout tab → Caption). Used by social-1 and social-2.
 *
 * Expects $capsf_card (see Capsf_Shortcode::get_card_data()).
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( '' === trim( $capsf_card['caption'] ) ) {
	return;
}
?>
<?php if ( 'scroll' === $capsf_card['caption_mode'] ) : ?>
	<div class="capsf-sc-caption capsf-sc-caption--scroll" tabindex="0" role="region" aria-label="<?php esc_attr_e( 'Post caption', 'captain-social-feed' ); ?>">
		<p class="capsf-sc-caption-text" dir="auto"><span class="capsf-sc-caption-full"><?php echo esc_html( $capsf_card['caption'] ); ?></span></p>
	</div>
<?php else : ?>
	<div class="capsf-sc-caption">
		<p class="capsf-sc-caption-text" dir="auto">
			<?php if ( '' !== $capsf_card['caption_short'] ) : ?>
				<span class="capsf-sc-caption-short"><?php echo esc_html( $capsf_card['caption_short'] ); ?><span aria-hidden="true"> ...</span></span>
				<span class="capsf-sc-caption-full" hidden><?php echo esc_html( $capsf_card['caption'] ); ?></span>
				<button type="button" class="capsf-sc-more" aria-expanded="false" data-more="<?php echo esc_attr( $capsf_card['more_text'] ); ?>" data-less="<?php echo esc_attr( $capsf_card['less_text'] ); ?>"><?php echo esc_html( $capsf_card['more_text'] ); ?></button>
			<?php else : ?>
				<span class="capsf-sc-caption-full"><?php echo esc_html( $capsf_card['caption'] ); ?></span>
			<?php endif; ?>
		</p>
	</div>
<?php endif; ?>
