<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Reads the `capsf_global_settings` option (same key used by the plugin)
 * and runs cleanup only when the user has opted in via `clear_on_uninstall`.
 * On multisite the check and the cleanup run once per site.
 *
 * @since      1.0.0
 * @package captain-social-feed
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Clean up a single site (the one currently switched to).
 *
 * @return void
 */
function capsf_uninstall_current_site() {
	global $wpdb;

	$settings           = get_option( 'capsf_global_settings', array() );
	$clear_on_uninstall = ! empty( $settings['clear_on_uninstall'] ) && '1' === (string) $settings['clear_on_uninstall'];
	$preserve_settings  = ! empty( $settings['preserve_settings'] ) && '1' === (string) $settings['preserve_settings'];

	// Scheduled token-refresh job is always removed.
	wp_clear_scheduled_hook( 'capsf_refresh_tokens' );

	// If preserve is on, never delete anything even if clear is on.
	if ( $preserve_settings || ! $clear_on_uninstall ) {
		return;
	}

	// 1. Drop the custom feeds table.
	$table_name = $wpdb->prefix . 'capsf_feeds';
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" );

	// 1b. Drop the feed cache table.
	$cache_table = $wpdb->prefix . 'capsf_cache';
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	$wpdb->query( "DROP TABLE IF EXISTS {$cache_table}" );

	// 2. Delete all plugin transients (feed caches + rate-limit counters).
	$like_prefixes = array(
		$wpdb->esc_like( '_transient_capsf_' ) . '%',
		$wpdb->esc_like( '_transient_timeout_capsf_' ) . '%',
	);
	foreach ( $like_prefixes as $prefix ) {
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery
		$rows = $wpdb->get_col( $wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $prefix ) );
		foreach ( $rows as $row ) {
			$name = str_replace( array( '_transient_timeout_', '_transient_' ), '', $row );
			delete_transient( $name );
		}
	}

	// 3. Delete all plugin options.
	foreach ( array( 'capsf_global_settings', 'capsf_version', 'capsf_db_version', 'capsf_cache_keys', 'capsf_token_state' ) as $option ) {
		delete_option( $option );
	}

	// 4. Remove all preview post type entries.
	$preview_posts = get_posts(
		array(
			'post_type'      => 'capsf_preview_feed',
			'posts_per_page' => -1,
			'post_status'    => 'any',
			'fields'         => 'ids',
		)
	);
	foreach ( $preview_posts as $preview_post_id ) {
		wp_delete_post( $preview_post_id, true );
	}
}

if ( is_multisite() ) {
	foreach ( get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	) as $capsf_site_id ) {
		switch_to_blog( $capsf_site_id );
		capsf_uninstall_current_site();
		restore_current_blog();
	}
} else {
	capsf_uninstall_current_site();
}
