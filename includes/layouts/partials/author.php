<?php
/**
 * Partial: author row - avatar, account name, time ago, platform logo.
 * Used by the Social Post designs (social-1, social-2).
 *
 * Expects $capsf_card (see Capsf_Shortcode::get_card_data()).
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="capsf-sc-author">
	<?php if ( ! empty( $capsf_card['avatar'] ) ) : ?>
		<img class="capsf-sc-avatar" src="<?php echo esc_url( $capsf_card['avatar'] ); ?>" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">
	<?php else : ?>
		<span class="capsf-sc-avatar capsf-sc-avatar--initial" aria-hidden="true"><?php echo esc_html( $capsf_card['initial'] ); ?></span>
	<?php endif; ?>

	<div class="capsf-sc-author-meta">
		<span class="capsf-sc-author-name"><?php echo esc_html( $capsf_card['author'] ); ?></span>
		<?php if ( '' !== $capsf_card['time_ago'] ) : ?>
			<span class="capsf-sc-time"><?php echo esc_html( $capsf_card['time_ago'] ); ?></span>
		<?php endif; ?>
	</div>

	<?php if ( '' !== $capsf_card['platform_label'] && '' !== $capsf_card['permalink'] ) : ?>
		<a class="capsf-sc-platform" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer">
			<?php
			/* translators: %s: platform name, e.g. "Facebook". */
			echo wp_kses( Capsf_Shortcode::platform_icon( $capsf_card['platform'], sprintf( __( 'View on %s', 'captain-social-feed' ), $capsf_card['platform_label'] ) ), Capsf_Shortcode::allowed_svg_tags() );
			?>
		</a>
	<?php endif; ?>
</div>
