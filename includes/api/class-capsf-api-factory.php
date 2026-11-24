<?php
/**
 * Captain Social Feed - API Factory
 *
 * Returns the correct platform API class instance for a given platform key.
 * This is the single place the rest of the plugin goes through to talk to
 * a platform - nothing else should instantiate a `Capsf_Api_*` class directly.
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Factory' ) ) {

	/**
	 * Platform API factory.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Factory {

		/**
		 * Supported platform keys mapped to their API class name.
		 *
		 * @var array
		 */
		private static $map = array(
			'instagram' => 'Capsf_Api_Instagram',
			'facebook'  => 'Capsf_Api_Facebook',
			'twitter'   => 'Capsf_Api_Twitter',
			'threads'   => 'Capsf_Api_Threads',
			'pinterest' => 'Capsf_Api_Pinterest',
		);

		/**
		 * Get the list of supported platform keys.
		 *
		 * @return array
		 */
		public static function get_platforms() {
			return array_keys( self::$map );
		}

		/**
		 * Human-readable platform name, e.g. "Facebook".
		 *
		 * @param string $platform Platform key.
		 * @return string
		 */
		public static function get_label( $platform ) {
			$labels   = array(
				'instagram' => __( 'Instagram', 'captain-social-feed' ),
				'facebook'  => __( 'Facebook', 'captain-social-feed' ),
				'twitter'   => __( 'X (Twitter)', 'captain-social-feed' ),
				'threads'   => __( 'Threads', 'captain-social-feed' ),
				'pinterest' => __( 'Pinterest', 'captain-social-feed' ),
			);
			$platform = sanitize_key( $platform );
			return isset( $labels[ $platform ] ) ? $labels[ $platform ] : '';
		}

		/**
		 * Get an API class instance for the given platform key.
		 *
		 * @param string $platform One of: instagram, facebook, twitter, threads, pinterest.
		 * @return Capsf_Api_Base|null
		 */
		public static function get( $platform ) {
			$platform = sanitize_key( $platform );

			if ( ! isset( self::$map[ $platform ] ) ) {
				return null;
			}

			$class = self::$map[ $platform ];

			if ( ! class_exists( $class ) ) {
				return null;
			}

			return new $class();
		}
	}
}
