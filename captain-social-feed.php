<?php
/**
 * Plugin Name:       Captain Social Feed
 * Description:       Display customizable Instagram, Facebook, Twitter, Threads and Pinterest feeds on your WordPress website.
 * Version:           0.3.1
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            devangvachheta
 * Author URI:        https://profiles.wordpress.org/devangvachheta/
 * Text Domain:       captain-social-feed
 * Domain Path:       /languages
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package captain-social-feed
 */

/**
 * Exit if accessed directly.
 * */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'CAPSF_VERSION', '0.3.1' );
define( 'CAPSF_DB_VERSION', '2' );
define( 'CAPSF_FILE', __FILE__ );
define( 'CAPSF_URL', plugins_url( '/', __FILE__ ) );
define( 'CAPSF_PATH', plugin_dir_path( __FILE__ ) );

require_once CAPSF_PATH . 'includes/class-capsf-plugin-load.php';
