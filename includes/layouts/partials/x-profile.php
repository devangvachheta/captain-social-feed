<?php
/**
 * Partial: X profile header (Profile Timeline / Sidebar Widget) - banner,
 * picture, name, verified badge, @handle, Follow on X, post / following /
 * follower counts.
 *
 * Expects $capsf_profile (see Capsf_Api_Twitter::normalize_profile()).
 *
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$capsf_follow_url = 'https://x.com/intent/follow?screen_name=' . rawurlencode( $capsf_profile['username'] );
$capsf_stats      = array(
	array( __( 'Posts', 'captain-social-feed' ), $capsf_profile['posts'] ),
	array( __( 'Following', 'captain-social-feed' ), $capsf_profile['following'] ),
	array( __( 'Followers', 'captain-social-feed' ), $capsf_profile['followers'] ),
);
?>
<header class="capsf-x-profile">
	<div class="capsf-x-banner"<?php if ( ! empty( $capsf_profile['banner'] ) ) : ?> style="background-image:url(<?php echo esc_url( $capsf_profile['banner'] ); ?>)"<?php endif; ?>></div>
	<div class="capsf-x-profile-row">
		<?php if ( ! empty( $capsf_profile['avatar'] ) ) : ?>
			<img class="capsf-x-profile-avatar" src="<?php echo esc_url( $capsf_profile['avatar'] ); ?>" alt="" width="80" height="80" loading="lazy" referrerpolicy="no-referrer">
		<?php endif; ?>
		<div class="capsf-x-profile-names">
			<span class="capsf-x-profile-name" dir="auto">
				<?php echo esc_html( $capsf_profile['name'] ); ?>
				<?php if ( ! empty( $capsf_profile['verified'] ) ) : ?>
					<svg class="capsf-x-verified" viewBox="0 0 24 24" role="img" aria-label="<?php esc_attr_e( 'Verified account', 'captain-social-feed' ); ?>" focusable="false"><path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.15-.44.23-.91.23-1.4 0-2.21-1.71-4-3.83-4-.47 0-.92.08-1.34.25C14.77 2.38 13.48 1.5 12 1.5s-2.77.88-3.38 2.19c-.42-.17-.87-.25-1.34-.25-2.12 0-3.83 1.79-3.83 4 0 .49.08.96.23 1.4C2.38 9.55 1.5 10.92 1.5 12.5c0 1.5.79 2.8 1.98 3.52-.04.24-.06.49-.06.73 0 2.21 1.71 4 3.83 4 .47 0 .92-.09 1.34-.25.61 1.31 1.9 2.19 3.38 2.19 1.49 0 2.78-.88 3.38-2.19.42.16.87.25 1.34.25 2.12 0 3.83-1.79 3.83-4 0-.24-.02-.49-.06-.73 1.19-.72 1.98-2.02 1.98-3.52zm-6.13-3.6-5.12 7.13-3.3-3.3 1.06-1.06 2.06 2.06 4.08-5.68z"/></svg>
				<?php endif; ?>
			</span>
			<span class="capsf-x-profile-handle">@<?php echo esc_html( $capsf_profile['username'] ); ?></span>
		</div>
		<a class="capsf-x-follow" href="<?php echo esc_url( $capsf_follow_url ); ?>" target="_blank" rel="noopener noreferrer">
			<span class="capsf-platform-icon capsf-platform-icon--twitter" aria-hidden="true"></span>
			<?php esc_html_e( 'Follow', 'captain-social-feed' ); ?>
		</a>
	</div>
	<dl class="capsf-x-profile-stats">
		<?php foreach ( $capsf_stats as $capsf_stat ) : ?>
			<div>
				<dt><?php echo esc_html( $capsf_stat[0] ); ?></dt>
				<dd><?php echo esc_html( $this->capsf_format_count( $capsf_stat[1] ) ); ?></dd>
			</div>
		<?php endforeach; ?>
	</dl>
</header>
