<?php
/**
 * Captain Social Feed - Twitter / X API
 *
 * Uses Twitter/X API v2 (App-only Bearer Token). "What to show" (x_source):
 *  - profile_timeline / tweets_grid / sidebar: an account's posts (+ profile)
 *  - hashtag:      recent search (#hashtag or search words, last 7 days)
 *  - testimonials: hand-picked posts, pasted as links or IDs
 *
 * @since   0.0.1
 * @package captain-social-feed
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Capsf_Api_Twitter' ) ) {

	/**
	 * Twitter / X API v2 client.
	 *
	 * @since 0.0.1
	 */
	class Capsf_Api_Twitter extends Capsf_Api_Base {

		/**
		 * API base URL.
		 *
		 * @var string
		 */
		private $base = 'https://api.x.com/2/';

		/**
		 * Platform key.
		 *
		 * @var string
		 */
		protected $platform = 'twitter';

		/**
		 * Allowed "What to show" values (Step 1).
		 *
		 * @var string[]
		 */
		const SOURCES = array( 'profile_timeline', 'tweets_grid', 'hashtag', 'testimonials', 'sidebar' );

		/**
		 * Sources that read one account's own posts.
		 *
		 * @var string[]
		 */
		const ACCOUNT_SOURCES = array( 'profile_timeline', 'tweets_grid', 'sidebar' );

		/**
		 * Fields requested for every post (author, reposted original, media).
		 *
		 * @var string
		 */
		const POST_QUERY = '&tweet.fields=created_at,public_metrics,attachments,author_id,referenced_tweets'
			. '&expansions=attachments.media_keys,author_id,referenced_tweets.id,referenced_tweets.id.author_id,referenced_tweets.id.attachments.media_keys'
			. '&media.fields=url,preview_image_url,type,variants'
			. '&user.fields=name,username,profile_image_url,verified,verified_type';

		/**
		 * The feed's "What to show" value.
		 *
		 * @param array $settings Feed settings.
		 * @return string
		 */
		public static function get_source( $settings ) {
			$source = isset( $settings['x_source'] ) ? sanitize_key( $settings['x_source'] ) : '';
			return in_array( $source, self::SOURCES, true ) ? $source : 'profile_timeline';
		}

		/**
		 * Post IDs from the Testimonials box - links (x.com / twitter.com
		 * /status/123) or bare IDs, one per line or comma separated.
		 *
		 * @param string $raw Pasted text.
		 * @return string[]
		 */
		public static function parse_tweet_ids( $raw ) {
			$ids = array();
			foreach ( preg_split( '/[\s,]+/', (string) $raw ) as $part ) {
				if ( preg_match( '#/status(?:es)?/(\d{1,25})#', $part, $m ) || preg_match( '/^(\d{5,25})$/', $part, $m ) ) {
					$ids[] = $m[1];
				}
			}
			return array_slice( array_values( array_unique( $ids ) ), 0, 100 );
		}

		/**
		 * Search query for the Hashtag source. A single word becomes a #hashtag;
		 * anything else (several words, from:, @, quotes) is used as typed.
		 *
		 * @param array $settings Feed settings.
		 * @return string
		 */
		private function search_query( $settings ) {
			$query = trim( (string) ( $settings['x_query'] ?? '' ) );
			if ( '' === $query ) {
				return '';
			}
			if ( preg_match( '/^\w+$/u', $query ) ) {
				$query = '#' . $query;
			}
			if ( empty( $settings['x_show_reposts'] ) ) {
				$query .= ' -is:retweet';
			}
			if ( empty( $settings['x_show_replies'] ) ) {
				$query .= ' -is:reply';
			}
			return $query;
		}

		/**
		 * Look up an account from its @handle (with profile details).
		 *
		 * @param string $username Handle without the leading @.
		 * @param string $token    Bearer token.
		 * @return array|WP_Error
		 */
		private function get_user( $username, $token ) {
			$url = $this->base . 'users/by/username/' . rawurlencode( $username ) . '?user.fields=name,username,profile_image_url,profile_banner_url,verified,verified_type,public_metrics,description';
			return $this->explain_error( $this->remote_get_json( $url, array( 'Authorization' => 'Bearer ' . $token ) ) );
		}

		/**
		 * Turn X's terse errors into a message that says what to do.
		 *
		 * @param array|WP_Error $result API result.
		 * @return array|WP_Error
		 */
		private function explain_error( $result ) {
			if ( ! is_wp_error( $result ) ) {
				return $result;
			}
			$meta   = $result->get_error_data();
			$status = is_array( $meta ) ? (int) ( $meta['status'] ?? 0 ) : 0;
			if ( 401 === $status ) {
				return new WP_Error( 'capsf_api_error', __( 'X rejected the Bearer Token (401 Unauthorized). In the X Developer Portal open your App → Keys and Tokens, click Regenerate next to Bearer Token, copy the whole token and paste it here.', 'captain-social-feed' ), $meta );
			}
			if ( in_array( $status, array( 402, 403 ), true ) ) {
				/* translators: %s: error message returned by X. */
				return new WP_Error( 'capsf_api_error', sprintf( __( 'X did not allow reading posts with this App (%s). Reading posts needs X API access that includes post reads - check your plan / credits in the X Developer Portal.', 'captain-social-feed' ), $result->get_error_message() ), $meta );
			}
			if ( 429 === $status ) {
				return new WP_Error( 'capsf_api_error', __( 'X rate limit reached for this App. The feed will try again later.', 'captain-social-feed' ), $meta );
			}
			return $result;
		}

		/**
		 * GET a v2 endpoint with the feed's token.
		 *
		 * @param string $path  Path + query after /2/.
		 * @param string $token Bearer token.
		 * @return array|WP_Error
		 */
		private function get( $path, $token ) {
			return $this->explain_error( $this->remote_get_json( $this->base . $path, array( 'Authorization' => 'Bearer ' . $token ) ) );
		}

		/**
		 * Test the stored credentials against the live API.
		 *
		 * @param array $settings Feed connection settings.
		 * @return array { success: bool, message: string }
		 */
		public function test_connection( $settings ) {
			$token  = ! empty( $settings['bearer_token'] ) ? self::sanitize_token( $settings['bearer_token'] ) : '';
			$source = self::get_source( $settings );

			if ( empty( $token ) && 'testimonials' !== $source ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Please enter the Bearer Token.', 'captain-social-feed' ),
				);
			}

			if ( 'hashtag' === $source ) {
				$query = $this->search_query( $settings );
				if ( '' === $query ) {
					return array(
						'success' => false,
						'message' => esc_html__( 'Please enter a #hashtag or search words.', 'captain-social-feed' ),
					);
				}
				$data = $this->get( 'tweets/search/recent?max_results=10&query=' . rawurlencode( $query ), $token );
				if ( is_wp_error( $data ) ) {
					return array(
						'success' => false,
						'message' => $data->get_error_message(),
					);
				}
				return array(
					'success' => true,
					/* translators: %d: number of posts found. */
					'message' => sprintf( _n( 'Connected - found %d recent post.', 'Connected - found %d recent posts.', count( $data['data'] ?? array() ), 'captain-social-feed' ), count( $data['data'] ?? array() ) ),
				);
			}

			if ( 'testimonials' === $source ) {
				$ids = self::parse_tweet_ids( $settings['x_tweet_ids'] ?? '' );
				if ( empty( $ids ) ) {
					return array(
						'success' => false,
						'message' => esc_html__( 'Please paste at least one post link (https://x.com/name/status/...).', 'captain-social-feed' ),
					);
				}
				$data = $token ? $this->get( 'tweets?ids=' . implode( ',', $ids ), $token ) : new WP_Error( 'capsf_no_token', '' );
				if ( is_wp_error( $data ) ) {
					if ( $this->can_use_oembed( $data ) ) {
						$found = $this->oembed_posts( array_slice( $ids, 0, 1 ) );
						if ( $found ) {
							return array(
								'success' => true,
								'message' => __( 'Connected using X\'s free public embed (no API credits needed). Testimonials show the post text, author and date - photos, profile pictures and like counts need X API credits.', 'captain-social-feed' ),
							);
						}
					}
					return array(
						'success' => false,
						'message' => $data->get_error_message(),
					);
				}
				return array(
					'success' => true,
					/* translators: 1: posts found, 2: links pasted. */
					'message' => sprintf( __( 'Connected - %1$d of %2$d posts found.', 'captain-social-feed' ), count( $data['data'] ?? array() ), count( $ids ) ),
				);
			}

			$username = ! empty( $settings['username'] ) ? sanitize_text_field( ltrim( $settings['username'], '@' ) ) : '';
			if ( empty( $username ) ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Please enter both the Bearer Token and the @Username.', 'captain-social-feed' ),
				);
			}

			$data = $this->get_user( $username, $token );
			if ( is_wp_error( $data ) ) {
				return array(
					'success' => false,
					'message' => $data->get_error_message(),
				);
			}
			if ( empty( $data['data']['id'] ) ) {
				return array(
					'success' => false,
					'message' => esc_html__( 'Could not find that account.', 'captain-social-feed' ),
				);
			}

			return array(
				'success' => true,
				/* translators: %s: Twitter/X handle. */
				'message' => sprintf( __( 'Connected successfully to @%s.', 'captain-social-feed' ), $username ),
			);
		}

		/**
		 * Fetch normalized posts (see Capsf_Api_Base for the shape). Account
		 * sources also return the profile under the "__profile" key (read and
		 * removed by Capsf_Shortcode::get_platform_posts()).
		 *
		 * @param array $settings Feed connection settings.
		 * @param int   $limit    Max number of posts.
		 * @return array|WP_Error
		 */
		public function fetch_posts( $settings, $limit = 12 ) {
			$token  = ! empty( $settings['bearer_token'] ) ? self::sanitize_token( $settings['bearer_token'] ) : '';
			$source = self::get_source( $settings );

			if ( empty( $token ) && 'testimonials' !== $source ) {
				return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Twitter/X Bearer Token is missing.', 'captain-social-feed' ) );
			}

			$profile = array();
			if ( 'hashtag' === $source ) {
				$query = $this->search_query( $settings );
				if ( '' === $query ) {
					return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Twitter/X hashtag or search words are missing.', 'captain-social-feed' ) );
				}
				// Recent search accepts 10-100.
				$data = $this->get( 'tweets/search/recent?max_results=' . max( 10, min( 100, absint( $limit ) ) ) . '&query=' . rawurlencode( $query ) . self::POST_QUERY, $token );
			} elseif ( 'testimonials' === $source ) {
				$ids = self::parse_tweet_ids( $settings['x_tweet_ids'] ?? '' );
				if ( empty( $ids ) ) {
					return new WP_Error( 'capsf_missing_credentials', esc_html__( 'No Twitter/X post links were added to this feed.', 'captain-social-feed' ) );
				}
				$data = $token ? $this->get( 'tweets?ids=' . implode( ',', $ids ) . self::POST_QUERY, $token ) : new WP_Error( 'capsf_no_token', '' );
				if ( is_wp_error( $data ) && $this->can_use_oembed( $data ) ) {
					$posts = $this->oembed_posts( $ids );
					if ( $posts ) {
						return $posts;
					}
				}
			} else {
				$username = ! empty( $settings['username'] ) ? sanitize_text_field( ltrim( $settings['username'], '@' ) ) : '';
				if ( empty( $username ) ) {
					return new WP_Error( 'capsf_missing_credentials', esc_html__( 'Twitter/X Bearer Token or Username is missing.', 'captain-social-feed' ) );
				}
				$user = $this->get_user( $username, $token );
				if ( is_wp_error( $user ) ) {
					return $user;
				}
				if ( empty( $user['data']['id'] ) ) {
					return new WP_Error( 'capsf_user_not_found', esc_html__( 'Could not find that Twitter/X account.', 'captain-social-feed' ) );
				}
				$profile = $this->normalize_profile( $user['data'] );
				if ( '' === $profile['username'] ) {
					$profile['username'] = $username;
				}

				$exclude = array();
				if ( empty( $settings['x_show_reposts'] ) ) {
					$exclude[] = 'retweets';
				}
				if ( empty( $settings['x_show_replies'] ) ) {
					$exclude[] = 'replies';
				}
				// The user timeline accepts 5-100.
				$data = $this->get(
					'users/' . rawurlencode( sanitize_text_field( $user['data']['id'] ) ) . '/tweets?max_results=' . max( 5, min( 100, absint( $limit ) ) )
						. ( $exclude ? '&exclude=' . implode( ',', $exclude ) : '' ) . self::POST_QUERY,
					$token
				);
			}

			if ( is_wp_error( $data ) ) {
				return $data;
			}

			$posts = empty( $data['data'] ) || ! is_array( $data['data'] ) ? array() : $this->normalize_posts( $data, $profile );

			if ( 'testimonials' === $source && $posts ) {
				// Keep the order the posts were pasted in (the API sorts its own way).
				$order = array_flip( self::parse_tweet_ids( $settings['x_tweet_ids'] ?? '' ) );
				usort(
					$posts,
					function ( $a, $b ) use ( $order ) {
						return ( $order[ $a['id'] ] ?? 0 ) <=> ( $order[ $b['id'] ] ?? 0 );
					}
				);
			}

			if ( $profile ) {
				$posts['__profile'] = $profile;
			}
			return $posts;
		}

		/**
		 * Whether a failed API call may fall back to X's free oEmbed: no token,
		 * a rejected token, or an App without read access / credits.
		 *
		 * @param WP_Error $error API error.
		 * @return bool
		 */
		private function can_use_oembed( $error ) {
			if ( 'capsf_no_token' === $error->get_error_code() ) {
				return true;
			}
			$meta = $error->get_error_data();
			return is_array( $meta ) && in_array( (int) ( $meta['status'] ?? 0 ), array( 401, 402, 403 ), true );
		}

		/**
		 * Posts from X's public oEmbed endpoint (publish.twitter.com) - free and
		 * without a token. It returns only the text, author name / handle and
		 * date, so the cards show no photos, profile picture or counts.
		 *
		 * @param string[] $ids Post IDs, in display order.
		 * @return array Normalized posts (empty when none could be read).
		 */
		private function oembed_posts( $ids ) {
			$posts = array();
			foreach ( array_slice( $ids, 0, 20 ) as $id ) {
				$url  = 'https://publish.twitter.com/oembed?omit_script=1&dnt=1&url=' . rawurlencode( 'https://x.com/i/status/' . $id );
				$data = $this->remote_get_json( $url );
				if ( is_wp_error( $data ) || empty( $data['html'] ) ) {
					continue;
				}
				$html = (string) $data['html'];

				$text = '';
				if ( preg_match( '#<p[^>]*>(.*?)</p>#s', $html, $m ) ) {
					$text = html_entity_decode( wp_strip_all_tags( preg_replace( '#<br\s*/?>#i', "\n", $m[1] ) ), ENT_QUOTES, 'UTF-8' );
					// Attached media shows as a trailing "pic.twitter.com/..." link.
					$text = trim( preg_replace( '#\s*pic\.twitter\.com/\w+$#', '', trim( $text ) ) );
				}
				$username = '';
				if ( ! empty( $data['author_url'] ) && preg_match( '#(?:x|twitter)\.com/(\w{1,15})#', $data['author_url'], $m ) ) {
					$username = $m[1];
				}
				$timestamp = 0;
				if ( preg_match( '#<a href="[^"]*/status/\d+[^"]*">([^<]+)</a>\s*</blockquote>#', $html, $m ) ) {
					$timestamp = (int) strtotime( $m[1] );
				}

				$posts[] = $this->finalize_post(
					array(
						'id'              => $id,
						'type'            => 'image',
						'image'           => '',
						'images'          => array(),
						'video_url'       => '',
						'caption'         => $this->clean_caption( $text ),
						'permalink'       => 'https://x.com/' . rawurlencode( $username ? $username : 'i' ) . '/status/' . $id,
						'timestamp'       => $timestamp,
						'like_count'      => 0,
						'comment_count'   => 0,
						'share_count'     => 0,
						'author_name'     => sanitize_text_field( $data['author_name'] ?? $username ),
						'author_username' => sanitize_text_field( $username ),
						'author_verified' => false,
						'author_avatar'   => '',
						'reposted_by'     => '',
						'no_metrics'      => true,
					)
				);
			}
			return $posts;
		}

		/**
		 * Profile header data.
		 *
		 * @param array $user v2 user object.
		 * @return array
		 */
		private function normalize_profile( $user ) {
			$metrics = isset( $user['public_metrics'] ) && is_array( $user['public_metrics'] ) ? $user['public_metrics'] : array();
			return array(
				'name'      => sanitize_text_field( $user['name'] ?? '' ),
				'username'  => sanitize_text_field( $user['username'] ?? '' ),
				// "_normal" is 48px - ask for the 400px picture for the header.
				'avatar'    => ! empty( $user['profile_image_url'] ) ? esc_url_raw( str_replace( '_normal.', '_400x400.', $user['profile_image_url'] ) ) : '',
				'banner'    => ! empty( $user['profile_banner_url'] ) ? esc_url_raw( $user['profile_banner_url'] ) : '',
				'verified'  => $this->is_verified( $user ),
				'posts'     => absint( $metrics['tweet_count'] ?? 0 ),
				'following' => absint( $metrics['following_count'] ?? 0 ),
				'followers' => absint( $metrics['followers_count'] ?? 0 ),
			);
		}

		/**
		 * Whether an account shows the verified badge.
		 *
		 * @param array $user v2 user object.
		 * @return bool
		 */
		private function is_verified( $user ) {
			return ! empty( $user['verified'] ) || in_array( $user['verified_type'] ?? '', array( 'blue', 'business', 'government' ), true );
		}

		/**
		 * Normalize a v2 post list (with its "includes") into our post shape.
		 * A repost shows the ORIGINAL post (full text, media, author) with a
		 * "Reposted" label naming the account that reposted it.
		 *
		 * @param array $data    v2 response.
		 * @param array $profile Profile of the feed's account (may be empty).
		 * @return array
		 */
		private function normalize_posts( $data, $profile ) {
			$includes = isset( $data['includes'] ) && is_array( $data['includes'] ) ? $data['includes'] : array();
			$users    = array();
			$media    = array();
			$tweets   = array();
			foreach ( (array) ( $includes['users'] ?? array() ) as $u ) {
				if ( ! empty( $u['id'] ) ) {
					$users[ $u['id'] ] = $u;
				}
			}
			foreach ( (array) ( $includes['media'] ?? array() ) as $m ) {
				if ( ! empty( $m['media_key'] ) ) {
					$media[ $m['media_key'] ] = $m;
				}
			}
			foreach ( (array) ( $includes['tweets'] ?? array() ) as $t ) {
				if ( ! empty( $t['id'] ) ) {
					$tweets[ $t['id'] ] = $t;
				}
			}

			$posts = array();
			foreach ( $data['data'] as $item ) {
				$reposted_by = '';
				$shown       = $item;
				foreach ( (array) ( $item['referenced_tweets'] ?? array() ) as $ref ) {
					if ( 'retweeted' === ( $ref['type'] ?? '' ) && isset( $tweets[ $ref['id'] ?? '' ] ) ) {
						$poster      = $users[ $item['author_id'] ?? '' ] ?? array();
						$reposted_by = sanitize_text_field( $poster['name'] ?? ( $profile['name'] ?? '' ) );
						$shown       = $tweets[ $ref['id'] ];
						break;
					}
				}
				$posts[] = $this->normalize_post( $shown, $users, $media, $reposted_by, $profile );
			}
			return $posts;
		}

		/**
		 * First non-empty value, as plain text.
		 *
		 * @param string ...$values Candidates.
		 * @return string
		 */
		private function first_filled( ...$values ) {
			foreach ( $values as $value ) {
				if ( '' !== trim( (string) $value ) ) {
					return sanitize_text_field( $value );
				}
			}
			return '';
		}

		/**
		 * One post.
		 *
		 * @param array  $item        v2 post object.
		 * @param array  $users       Included users by ID.
		 * @param array  $media       Included media by key.
		 * @param string $reposted_by Name of the account that reposted it.
		 * @param array  $profile     Profile of the feed's account (may be empty).
		 * @return array
		 */
		private function normalize_post( $item, $users, $media, $reposted_by, $profile ) {
			$author    = $users[ $item['author_id'] ?? '' ] ?? array();
			$username  = sanitize_text_field( $author['username'] ?? ( $profile['username'] ?? '' ) );
			$type      = 'image';
			$images    = array();
			$image     = '';
			$video_url = '';
			$keys      = (array) ( $item['attachments']['media_keys'] ?? array() );

			foreach ( $keys as $key ) {
				if ( ! isset( $media[ $key ] ) ) {
					continue;
				}
				$m = $media[ $key ];
				if ( in_array( $m['type'] ?? '', array( 'video', 'animated_gif' ), true ) ) {
					if ( 'video' !== $type && empty( $images ) ) {
						$type  = 'video';
						$image = ! empty( $m['preview_image_url'] ) ? esc_url_raw( $m['preview_image_url'] ) : '';
						// Videos have no "url" - pick the best direct MP4 from "variants".
						$best_rate = -1;
						foreach ( (array) ( $m['variants'] ?? array() ) as $variant ) {
							if ( isset( $variant['content_type'], $variant['url'] ) && 'video/mp4' === $variant['content_type'] && (int) ( $variant['bit_rate'] ?? 0 ) > $best_rate ) {
								$best_rate = (int) ( $variant['bit_rate'] ?? 0 );
								$video_url = esc_url_raw( $variant['url'] );
							}
						}
					}
				} elseif ( ! empty( $m['url'] ) && 'video' !== $type ) {
					$images[] = esc_url_raw( $m['url'] );
				}
			}
			if ( 'video' !== $type ) {
				$images = array_slice( $images, 0, 4 );
				$image  = $images ? $images[0] : '';
				if ( count( $images ) > 1 ) {
					$type = 'carousel';
				}
			}

			$text = isset( $item['text'] ) ? $this->clean_caption( html_entity_decode( $item['text'], ENT_QUOTES, 'UTF-8' ) ) : '';
			if ( $keys ) {
				// X appends a t.co link to the attached media - the card already shows it.
				$text = trim( preg_replace( '#\s*https://t\.co/\w+$#', '', $text ) );
			}

			$tweet_id = isset( $item['id'] ) ? sanitize_text_field( $item['id'] ) : '';
			$metrics  = isset( $item['public_metrics'] ) && is_array( $item['public_metrics'] ) ? $item['public_metrics'] : array();

			return $this->finalize_post(
				array(
					'id'              => $tweet_id,
					'type'            => $type,
					'image'           => $image,
					'images'          => $images,
					'video_url'       => $video_url,
					'caption'         => $text,
					'permalink'       => $tweet_id ? 'https://x.com/' . rawurlencode( $username ? $username : 'i' ) . '/status/' . $tweet_id : '',
					'timestamp'       => isset( $item['created_at'] ) ? strtotime( $item['created_at'] ) : 0,
					'like_count'      => absint( $metrics['like_count'] ?? 0 ),
					'comment_count'   => absint( $metrics['reply_count'] ?? 0 ),
					'share_count'     => absint( $metrics['retweet_count'] ?? 0 ) + absint( $metrics['quote_count'] ?? 0 ),
					'author_name'     => $this->first_filled( $author['name'] ?? '', $profile['name'] ?? '', $username ),
					'author_username' => $username,
					'author_verified' => $author ? $this->is_verified( $author ) : ! empty( $profile['verified'] ),
					'author_avatar'   => ! empty( $author['profile_image_url'] ) ? esc_url_raw( str_replace( '_normal.', '_bigger.', $author['profile_image_url'] ) ) : ( $profile['avatar'] ?? '' ),
					'reposted_by'     => $reposted_by,
					'gallery'         => count( $images ) > 1 ? array_map(
						function ( $src ) {
							return array(
								'type'   => 'image',
								'src'    => $src,
								'poster' => '',
							);
						},
						$images
					) : array(),
					'embed_url'       => ( 'video' === $type && '' === $video_url && $tweet_id ) ? 'https://platform.twitter.com/embed/Tweet.html?id=' . rawurlencode( $tweet_id ) : '',
				)
			);
		}
	}
}
