<?php
/**
 * Keeps Instagram / Threads long-lived access tokens alive.
 *
 * Both platforms issue tokens that expire after ~60 days unless they are
 * refreshed. A daily job refreshes any token that has not been refreshed in
 * the last 20 days, stores the result, and raises an admin notice if a
 * refresh fails so the site owner can reconnect before the feed goes blank.
 *
 * @since   0.0.4
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Token_Refresh' ) ) {

	/**
	 * Scheduled access-token refresh.
	 */
	class Capsf_Token_Refresh {

		const HOOK     = 'capsf_refresh_tokens';
		const OPTION   = 'capsf_token_state';
		const INTERVAL = 20 * DAY_IN_SECONDS;

		/**
		 * Register hooks and make sure the job is scheduled.
		 *
		 * @return void
		 */
		public static function init() {
			add_action( self::HOOK, array( __CLASS__, 'run' ) );
			add_action( 'admin_notices', array( __CLASS__, 'maybe_notice' ) );

			if ( ! wp_next_scheduled( self::HOOK ) ) {
				wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::HOOK );
			}
		}

		/**
		 * Refresh every Instagram/Threads token that is due.
		 *
		 * @return void
		 */
		public static function run() {
			global $wpdb;

			$table = $wpdb->prefix . 'capsf_feeds';
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$rows  = $wpdb->get_results( "SELECT id, feed_name, feed_type, settings FROM `{$table}`", ARRAY_A );
			$state = get_option( self::OPTION, array() );
			$state = is_array( $state ) ? $state : array();

			foreach ( (array) $rows as $row ) {
				$settings = json_decode( $row['settings'], true );
				if ( ! is_array( $settings ) || empty( $settings['access_token'] ) ) {
					continue;
				}

				$platform = ! empty( $settings['platform'] ) ? sanitize_key( $settings['platform'] ) : sanitize_key( $row['feed_type'] );
				if ( ! in_array( $platform, array( 'instagram', 'threads' ), true ) ) {
					continue;
				}

				$id = (int) $row['id'];
				if ( ! empty( $state[ $id ]['refreshed'] ) && ( time() - (int) $state[ $id ]['refreshed'] ) < self::INTERVAL ) {
					continue;
				}

				$result = self::refresh( $platform, (string) $settings['access_token'] );

				if ( ! empty( $result['skip'] ) ) {
					continue; // Too new to refresh yet - try again tomorrow, no alarm.
				}

				if ( ! empty( $result['token'] ) ) {
					if ( $result['token'] !== $settings['access_token'] ) {
						$settings['access_token'] = $result['token'];
						// phpcs:ignore WordPress.DB.DirectDatabaseQuery
						$wpdb->update( $table, array( 'settings' => wp_json_encode( $settings ) ), array( 'id' => $id ), array( '%s' ), array( '%d' ) );
					}
					$state[ $id ] = array(
						'ok'        => true,
						'refreshed' => time(),
						'name'      => (string) $row['feed_name'],
					);
				} else {
					$state[ $id ] = array(
						'ok'        => false,
						'refreshed' => isset( $state[ $id ]['refreshed'] ) ? (int) $state[ $id ]['refreshed'] : 0,
						'failed_at' => time(),
						'name'      => (string) $row['feed_name'],
					);
				}
			}

			// Forget feeds that no longer exist.
			$existing = array_map( 'intval', wp_list_pluck( (array) $rows, 'id' ) );
			$state    = array_intersect_key( $state, array_flip( $existing ) );

			update_option( self::OPTION, $state, false );
		}

		/**
		 * Call the platform's refresh endpoint.
		 *
		 * @param string $platform 'instagram' | 'threads'.
		 * @param string $token    Current long-lived token.
		 * @return array { token?: string, skip?: bool }
		 */
		private static function refresh( $platform, $token ) {
			$endpoint = 'instagram' === $platform
				? 'https://graph.instagram.com/refresh_access_token'
				: 'https://graph.threads.net/refresh_access_token';
			$grant    = 'instagram' === $platform ? 'ig_refresh_token' : 'th_refresh_token';

			$response = wp_remote_get(
				add_query_arg(
					array(
						'grant_type'   => $grant,
						'access_token' => rawurlencode( $token ),
					),
					$endpoint
				),
				array( 'timeout' => 10 )
			);
			if ( is_wp_error( $response ) ) {
				return array();
			}

			$data = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( is_array( $data ) && ! empty( $data['access_token'] ) && is_string( $data['access_token'] ) ) {
				return array( 'token' => Capsf_Api_Base::sanitize_token( $data['access_token'] ) );
			}

			$message = is_array( $data ) && ! empty( $data['error']['message'] ) ? (string) $data['error']['message'] : '';
			if ( $message && preg_match( '/24 hours|too (new|young)|at least/i', $message ) ) {
				return array( 'skip' => true );
			}

			return array();
		}

		/**
		 * Tell admins when a token could not be refreshed.
		 *
		 * @return void
		 */
		public static function maybe_notice() {
			if ( ! current_user_can( 'manage_options' ) ) {
				return;
			}
			$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
			if ( ! $screen || false === strpos( (string) $screen->id, 'captain-social-feed' ) ) {
				return;
			}
			$state  = get_option( self::OPTION, array() );
			$failed = array();
			foreach ( (array) $state as $entry ) {
				if ( isset( $entry['ok'] ) && false === $entry['ok'] ) {
					$failed[] = ! empty( $entry['name'] ) ? $entry['name'] : '#';
				}
			}
			if ( empty( $failed ) ) {
				return;
			}
			?>
			<div class="notice notice-warning">
				<p>
					<strong><?php esc_html_e( 'Captain Social Feed:', 'captain-social-feed' ); ?></strong>
					<?php esc_html_e( 'the access token could not be refreshed automatically for:', 'captain-social-feed' ); ?>
					<?php echo esc_html( implode( ', ', $failed ) . '. ' ); ?>
					<?php esc_html_e( 'Please generate a new token and reconnect the feed before it expires.', 'captain-social-feed' ); ?>
				</p>
			</div>
			<?php
		}
	}
}
