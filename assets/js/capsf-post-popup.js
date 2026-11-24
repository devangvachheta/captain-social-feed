/**
 * Captain Social Feed - Post popup (Simple Grid).
 *
 * Clicking a Simple Grid picture opens its post in a popup: the server
 * renders each post's popup markup into a <template class="capsf-pp-data">
 * next to the card (inert until used), and this script copies it into one
 * shared dialog. Albums get a slider (arrows, dots, swipe, ← / →), videos
 * play in the browser's own player, and the dialog has previous / next post
 * buttons, Esc to close, focus kept inside and returned on close.
 *
 * One delegated click listener on `document`, so posts added later by
 * "Load More" work too. Without JavaScript the card's link opens the post.
 */
( function () {
	'use strict';

	var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	var ARROW_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	var CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

	var state = null; // { overlay, item, items, slide, count, opener }

	function label( item, key, fallback ) {
		var root = item.closest( '[data-capsf-instance]' );
		return ( root && root.getAttribute( 'data-capsf-label-' + key ) ) || fallback;
	}

	function button( cls, html, text ) {
		var b = document.createElement( 'button' );
		b.type = 'button';
		b.className = cls;
		b.innerHTML = html + '<span class="screen-reader-text"></span>';
		b.lastChild.textContent = text;
		return b;
	}

	function feedItems( item ) {
		var feed = item.closest( '[data-capsf-instance]' ) || document;
		return Array.prototype.slice.call( feed.querySelectorAll( '.capsf-s8-item' ) ).filter( function ( el ) {
			return el.querySelector( 'template.capsf-pp-data' ) && el.offsetParent !== null;
		} );
	}

	function stopMedia( root ) {
		Array.prototype.forEach.call( root.querySelectorAll( 'video' ), function ( v ) {
			v.pause();
		} );
		Array.prototype.forEach.call( root.querySelectorAll( 'iframe[src]' ), function ( f ) {
			f.setAttribute( 'data-src', f.getAttribute( 'src' ) );
			f.removeAttribute( 'src' );
		} );
	}

	function showSlide( index ) {
		var pp = state.overlay.querySelector( '.capsf-pp' );
		var track = pp.querySelector( '.capsf-pp-track' );
		if ( ! track ) {
			return;
		}
		stopMedia( pp );
		state.slide = Math.max( 0, Math.min( state.count - 1, index ) );
		var rtl = 'rtl' === getComputedStyle( track ).direction;
		track.style.transform = 'translateX(' + ( rtl ? 1 : -1 ) * state.slide * 100 + '%)';

		var slides = track.children;
		for ( var i = 0; i < slides.length; i++ ) {
			slides[ i ].setAttribute( 'aria-hidden', i === state.slide ? 'false' : 'true' );
			var frame = slides[ i ].querySelector( 'iframe[data-src]' );
			if ( frame && i === state.slide ) {
				frame.setAttribute( 'src', frame.getAttribute( 'data-src' ) );
			}
		}
		var prev = pp.querySelector( '.capsf-pp-arrow--prev' );
		var next = pp.querySelector( '.capsf-pp-arrow--next' );
		if ( prev ) {
			prev.hidden = 0 === state.slide;
			next.hidden = state.count - 1 === state.slide;
		}
		Array.prototype.forEach.call( pp.querySelectorAll( '.capsf-pp-dots span' ), function ( dot, d ) {
			dot.classList.toggle( 'is-active', d === state.slide );
		} );
	}

	function buildSlider( pp, item ) {
		var media = pp.querySelector( '.capsf-pp-media' );
		var track = media && media.querySelector( '.capsf-pp-track' );
		state.count = track ? track.children.length : 0;
		state.slide = 0;
		if ( state.count < 2 ) {
			showSlide( 0 );
			return;
		}
		var prev = button( 'capsf-pp-arrow capsf-pp-arrow--prev', ARROW_BACK, label( item, 'prev', 'Previous photo' ) );
		var next = button( 'capsf-pp-arrow capsf-pp-arrow--next', ARROW, label( item, 'next', 'Next photo' ) );
		prev.addEventListener( 'click', function () { showSlide( state.slide - 1 ); } );
		next.addEventListener( 'click', function () { showSlide( state.slide + 1 ); } );
		var dots = document.createElement( 'div' );
		dots.className = 'capsf-pp-dots';
		dots.setAttribute( 'aria-hidden', 'true' );
		for ( var i = 0; i < state.count; i++ ) {
			dots.appendChild( document.createElement( 'span' ) );
		}
		media.appendChild( prev );
		media.appendChild( next );
		media.appendChild( dots );

		// Swipe.
		var startX = null;
		media.addEventListener( 'pointerdown', function ( e ) { startX = e.clientX; } );
		media.addEventListener( 'pointerup', function ( e ) {
			if ( null === startX ) {
				return;
			}
			var dx = e.clientX - startX;
			startX = null;
			if ( Math.abs( dx ) > 40 ) {
				var rtl = 'rtl' === getComputedStyle( media ).direction;
				showSlide( state.slide + ( ( dx < 0 ) !== rtl ? 1 : -1 ) );
			}
		} );
		showSlide( 0 );
	}

	function render( item ) {
		var dialog = state.overlay.querySelector( '.capsf-pp-dialog' );
		var old = dialog.querySelector( '.capsf-pp' );
		if ( old ) {
			stopMedia( old );
		}
		dialog.innerHTML = '';
		dialog.appendChild( item.querySelector( 'template.capsf-pp-data' ).content.cloneNode( true ) );
		var pp = dialog.querySelector( '.capsf-pp' );
		var name = pp.querySelector( '.capsf-pp-name' );
		dialog.setAttribute( 'aria-label', name ? name.textContent : '' );
		state.item = item;
		buildSlider( pp, item );

		var index = state.items.indexOf( item );
		state.overlay.querySelector( '.capsf-pp-nav--prev' ).hidden = index <= 0;
		state.overlay.querySelector( '.capsf-pp-nav--next' ).hidden = index < 0 || index >= state.items.length - 1;
	}

	function close() {
		if ( ! state ) {
			return;
		}
		stopMedia( state.overlay );
		state.overlay.remove();
		document.body.classList.remove( 'capsf-pp-open' );
		document.removeEventListener( 'keydown', onKey, true );
		var opener = state.opener;
		state = null;
		if ( opener && opener.focus ) {
			opener.focus();
		}
	}

	function go( step ) {
		var index = state.items.indexOf( state.item ) + step;
		if ( index >= 0 && index < state.items.length ) {
			render( state.items[ index ] );
		}
	}

	function onKey( e ) {
		if ( ! state ) {
			return;
		}
		if ( 'Escape' === e.key ) {
			e.preventDefault();
			close();
		} else if ( 'ArrowRight' === e.key || 'ArrowLeft' === e.key ) {
			if ( e.target && /INPUT|TEXTAREA|VIDEO/.test( e.target.tagName ) ) {
				return;
			}
			var forward = ( 'ArrowRight' === e.key ) !== ( 'rtl' === document.documentElement.dir );
			if ( state.count > 1 && ( forward ? state.slide < state.count - 1 : state.slide > 0 ) ) {
				showSlide( state.slide + ( forward ? 1 : -1 ) );
			} else {
				go( forward ? 1 : -1 );
			}
		} else if ( 'Tab' === e.key ) {
			// Keep focus inside the dialog.
			var focusables = Array.prototype.filter.call(
				state.overlay.querySelectorAll( 'a[href], button, video, iframe' ),
				function ( el ) { return ! el.hidden && null !== el.offsetParent; }
			);
			if ( ! focusables.length ) {
				return;
			}
			var first = focusables[ 0 ];
			var last = focusables[ focusables.length - 1 ];
			if ( e.shiftKey && document.activeElement === first ) {
				e.preventDefault();
				last.focus();
			} else if ( ! e.shiftKey && document.activeElement === last ) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	function open( item, opener ) {
		var overlay = document.createElement( 'div' );
		overlay.className = 'capsf-pp-overlay';
		var dialog = document.createElement( 'div' );
		dialog.className = 'capsf-pp-dialog';
		dialog.setAttribute( 'role', 'dialog' );
		dialog.setAttribute( 'aria-modal', 'true' );

		var closeBtn = button( 'capsf-pp-close', CLOSE, label( item, 'close', 'Close' ) );
		var prevPost = button( 'capsf-pp-nav capsf-pp-nav--prev', ARROW_BACK, label( item, 'prevpost', 'Previous post' ) );
		var nextPost = button( 'capsf-pp-nav capsf-pp-nav--next', ARROW, label( item, 'nextpost', 'Next post' ) );
		closeBtn.addEventListener( 'click', close );
		prevPost.addEventListener( 'click', function () { go( -1 ); } );
		nextPost.addEventListener( 'click', function () { go( 1 ); } );
		overlay.addEventListener( 'click', function ( e ) {
			if ( e.target === overlay ) {
				close();
			}
		} );

		overlay.appendChild( prevPost );
		overlay.appendChild( dialog );
		overlay.appendChild( nextPost );
		overlay.appendChild( closeBtn );

		state = { overlay: overlay, item: null, items: feedItems( item ), slide: 0, count: 0, opener: opener };
		render( item );
		document.body.appendChild( overlay );
		document.body.classList.add( 'capsf-pp-open' );
		document.addEventListener( 'keydown', onKey, true );
		closeBtn.focus();
	}

	document.addEventListener( 'click', function ( e ) {
		var share = e.target.closest && e.target.closest( '.capsf-pp-share' );
		if ( share ) {
			var url = share.getAttribute( 'data-url' );
			if ( navigator.share ) {
				navigator.share( { url: url } ).catch( function () {} );
			} else if ( navigator.clipboard ) {
				navigator.clipboard.writeText( url ).then( function () {
					share.classList.add( 'is-copied' );
					share.setAttribute( 'title', share.getAttribute( 'data-copied' ) || '' );
				} );
			} else {
				window.open( url, '_blank', 'noopener' );
			}
			return;
		}

		var link = e.target.closest && e.target.closest( 'a.capsf-pp-open' );
		if ( ! link || e.ctrlKey || e.metaKey || e.shiftKey || 1 === e.button ) {
			return; // New-tab clicks still open the post itself.
		}
		var item = link.closest( '.capsf-s8-item' );
		if ( ! item || ! item.querySelector( 'template.capsf-pp-data' ) ) {
			return;
		}
		e.preventDefault();
		open( item, link );
	} );
}() );
