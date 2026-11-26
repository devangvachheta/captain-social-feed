<?php
/**
 * Template: Simple Grid (style-8) - square pictures; on hover a dark layer
 * shows the likes, comments and the start of the caption. A badge in the
 * corner marks albums and videos. Clicking opens the post popup
 * (assets/js/capsf-post-popup.js): picture / album slider / video, likes,
 * comments, caption and date. Without JavaScript the link opens the post.
 *
 * Expects $capsf_card (Capsf_Shortcode::get_card_data()), $item_class,
 * $item_attrs, $title and $high.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_s8_is_album = count( $capsf_card['gallery'] ) > 1 || 'carousel' === ( $item['post_type'] ?? '' );
$capsf_s8_badge    = $capsf_s8_is_album ? 'album' : ( $capsf_card['is_video'] ? 'video' : '' );
$capsf_s8_image    = '' !== $capsf_card['image'] ? $capsf_card['image'] : ( ! empty( $high ) ? $high : '' );
$capsf_s8_caption  = '' !== $capsf_card['caption'] ? ( function_exists( 'mb_substr' ) ? mb_substr( $capsf_card['caption'], 0, 160 ) : substr( $capsf_card['caption'], 0, 160 ) ) : '';
$capsf_s8_label    = sprintf(
	/* translators: %s: account name. */
	__( 'Open post by %s', 'captain-social-feed' ),
	$capsf_card['author']
);
$capsf_s8_item_cl = ! empty( $capsf_item_class ) ? $capsf_item_class : ( ! empty( $item_class ) ? $item_class : '' );
$capsf_s8_index   = isset( $capsf_item_index ) ? $capsf_item_index : ( isset( $index ) ? $index : 0 );
?>
<div class="capsf-s8-item<?php echo ! empty( $capsf_s8_item_cl ) ? ' ' . esc_attr( $capsf_s8_item_cl ) : ''; ?>" data-capsf-item data-capsf-index="<?php echo absint( $capsf_s8_index ); ?>">
	<a class="capsf-s8-card capsf-pp-open" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php echo esc_attr( $capsf_s8_label ); ?>" aria-haspopup="dialog">
		<?php if ( '' !== $capsf_s8_image ) : ?>
			<img class="capsf-s8-thumbnail" src="<?php echo esc_url( $capsf_s8_image ); ?>" loading="lazy" width="480" height="480" alt="<?php echo esc_attr( $title ); ?>">
		<?php else : ?>
			<span class="capsf-s8-text" dir="auto"><?php echo esc_html( $capsf_s8_caption ); ?></span>
		<?php endif; ?>

		<?php if ( 'album' === $capsf_s8_badge ) : ?>
			<span class="capsf-s8-badge" title="<?php esc_attr_e( 'Album', 'captain-social-feed' ); ?>">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 2h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z"/><path d="M2 8v11a3 3 0 0 0 3 3h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
				<span class="screen-reader-text"><?php esc_html_e( 'Album', 'captain-social-feed' ); ?></span>
			</span>
		<?php elseif ( 'video' === $capsf_s8_badge ) : ?>
			<span class="capsf-s8-badge" title="<?php esc_attr_e( 'Video', 'captain-social-feed' ); ?>">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M10 8.5v7l6-3.5z" fill="#000"/></svg>
				<span class="screen-reader-text"><?php esc_html_e( 'Video', 'captain-social-feed' ); ?></span>
			</span>
		<?php endif; ?>

		<span class="capsf-s8-overlay" aria-hidden="true">
			<?php if ( $capsf_card['show_stats'] && empty( $capsf_card['no_metrics'] ) ) : ?>
				<span class="capsf-s8-stats">
					<span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><?php echo esc_html( $capsf_card['likes'] ); ?></span>
					<span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><?php echo esc_html( $capsf_card['comments'] ); ?></span>
				</span>
			<?php endif; ?>
			<?php if ( '' !== $capsf_s8_caption && '' !== $capsf_s8_image ) : ?>
				<span class="capsf-s8-caption" dir="auto"><?php echo esc_html( $capsf_s8_caption ); ?></span>
			<?php endif; ?>
		</span>
	</a>

	<template class="capsf-pp-data">
		<div class="<?php echo esc_attr( 'capsf-pp' . ( $capsf_card['dark'] ? ' capsf-pp--dark' : '' ) ); ?>">
			<header class="capsf-pp-head">
				<?php if ( '' !== $capsf_card['avatar'] ) : ?>
					<img class="capsf-pp-avatar" src="<?php echo esc_url( $capsf_card['avatar'] ); ?>" alt="" width="40" height="40" referrerpolicy="no-referrer">
				<?php else : ?>
					<span class="capsf-pp-avatar capsf-pp-avatar--initial" aria-hidden="true"><?php echo esc_html( $capsf_card['initial'] ); ?></span>
				<?php endif; ?>
				<span class="capsf-pp-name" dir="auto"><?php echo esc_html( $capsf_card['author'] ); ?></span>
				<?php if ( '' !== $capsf_card['profile_url'] ) : ?>
					<a class="capsf-pp-follow" href="<?php echo esc_url( $capsf_card['profile_url'] ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Follow', 'captain-social-feed' ); ?></a>
				<?php endif; ?>
				<a class="capsf-pp-platform" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo wp_kses( Capsf_Shortcode::platform_icon( $capsf_card['platform'] ), Capsf_Shortcode::allowed_svg_tags() ); ?>
					<span class="screen-reader-text">
						<?php
						/* translators: %s: platform name, e.g. Instagram. */
						echo esc_html( sprintf( __( 'View on %s', 'captain-social-feed' ), $capsf_card['platform_label'] ) );
						?>
					</span>
				</a>
			</header>

			<?php if ( $capsf_card['gallery'] ) : ?>
				<div class="capsf-pp-media">
					<div class="capsf-pp-track">
						<?php foreach ( $capsf_card['gallery'] as $capsf_slide ) : ?>
							<div class="capsf-pp-slide">
								<?php if ( 'video' === $capsf_slide['type'] ) : ?>
									<video controls playsinline preload="none" src="<?php echo esc_url( $capsf_slide['src'] ); ?>"<?php echo ! empty( $capsf_slide['poster'] ) ? ' poster="' . esc_url( $capsf_slide['poster'] ) . '"' : ''; ?>></video>
								<?php elseif ( 'embed' === $capsf_slide['type'] ) : ?>
									<iframe data-src="<?php echo esc_url( $capsf_slide['src'] ); ?>" title="<?php esc_attr_e( 'Video player', 'captain-social-feed' ); ?>" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
								<?php elseif ( ! empty( $capsf_slide['is_video'] ) ) : ?>
									<a class="capsf-pp-video-link" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer">
										<img src="<?php echo esc_url( $capsf_slide['src'] ); ?>" alt="">
										<?php echo wp_kses( Capsf_Shortcode::play_icons( 'capsf-pp' ), Capsf_Shortcode::allowed_svg_tags() ); ?>
										<span class="screen-reader-text"><?php esc_html_e( 'Play video on the original post', 'captain-social-feed' ); ?></span>
									</a>
								<?php else : ?>
									<img src="<?php echo esc_url( $capsf_slide['src'] ); ?>" alt="<?php echo esc_attr( $title ); ?>">
								<?php endif; ?>
							</div>
						<?php endforeach; ?>
					</div>
				</div>
			<?php endif; ?>

			<footer class="capsf-pp-foot">
				<?php if ( empty( $capsf_card['no_metrics'] ) ) : ?>
					<div class="capsf-pp-stats">
						<span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20.3s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><?php echo esc_html( $capsf_card['likes'] ); ?><span class="screen-reader-text"><?php esc_html_e( 'likes', 'captain-social-feed' ); ?></span></span>
						<span><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg><?php echo esc_html( $capsf_card['comments'] ); ?><span class="screen-reader-text"><?php esc_html_e( 'comments', 'captain-social-feed' ); ?></span></span>
						<button type="button" class="capsf-pp-share" data-url="<?php echo esc_url( $capsf_card['permalink'] ); ?>" data-copied="<?php esc_attr_e( 'Link copied', 'captain-social-feed' ); ?>">
							<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21.5 3 3 10.2l7 2.8M21.5 3l-7.2 18.5-3.3-8.5M21.5 3 11 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>
							<span class="screen-reader-text"><?php esc_html_e( 'Share', 'captain-social-feed' ); ?></span>
						</button>
					</div>
				<?php endif; ?>
				<?php if ( '' !== $capsf_card['caption'] ) : ?>
					<p class="capsf-pp-caption" dir="auto"><strong><?php echo esc_html( $capsf_card['author'] ); ?></strong> <?php echo wp_kses_post( Capsf_Shortcode::linkify( $capsf_card['caption'], $capsf_card['platform'] ) ); ?></p>
				<?php endif; ?>
				<?php if ( '' !== $capsf_card['date_full'] ) : ?>
					<p class="capsf-pp-date"><?php echo esc_html( $capsf_card['date_full'] ); ?></p>
				<?php endif; ?>
			</footer>
		</div>
	</template>
</div>
