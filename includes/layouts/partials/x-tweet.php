<?php
/**
 * Partial: one X post card - "Reposted" label, author row with verified
 * badge and the X logo, stars (Testimonials), text with links, photos (up
 * to 4) or video, and reply / repost / like counts with a Share menu.
 * Used by the x-timeline and x-grid designs.
 *
 * Expects $capsf_card (Capsf_Shortcode::get_card_data()) plus the loop's
 * $item_class, $item_attrs, $link_class, $link_target, $lightbox_href,
 * $glightbox_attr and $video_link.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_x_popup    = ! empty( $link_class ) && 'capsf-glightbox' === $link_class;
$capsf_x_target   = isset( $link_target ) && '' !== $link_target ? $link_target : '_blank';
$capsf_x_rel      = '_blank' === $capsf_x_target ? ' rel="noopener noreferrer"' : '';
$capsf_x_images   = $capsf_card['images'] ? $capsf_card['images'] : ( '' !== $capsf_card['image'] ? array( $capsf_card['image'] ) : array() );
$capsf_x_share    = rawurlencode( $capsf_card['permalink'] );
$capsf_x_gallery  = 'capsf-x-' . sanitize_html_class( (string) ( $item['video_id'] ?? '' ) );
$capsf_x_verified = '<svg class="capsf-x-verified" viewBox="0 0 24 24" role="img" aria-label="' . esc_attr__( 'Verified account', 'captain-social-feed' ) . '" focusable="false"><path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.15-.44.23-.91.23-1.4 0-2.21-1.71-4-3.83-4-.47 0-.92.08-1.34.25C14.77 2.38 13.48 1.5 12 1.5s-2.77.88-3.38 2.19c-.42-.17-.87-.25-1.34-.25-2.12 0-3.83 1.79-3.83 4 0 .49.08.96.23 1.4C2.38 9.55 1.5 10.92 1.5 12.5c0 1.5.79 2.8 1.98 3.52-.04.24-.06.49-.06.73 0 2.21 1.71 4 3.83 4 .47 0 .92-.09 1.34-.25.61 1.31 1.9 2.19 3.38 2.19 1.49 0 2.78-.88 3.38-2.19.42.16.87.25 1.34.25 2.12 0 3.83-1.79 3.83-4 0-.24-.02-.49-.06-.73 1.19-.72 1.98-2.02 1.98-3.52zm-6.13-3.6-5.12 7.13-3.3-3.3 1.06-1.06 2.06 2.06 4.08-5.68z"/></svg>';
?>
<article class="capsf-x-card<?php echo ! empty( $item_class ) ? ' ' . esc_attr( $item_class ) : ''; ?>"<?php echo ! empty( $item_attrs ) ? $item_attrs : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built with esc_attr() in the shortcode. ?>>
	<?php if ( '' !== $capsf_card['reposted_by'] ) : ?>
		<p class="capsf-x-repost">
			<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 3.88l4.43 4.14-1.37 1.46L5.5 7.55V16c0 1.1.9 2 2 2H13v2H7.5c-2.21 0-4-1.79-4-4V7.55L1.44 9.48.07 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.21 0 4 1.79 4 4v8.45l2.06-1.93 1.37 1.46-4.43 4.14-4.43-4.14 1.37-1.46 2.06 1.93V8c0-1.1-.9-2-2-2z"/></svg>
			<?php
			/* translators: %s: name of the account that reposted the post. */
			echo esc_html( sprintf( __( '%s Reposted', 'captain-social-feed' ), $capsf_card['reposted_by'] ) );
			?>
		</p>
	<?php endif; ?>

	<header class="capsf-x-head">
		<?php if ( '' !== $capsf_card['avatar'] ) : ?>
			<img class="capsf-x-avatar" src="<?php echo esc_url( $capsf_card['avatar'] ); ?>" alt="" width="40" height="40" loading="lazy" referrerpolicy="no-referrer">
		<?php else : ?>
			<span class="capsf-x-avatar capsf-x-avatar--initial" aria-hidden="true"><?php echo esc_html( $capsf_card['initial'] ); ?></span>
		<?php endif; ?>
		<div class="capsf-x-names">
			<span class="capsf-x-name" dir="auto"><?php echo esc_html( $capsf_card['author'] ); ?><?php echo $capsf_card['verified'] ? $capsf_x_verified : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
			<span class="capsf-x-meta">
				<?php if ( '' !== $capsf_card['username'] ) : ?>
					<span class="capsf-x-handle">@<?php echo esc_html( $capsf_card['username'] ); ?></span>
				<?php endif; ?>
				<?php if ( '' !== $capsf_card['time_ago'] ) : ?>
					<span class="capsf-x-time"><?php echo esc_html( $capsf_card['time_ago'] ); ?></span>
				<?php endif; ?>
			</span>
		</div>
		<a class="capsf-x-logo" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'View on X', 'captain-social-feed' ); ?>">
			<span class="capsf-platform-icon capsf-platform-icon--twitter" aria-hidden="true"></span>
		</a>
	</header>

	<?php if ( ! empty( $capsf_card['stars'] ) ) : ?>
		<div class="capsf-x-stars" role="img" aria-label="<?php esc_attr_e( '5 out of 5 stars', 'captain-social-feed' ); ?>">
			<?php for ( $capsf_i = 0; $capsf_i < 5; $capsf_i++ ) : ?>
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z"/></svg>
			<?php endfor; ?>
		</div>
	<?php endif; ?>

	<?php if ( '' !== $capsf_card['caption'] ) : ?>
		<p class="capsf-x-text" dir="auto"><?php echo Capsf_Shortcode::x_linkify( $capsf_card['caption'] ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in x_linkify(). ?></p>
	<?php endif; ?>

	<?php if ( $capsf_card['is_video'] && '' !== $capsf_card['image'] ) : ?>
		<a class="capsf-x-media capsf-x-media--video<?php echo ! empty( $link_class ) ? ' ' . esc_attr( $link_class ) : ''; ?>" href="<?php echo esc_url( $capsf_x_popup && ! empty( $lightbox_href ) ? $lightbox_href : $video_link ); ?>" target="<?php echo esc_attr( $capsf_x_target ); ?>"<?php echo $capsf_x_rel; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static. ?> aria-label="<?php esc_attr_e( 'Play video', 'captain-social-feed' ); ?>"<?php echo ! empty( $glightbox_attr ) ? ' ' . $glightbox_attr : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts in get_play_attrs(). ?>>
			<img src="<?php echo esc_url( $capsf_card['image'] ); ?>" alt="" loading="lazy" width="600" height="338">
			<span class="capsf-x-play"><?php echo Capsf_Shortcode::play_icons( 'capsf-x' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG. ?></span>
		</a>
	<?php elseif ( $capsf_x_images ) : ?>
		<div class="capsf-x-media capsf-x-media--<?php echo absint( count( $capsf_x_images ) ); ?>">
			<?php foreach ( $capsf_x_images as $capsf_x_img ) : ?>
				<?php if ( $capsf_x_popup ) : ?>
					<a class="capsf-glightbox" href="<?php echo esc_url( $capsf_x_img ); ?>" data-gallery="<?php echo esc_attr( $capsf_x_gallery ); ?>" data-glightbox="type: image" aria-label="<?php esc_attr_e( 'Open photo', 'captain-social-feed' ); ?>">
				<?php else : ?>
					<a href="<?php echo esc_url( $video_link ); ?>" target="_blank" rel="noopener noreferrer" aria-label="<?php esc_attr_e( 'Open post', 'captain-social-feed' ); ?>">
				<?php endif; ?>
					<img src="<?php echo esc_url( $capsf_x_img ); ?>" alt="" loading="lazy" width="600" height="600">
				</a>
			<?php endforeach; ?>
		</div>
	<?php endif; ?>

	<?php if ( ! empty( $capsf_card['show_stats'] ) ) : ?>
		<footer class="capsf-x-actions">
			<?php if ( empty( $capsf_card['no_metrics'] ) ) : ?>
			<a class="capsf-x-action" href="<?php echo esc_url( $capsf_card['permalink'] ); ?>" target="_blank" rel="noopener noreferrer">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M1.75 10c0-4.42 3.58-8 8-8h4.37c4.48 0 8.13 3.64 8.13 8.13 0 2.95-1.6 5.66-4.19 7.09l-8.06 4.46v-3.69h-.07c-4.49.1-8.18-3.51-8.18-8zm8-6c-3.32 0-6 2.69-6 6 0 3.37 2.77 6.08 6.14 6l.35-.01h1.76v2.3l5.09-2.81c1.95-1.08 3.16-3.12 3.16-5.34 0-3.38-2.74-6.13-6.13-6.13H9.75z"/></svg>
				<span><?php echo esc_html( $capsf_card['replies'] ); ?></span>
				<span class="screen-reader-text"><?php esc_html_e( 'replies', 'captain-social-feed' ); ?></span>
			</a>
			<a class="capsf-x-action" href="<?php echo esc_url( 'https://x.com/intent/retweet?tweet_id=' . rawurlencode( (string) ( $item['video_id'] ?? '' ) ) ); ?>" target="_blank" rel="noopener noreferrer">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 3.88l4.43 4.14-1.37 1.46L5.5 7.55V16c0 1.1.9 2 2 2H13v2H7.5c-2.21 0-4-1.79-4-4V7.55L1.44 9.48.07 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.21 0 4 1.79 4 4v8.45l2.06-1.93 1.37 1.46-4.43 4.14-4.43-4.14 1.37-1.46 2.06 1.93V8c0-1.1-.9-2-2-2z"/></svg>
				<span><?php echo esc_html( $capsf_card['shares'] ); ?></span>
				<span class="screen-reader-text"><?php esc_html_e( 'reposts', 'captain-social-feed' ); ?></span>
			</a>
			<a class="capsf-x-action" href="<?php echo esc_url( 'https://x.com/intent/like?tweet_id=' . rawurlencode( (string) ( $item['video_id'] ?? '' ) ) ); ?>" target="_blank" rel="noopener noreferrer">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M16.7 3.5c-1.9 0-3.5 1-4.7 2.6C10.8 4.5 9.2 3.5 7.3 3.5 4.1 3.5 1.75 6.1 1.75 9.3c0 5.9 8.2 10.6 9.8 11.4.3.1.6.1.9 0 1.6-.8 9.8-5.5 9.8-11.4 0-3.2-2.3-5.8-5.55-5.8zm-4.7 15.1C9.1 17 3.75 13.3 3.75 9.3c0-2.1 1.5-3.8 3.55-3.8 1.6 0 2.9 1 3.5 2.6l1.2.1 1.2-.1c.6-1.6 1.9-2.6 3.5-2.6 2 0 3.55 1.7 3.55 3.8 0 4-5.35 7.7-8.25 9.3z"/></svg>
				<span><?php echo esc_html( $capsf_card['likes'] ); ?></span>
				<span class="screen-reader-text"><?php esc_html_e( 'likes', 'captain-social-feed' ); ?></span>
			</a>
			<?php endif; ?>
			<details class="capsf-x-share">
				<summary>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41L7.71 9.71 6.29 8.29 12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"/></svg>
					<?php esc_html_e( 'Share', 'captain-social-feed' ); ?>
				</summary>
				<div class="capsf-x-share-menu">
					<a href="<?php echo esc_url( 'https://www.facebook.com/sharer/sharer.php?u=' . $capsf_x_share ); ?>" target="_blank" rel="noopener noreferrer">
						<span class="capsf-platform-icon capsf-platform-icon--facebook" aria-hidden="true"></span>
						<?php esc_html_e( 'Share on Facebook', 'captain-social-feed' ); ?>
					</a>
					<a href="<?php echo esc_url( 'https://x.com/intent/post?url=' . $capsf_x_share ); ?>" target="_blank" rel="noopener noreferrer">
						<span class="capsf-platform-icon capsf-platform-icon--twitter" aria-hidden="true"></span>
						<?php esc_html_e( 'Share on X', 'captain-social-feed' ); ?>
					</a>
				</div>
			</details>
		</footer>
	<?php endif; ?>
</article>
