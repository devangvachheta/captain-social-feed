/**
 * Captain Social Feed - caption "Show More" / "Show Less" toggle.
 *
 * One delegated listener, so it also works for posts added later by
 * "Load More". The button's labels come from its data-more / data-less
 * attributes (Settings → Layout → Caption).
 */
( function () {
	'use strict';

	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest ? e.target.closest( '.capsf-sc-more' ) : null;
		if ( ! btn ) {
			return;
		}
		e.preventDefault();

		var caption = btn.closest( '.capsf-sc-caption' );
		if ( ! caption ) {
			return;
		}
		var shortEl  = caption.querySelector( '.capsf-sc-caption-short' );
		var fullEl   = caption.querySelector( '.capsf-sc-caption-full' );
		var expanded = 'true' === btn.getAttribute( 'aria-expanded' );

		if ( shortEl ) {
			shortEl.hidden = ! expanded;
		}
		if ( fullEl ) {
			fullEl.hidden = expanded;
		}
		caption.classList.toggle( 'is-expanded', ! expanded );
		btn.setAttribute( 'aria-expanded', expanded ? 'false' : 'true' );
		btn.textContent = expanded ? ( btn.getAttribute( 'data-more' ) || '' ) : ( btn.getAttribute( 'data-less' ) || '' );
	} );
} )();
