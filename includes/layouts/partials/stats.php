<?php
/**
 * Partial: likes / comments / shares row (Layout tab → "Show Likes").
 * Icons follow the platform: Facebook reactions, a heart elsewhere, and a
 * repost icon for X. Used by social-1 and social-2.
 *
 * Expects $capsf_card (see Capsf_Shortcode::get_card_data()).
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( empty( $capsf_card['show_stats'] ) ) {
	return;
}
?>
<div class="capsf-sc-stats">
	<span class="capsf-sc-stat capsf-sc-stat--likes">
		<?php if ( 'facebook' === $capsf_card['platform'] ) : ?>
			<span class="capsf-sc-reactions" aria-hidden="true">
				<svg class="capsf-sc-reaction capsf-sc-reaction--like" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="12"/><path d="M7 11h2v6H7zm3 6v-6l2.6-4.2c.4-.6 1.4-.3 1.4.4V10h3c.7 0 1.2.6 1 1.3l-1.2 4.8c-.1.5-.6.9-1.1.9z" fill="#fff"/></svg>
				<svg class="capsf-sc-reaction capsf-sc-reaction--love" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="12"/><path d="M12 17.5s-5-3.1-5-6.6C7 9.2 8.2 8 9.7 8c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.5 0 2.7 1.2 2.7 2.9 0 3.5-5 6.6-5 6.6z" fill="#fff"/></svg>
			</span>
		<?php else : ?>
			<svg class="capsf-sc-stat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
		<?php endif; ?>
		<span class="capsf-sc-count"><?php echo esc_html( $capsf_card['likes'] ); ?></span>
		<span class="screen-reader-text"><?php esc_html_e( 'likes', 'captain-social-feed' ); ?></span>
	</span>

	<span class="capsf-sc-stat capsf-sc-stat--comments">
		<svg class="capsf-sc-stat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
		<span class="capsf-sc-count"><?php echo esc_html( $capsf_card['comments'] ); ?></span>
		<span class="screen-reader-text"><?php esc_html_e( 'comments', 'captain-social-feed' ); ?></span>
	</span>

	<span class="capsf-sc-stat capsf-sc-stat--shares">
		<?php if ( 'twitter' === $capsf_card['platform'] ) : ?>
			<svg class="capsf-sc-stat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7h9l-2.5-2.5M17 17H8l2.5 2.5M5 10v-1a2 2 0 0 1 2-2M19 14v1a2 2 0 0 1-2 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
		<?php else : ?>
			<svg class="capsf-sc-stat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14 5l6 6-6 6v-3.5c-4.5 0-7.5 1.2-10 4.5 1-4.8 4-8.6 10-9.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
		<?php endif; ?>
		<span class="capsf-sc-count"><?php echo esc_html( $capsf_card['shares'] ); ?></span>
		<span class="screen-reader-text"><?php esc_html_e( 'shares', 'captain-social-feed' ); ?></span>
	</span>
</div>
