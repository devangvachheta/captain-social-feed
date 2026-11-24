/**
 * Captain Social Feed - Style 6 Playlist
 *
 * Clicking a video in the side list loads and plays it in the big
 * featured player on the left, the way a video playlist page
 * behaves. This is independent of the "Video Play Mode" setting -
 * a playlist's side-list always plays into the main player.
 *
 * The featured player's original thumbnail markup (and title/channel
 * text) is cached once, right when the page loads - before any click
 * can touch it - so the close ("×") button can always restore the
 * exact pristine state, no matter which list item was last played.
 */
( function () {
	'use strict';

	/**
	 * Only ever embed http(s) URLs (defence in depth - the server already escapes them).
	 *
	 * @param {string} src Candidate URL.
	 * @return {string} Safe absolute URL or ''.
	 */
	function safeSrc( src ) {
		try {
			var u = new URL( src, window.location.href );
			return ( 'https:' === u.protocol || 'http:' === u.protocol ) ? u.href : '';
		} catch ( e ) {
			return '';
		}
	}

	function isVideoFile( src ) {
		return /\.(mp4|webm|ogv|m4v|mov)(?:$|[?#])/i.test( src );
	}

	function buildPlayer( src ) {
		src = safeSrc( src );
		if ( ! src ) {
			return null;
		}
		if ( isVideoFile( src ) ) {
			var video = document.createElement( 'video' );
			video.src = src;
			video.controls = true;
			video.autoplay = true;
			video.playsInline = true;
			video.setAttribute( 'playsinline', '' );
			video.preload = 'metadata';
			return video;
		}
		var iframe = document.createElement( 'iframe' );
		iframe.src = src;
		iframe.setAttribute( 'frameborder', '0' );
		iframe.setAttribute( 'sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups' );
		iframe.setAttribute( 'referrerpolicy', 'strict-origin-when-cross-origin' );
		iframe.setAttribute( 'allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen' );
		iframe.setAttribute( 'allowfullscreen', '' );
		return iframe;
	}

	function buildIframe( src ) {
		var player = buildPlayer( src );
		if ( ! player ) {
			return document.createElement( 'span' );
		}
		player.className = 'capsf-inline-iframe';
		player.setAttribute( 'title', 'Video player' );
		return player;
	}

	function setFeaturedText( wrapper, selector, text ) {
		if ( ! text ) {
			return;
		}
		var el = wrapper.querySelector( selector );
		if ( el ) {
			el.textContent = text;
		}
	}

	function buildCloseButton( onStop ) {
		var closeBtn = document.createElement( 'button' );
		closeBtn.type = 'button';
		closeBtn.className = 'capsf-inline-close';
		closeBtn.setAttribute( 'aria-label', 'Stop video' );
		closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>';
		closeBtn.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			onStop();
		} );
		return closeBtn;
	}

	// Cache the untouched, original featured-player markup + text for every
	// playlist wrapper, once, before any video has ever been played.
	function cacheOriginalState( wrapper ) {
		if ( wrapper.dataset.capsfS6Cached ) {
			return;
		}
		var featuredThumb = wrapper.querySelector( '.capsf-s6-featured-thumb' );
		var titleEl       = wrapper.querySelector( '.capsf-s6-featured-title' );
		var channelEl     = wrapper.querySelector( '.capsf-s6-featured-channel' );

		wrapper.dataset.capsfS6OriginalThumb   = featuredThumb ? featuredThumb.innerHTML : '';
		wrapper.dataset.capsfS6OriginalTitle   = titleEl ? titleEl.textContent : '';
		wrapper.dataset.capsfS6OriginalChannel = channelEl ? channelEl.textContent : '';
		wrapper.dataset.capsfS6Cached          = '1';
	}

	function stopFeatured( wrapper ) {
		var featuredThumb = wrapper.querySelector( '.capsf-s6-featured-thumb' );
		if ( ! featuredThumb || ! featuredThumb.classList.contains( 'capsf-is-playing' ) ) {
			return;
		}

		featuredThumb.innerHTML = wrapper.dataset.capsfS6OriginalThumb || '';
		featuredThumb.classList.remove( 'capsf-is-playing' );

		setFeaturedText( wrapper, '.capsf-s6-featured-title', wrapper.dataset.capsfS6OriginalTitle );
		setFeaturedText( wrapper, '.capsf-s6-featured-channel', wrapper.dataset.capsfS6OriginalChannel );

		var prevActive = wrapper.querySelectorAll( '.capsf-s6-playlist-item.active' );
		for ( var i = 0; i < prevActive.length; i++ ) {
			prevActive[ i ].classList.remove( 'active' );
		}

		syncListHeight( wrapper );
	}

	function playInFeatured( wrapper, embedSrc, title, channel ) {
		var featuredThumb = wrapper.querySelector( '.capsf-s6-featured-thumb' );
		if ( ! featuredThumb || ! embedSrc ) {
			return;
		}

		cacheOriginalState( wrapper );

		featuredThumb.innerHTML = '';
		featuredThumb.appendChild( buildIframe( embedSrc ) );
		featuredThumb.appendChild( buildCloseButton( function () {
			stopFeatured( wrapper );
		} ) );
		featuredThumb.classList.add( 'capsf-is-playing' );

		setFeaturedText( wrapper, '.capsf-s6-featured-title', title );
		setFeaturedText( wrapper, '.capsf-s6-featured-channel', channel );
	}

	// Keep the side list's max-height locked to the featured column's real
	// height, so the list scrolls internally instead of growing the wrapper
	// (e.g. after "Load More" adds new items, or the title text reflows).
	function syncListHeight( wrapper ) {
		var featured = wrapper.querySelector( '.capsf-s6-featured' );
		var listCol  = wrapper.querySelector( '.capsf-s6-list-col' );
		if ( ! featured || ! listCol ) {
			return;
		}
		listCol.style.setProperty( 'max-height', featured.offsetHeight + 'px', 'important' );
	}

	function initWrappers() {
		var wrappers = document.querySelectorAll( '.capsf-s6-wrapper' );
		if ( ! wrappers.length ) {
			return;
		}

		wrappers.forEach( function ( wrapper ) {
			// Cache the pristine state up front, before any click is possible.
			cacheOriginalState( wrapper );

			syncListHeight( wrapper );

			var list = wrapper.querySelector( '.capsf-s6-list' );
			if ( list && 'MutationObserver' in window ) {
				new MutationObserver( function () {
					syncListHeight( wrapper );
				} ).observe( list, { childList: true } );
			}
		} );

		var resizeTimer;
		window.addEventListener( 'resize', function () {
			clearTimeout( resizeTimer );
			resizeTimer = setTimeout( function () {
				wrappers.forEach( syncListHeight );
			}, 150 );
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initWrappers );
	} else {
		initWrappers();
	}

	document.addEventListener( 'click', function ( e ) {
		var item = e.target.closest( '.capsf-s6-playlist-item' );
		if ( ! item ) {
			return;
		}

		var wrapper = item.closest( '.capsf-s6-wrapper' );
		if ( ! wrapper ) {
			return;
		}

		// Photos and posts without a playable video have no data-embed: let the
		// link open the original post instead of swallowing the click.
		if ( ! item.getAttribute( 'data-embed' ) ) {
			return;
		}

		e.preventDefault();

		// Clicking the item that's already playing acts as a pause/stop
		// toggle - click again to play it (or any other item) normally.
		if ( item.classList.contains( 'active' ) ) {
			stopFeatured( wrapper );
			item.classList.remove( 'active' );
			return;
		}

		var embedSrc  = item.getAttribute( 'data-embed' );
		var titleEl   = item.querySelector( '.capsf-s6-title' );
		var channelEl = item.querySelector( '.capsf-s6-ch' );

		playInFeatured(
			wrapper,
			embedSrc,
			titleEl ? titleEl.textContent.trim() : '',
			channelEl ? channelEl.textContent.trim() : ''
		);

		// Mark this item as the one currently playing.
		var prevActive = wrapper.querySelectorAll( '.capsf-s6-playlist-item.active' );
		for ( var i = 0; i < prevActive.length; i++ ) {
			prevActive[ i ].classList.remove( 'active' );
		}
		item.classList.add( 'active' );

		// Title length can change the featured column's height (line-clamp
		// shrinks/grows with the new title), so re-sync the list height too.
		syncListHeight( wrapper );

		// On small screens, scroll the player into view so the user sees it start.
		var featured = wrapper.querySelector( '.capsf-s6-featured' );
		if ( featured && window.innerWidth < 900 ) {
			featured.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}
	} );
} )();
