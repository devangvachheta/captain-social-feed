<?php
/**
 * Template: Style 6 - Playlist Layout
 * First video = large player left, rest = list on right.
 * This file renders ONE item at a time from the loop.
 * The shortcode wraps items in capsf-s6-wrapper.
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Style-6 playlist is always inline, in the main player - independent of the
// generic Video Play Mode setting. Do NOT mix in $link_class/$glightbox_attr
// here, or list items would also match the generic lightbox/inline-play
// handlers and double-trigger (small thumbnail AND big player at once).
$capsf_s6_href = $video_link;
// Empty for photos / posts without a playable video - those open the original post.
$capsf_s6_embed_src = isset( $capsf_s6_embed_src ) ? $capsf_s6_embed_src : ( isset( $s6_embed_src ) ? $s6_embed_src : '' );

if ( isset( $capsf_s6_index ) && 0 === $capsf_s6_index ) : ?>
	<!-- First video: large featured player -->
	<div class="capsf-s6-featured">
		<a href="<?php echo esc_url( $capsf_s6_href ); ?>"
			class="<?php echo esc_attr( 'capsf-s6-featured-thumb' . ( '' !== $capsf_s6_embed_src ? ' capsf-inline-play' : '' ) ); ?>"
			target="_blank" rel="noopener noreferrer"
			<?php if ( '' !== $capsf_s6_embed_src ) : ?>
				data-inline-src="<?php echo esc_url( $capsf_s6_embed_src ); ?>"
			<?php endif; ?>
			aria-label="<?php echo esc_attr( $title ); ?>">
			<img src="<?php echo esc_url( $high ); ?>"
				loading="eager" width="640" height="360"
				alt="<?php echo esc_attr( $title ); ?>">
			<?php if ( $capsf_card['is_video'] ) : ?>
				<div class="capsf-s6-featured-play"><?php echo wp_kses( Capsf_Shortcode::play_icons( 'capsf-s6-featured' ), Capsf_Shortcode::allowed_svg_tags() ); ?></div>
			<?php endif; ?>

			<?php if ( ! empty( $duration_label ) ) : ?>
				<span class="capsf-s6-duration"><?php echo esc_html( $duration_label ); ?></span>
			<?php endif; ?>
		</a>
		<div class="capsf-s6-featured-info">
			<h2 class="capsf-s6-featured-title" dir="auto"><?php echo esc_html( $title ); ?></h2>

			<?php if ( ! empty( $views_label ) || ! empty( $time_ago_label ) ) : ?>
				<p class="capsf-s6-stats">
					<?php
					$capsf_s6_stats = array();
					if ( ! empty( $views_label ) ) {
						/* translators: %s: formatted like count, e.g. "186" */
						$capsf_s6_stats[] = sprintf( esc_html__( '%s Likes', 'captain-social-feed' ), esc_html( $views_label ) );
					}
					if ( ! empty( $time_ago_label ) ) {
						$capsf_s6_stats[] = esc_html( $time_ago_label );
					}
					echo esc_html( implode( ' • ', $capsf_s6_stats ) );
					?>
				</p>
			<?php endif; ?>
			<div class="capsf-s6-featured-channel">
				<?php echo wp_kses( Capsf_Shortcode::avatar_or_icon( $capsf_card, 20 ), Capsf_Shortcode::allowed_svg_tags() ); ?>
				<?php echo esc_html( $channel ); ?><?php echo wp_kses( Capsf_Shortcode::trailing_platform_icon( $capsf_card ), Capsf_Shortcode::allowed_svg_tags() ); ?>
			</div>
		</div>
	</div>
	<!-- Playlist list starts -->
	<div class="capsf-s6-list-col">
		<div class="capsf-s6-list" data-capsf-grid>

<?php else : ?>
	<!-- List item -->
	<a href="<?php echo esc_url( $capsf_s6_href ); ?>"
		class="capsf-s6-item capsf-s6-playlist-item"
		target="_blank" rel="noopener noreferrer"
		data-embed="<?php echo esc_url( $capsf_s6_embed_src ); ?>">
		<span class="capsf-s6-idx">
			<span class="capsf-s6-idx-num"><?php echo isset( $capsf_s6_index ) ? absint( $capsf_s6_index ) : ''; ?></span>
			<svg class="capsf-s6-idx-play" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
				<path d="M8 5v14l11-7z"/>
			</svg>
		</span>
		<div class="capsf-s6-thumb">
			<img src="<?php echo esc_url( $medium ); ?>"
				loading="lazy" width="160" height="90"
				alt="<?php echo esc_attr( $title ); ?>">
			<div class="capsf-s6-list-play">
				<svg class="capsf-s6-list-icon-play" viewBox="0 0 24 24" fill="white" width="18" height="18">
					<polygon points="5,3 19,12 5,21"/>
				</svg>
				<svg class="capsf-s6-list-icon-pause" viewBox="0 0 24 24" fill="white" width="18" height="18">
					<rect x="5" y="3" width="5" height="18"/>
					<rect x="14" y="3" width="5" height="18"/>
				</svg>
			</div>

			<?php if ( ! empty( $duration_label ) ) : ?>
				<span class="capsf-s6-list-duration"><?php echo esc_html( $duration_label ); ?></span>
			<?php endif; ?>
		</div>
		<div class="capsf-s6-info">
			<p class="capsf-s6-title" dir="auto"><?php echo esc_html( $title ); ?></p>
			<span class="capsf-s6-ch"><?php echo esc_html( $channel ); ?></span>

			<?php if ( ! empty( $views_label ) || ! empty( $time_ago_label ) ) : ?>
				<span class="capsf-s6-list-stats">
					<?php
					$capsf_s6_list_stats = array();
					if ( ! empty( $views_label ) ) {
						/* translators: %s: formatted like count, e.g. "186" */
						$capsf_s6_list_stats[] = sprintf( esc_html__( '%s Likes', 'captain-social-feed' ), esc_html( $views_label ) );
					}
					if ( ! empty( $time_ago_label ) ) {
						$capsf_s6_list_stats[] = esc_html( $time_ago_label );
					}
					echo esc_html( implode( ' • ', $capsf_s6_list_stats ) );
					?>
				</span>
			<?php endif; ?>
		</div>
	</a>
<?php endif; ?>
