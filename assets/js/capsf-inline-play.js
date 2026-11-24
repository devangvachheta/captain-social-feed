/**
 * Captain Social Feed - Inline Play
 *
 * When "Video Play Mode" is set to "Play Inline on Page", clicking a
 * thumbnail (in any grid style, or the Style-5 slider) swaps the
 * thumbnail image for the post's video player, right where it is -
 * no redirect, no popup.
 *
 * Once playing, the player covers the whole clickable area, so clicks
 * inside it never reach our click listener - there was no way to stop
 * playback. We fix that by adding a
 * small close ("×") button on top of the iframe (higher z-index, so it
 * still receives the click) that restores the original thumbnail. We
 * also make sure only one inline video plays at a time, stopping any
 * previously playing one whenever a new one is started.
 *
 * Uses a single delegated click listener on `document`, so it also
 * works automatically for items added later via "Load More" (AJAX).
 */
( function () {
	'use strict';

	/**
	 * Translated label from the feed wrapper (see get_feed_label_attrs()
	 * in class-capsf-shortcode.php), with an English fallback.
	 *
	 * @param {HTMLElement} el       Element inside a feed.
	 * @param {string}      key      Label key (stop | player).
	 * @param {string}      fallback English fallback.
	 * @return {string} Label.
	 */
	function capsfLabel( el, key, fallback ) {
		var root = el && el.closest ? el.closest( '[data-capsf-instance]' ) : null;
		return ( root && root.getAttribute( 'data-capsf-label-' + key ) ) || fallback;
	}

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

	/**
	 * Stop a playing inline video and restore its original thumbnail.
	 *
	 * @param {HTMLElement} link The `.capsf-inline-play` element.
	 */
	function stopInline( link ) {
		var iframe = link.querySelector( '.capsf-inline-iframe' );
		if ( ! iframe ) {
			return;
		}

		var restored = null;
		if ( link.dataset.capsfThumbHtml ) {
			var temp = document.createElement( 'div' );
			temp.innerHTML = link.dataset.capsfThumbHtml;
			restored = temp.firstElementChild;
		}

		if ( restored ) {
			iframe.parentNode.replaceChild( restored, iframe );
		} else {
			iframe.parentNode.removeChild( iframe );
		}

		var closeBtn = link.querySelector( '.capsf-inline-close' );
		if ( closeBtn ) {
			closeBtn.parentNode.removeChild( closeBtn );
		}

		link.classList.remove( 'capsf-is-playing' );
	}

	/**
	 * Start playing a video inline inside the given link.
	 *
	 * @param {HTMLElement} link The `.capsf-inline-play` element.
	 */
	function playInline( link ) {
		// Already playing - clicking the card again (e.g. its visible
		// play/pause icon, now showing a pause icon) stops it.
		if ( link.classList.contains( 'capsf-is-playing' ) ) {
			stopInline( link );
			return;
		}

		var src = link.getAttribute( 'data-inline-src' );
		if ( ! src ) {
			return;
		}

		// Only one inline video plays at a time - stop any others first.
		var others = document.querySelectorAll( '.capsf-inline-play.capsf-is-playing' );
		for ( var i = 0; i < others.length; i++ ) {
			if ( others[ i ] !== link ) {
				stopInline( others[ i ] );
			}
		}

		var img = link.querySelector( 'img' );

		// Keep a copy of the original thumbnail so we can restore it on stop.
		if ( img ) {
			link.dataset.capsfThumbHtml = img.outerHTML;
		}

		var iframe = buildPlayer( src );
		if ( ! iframe ) {
			return;
		}
		// Inherit the thumbnail's own sizing class (if any) so the iframe fills
		// exactly the same box the image did, on top of our universal base rule.
		iframe.className = 'capsf-inline-iframe' + ( img && img.className ? ' ' + img.className : '' );
		iframe.setAttribute( 'title', link.getAttribute( 'aria-label' ) || capsfLabel( link, 'player', 'Video player' ) );

		var thumbParent = img && img.parentNode ? img.parentNode : link;
		if ( img && img.parentNode ) {
			img.parentNode.replaceChild( iframe, img );
		} else {
			link.appendChild( iframe );
		}

		// Visible stop control - placed in the same positioned wrapper as the
		// iframe (not appended to `link` directly), so it stays correctly
		// anchored no matter which card style's markup is used, and sits in
		// front of the iframe so the click actually reaches it.
		var closeBtn = document.createElement( 'button' );
		closeBtn.type = 'button';
		closeBtn.className = 'capsf-inline-close';
		closeBtn.setAttribute( 'aria-label', capsfLabel( link, 'stop', 'Stop video' ) );
		closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg>';
		closeBtn.addEventListener( 'click', function ( e ) {
			e.preventDefault();
			e.stopPropagation();
			stopInline( link );
		} );
		thumbParent.appendChild( closeBtn );

		link.classList.add( 'capsf-is-playing' );
	}

	document.addEventListener( 'click', function ( e ) {
		var link = e.target.closest( '.capsf-inline-play' );
		if ( ! link ) {
			return;
		}
		e.preventDefault();
		playInline( link );
	} );
} )();
