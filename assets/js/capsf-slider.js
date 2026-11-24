/**
 * Captain Social Feed - Slider (Style-5)
 * Vanilla JS, no dependencies.
 */
( function () {
    'use strict';

    // Translated label from the feed wrapper (see get_feed_label_attrs()
    // in class-capsf-shortcode.php), with an English fallback.
    function capsfLabel( el, key, fallback ) {
        var root = el && el.closest ? el.closest( '[data-capsf-instance]' ) : null;
        return ( root && root.getAttribute( 'data-capsf-label-' + key ) ) || fallback;
    }

    function initSlider( wrapper ) {
        // Init once per wrapper - initAll() can run again for markup added
        // later (the Gutenberg block preview re-renders via REST).
        if ( wrapper.dataset.capsfReady ) return;
        wrapper.dataset.capsfReady = '1';
        var slideLabel = capsfLabel( wrapper, 'slide', 'Slide %d' );

        var track      = wrapper.querySelector( '.capsf-s5-track' );
        var slides     = wrapper.querySelectorAll( '.capsf-s5-slide' );
        var prevBtn    = wrapper.querySelector( '.capsf-s5-prev' );
        var nextBtn    = wrapper.querySelector( '.capsf-s5-next' );
        var dotsWrap   = wrapper.querySelector( '.capsf-s5-dots' );
        // Optional - only present on the "carousel" variant (Slider
        // Style 3). null on every other slider on the site, so every
        // use below is guarded and simply no-ops elsewhere.
        var counterEl  = wrapper.querySelector( '.capsf-s5-counter' );
        var progressEl = wrapper.querySelector( '.capsf-s5-progress-bar' );
        var total      = slides.length;
        var cols       = 3;
        var current    = 0;
        var autoTimer  = null;
        var maxIndex   = 0;
        var dots       = [];
        var isAutoScrolling = false;
        var autoScrollEndTimer;
        // No auto-advance for visitors who ask the OS for reduced motion.
        var autoSlide    = wrapper.dataset.autoSlide !== '0' && ! ( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
        var infiniteLoop = wrapper.dataset.infiniteLoop !== '0';

        function pad2( n ) { return ( n < 10 ? '0' : '' ) + n; }

        function getCols() {
            var colsStyle = getComputedStyle( wrapper ).getPropertyValue( '--s5-cols' ).trim();
            return parseInt( colsStyle, 10 ) || 3;
        }

        function getStep() {
            var gap    = parseInt( getComputedStyle( wrapper ).getPropertyValue( '--s5-gap' ) || '16', 10 );
            var slideW = slides[0] ? slides[0].getBoundingClientRect().width : 0;
            return slideW + gap;
        }

        // Build one dot per "page" of visible cards (not one per single-slide step).
        function buildDots() {
            if ( ! dotsWrap ) return;
            dotsWrap.innerHTML = '';
            dots = [];
            for ( var i = 0; i <= maxIndex; i++ ) {
                var dot = document.createElement( 'button' );
                dot.type = 'button';
                dot.className = 'capsf-s5-dot' + ( i === current ? ' active' : '' );
                dot.setAttribute( 'aria-label', slideLabel.replace( '%d', i + 1 ) );
                ( function ( idx ) {
                    dot.addEventListener( 'click', function () { goTo( idx ); startAuto(); } );
                } )( i );
                dotsWrap.appendChild( dot );
                dots.push( dot );
            }
        }

        function refreshUI() {
            if ( prevBtn ) prevBtn.classList.toggle( 'disabled', ! infiniteLoop && current === 0 );
            if ( nextBtn ) nextBtn.classList.toggle( 'disabled', ! infiniteLoop && current >= maxIndex );
            dots.forEach( function ( d, i ) {
                d.classList.toggle( 'active', i === current );
            } );
            if ( counterEl ) {
                counterEl.textContent = pad2( current + 1 ) + ' / ' + pad2( maxIndex + 1 );
            }
            if ( progressEl ) {
                var pct = maxIndex > 0 ? ( current / maxIndex * 100 ) : 100;
                progressEl.style.width = Math.max( 15, Math.min( 100, pct ) ) + '%';
            }
        }

        function recalc() {
            // Recalc cols (responsive) and rebuild dots if the page count changed.
            cols = getCols();
            var pages       = Math.max( 1, Math.ceil( total / cols ) );
            var newMaxIndex = pages - 1;
            if ( newMaxIndex !== maxIndex || dots.length !== pages ) {
                maxIndex = newMaxIndex;
                if ( current > maxIndex ) current = maxIndex;
                buildDots();
            }
        }

        function scrollToCurrent() {
            // Step by a full page, but never scroll past the last full set of slides.
            var slideStep = Math.min( current * cols, Math.max( 0, total - cols ) );
            var offset    = Math.round( slideStep * getStep() );

            isAutoScrolling = true;
            clearTimeout( autoScrollEndTimer );
            track.scrollTo( { left: offset, behavior: 'smooth' } );
            autoScrollEndTimer = setTimeout( function () { isAutoScrolling = false; }, 500 );

            refreshUI();
        }

        function updateTrack() {
            recalc();
            scrollToCurrent();
        }

        function goTo( idx ) {
            current = Math.max( 0, Math.min( idx, maxIndex ) );
            scrollToCurrent();
        }

        function next() {
            if ( current >= maxIndex ) {
                if ( infiniteLoop ) goTo( 0 );
                return;
            }
            goTo( current + 1 );
        }
        function prev() {
            if ( current <= 0 ) {
                if ( infiniteLoop ) goTo( maxIndex );
                return;
            }
            goTo( current - 1 );
        }

        function startAuto() {
            stopAuto();
            if ( ! autoSlide ) return;
            autoTimer = setInterval( next, 3000 );
        }

        function stopAuto() {
            if ( autoTimer ) { clearInterval( autoTimer ); autoTimer = null; }
        }

        if ( prevBtn ) prevBtn.addEventListener( 'click', function () { prev(); startAuto(); } );
        if ( nextBtn ) nextBtn.addEventListener( 'click', function () { next(); startAuto(); } );

        // Pause on hover
        wrapper.addEventListener( 'mouseenter', stopAuto );
        wrapper.addEventListener( 'mouseleave', startAuto );
        // Keyboard users: pause while focus is inside the slider.
        wrapper.addEventListener( 'focusin', stopAuto );
        wrapper.addEventListener( 'focusout', function ( e ) {
            if ( ! wrapper.contains( e.relatedTarget ) ) startAuto();
        } );

        // Native scroll/swipe - keep dots & arrow state in sync if the user drags the track by hand.
        var scrollSyncTimer;
        track.addEventListener( 'scroll', function () {
            if ( isAutoScrolling ) return;
            clearTimeout( scrollSyncTimer );
            scrollSyncTimer = setTimeout( function () {
                var step = getStep();
                if ( step > 0 ) {
                    var slideIdx = Math.round( track.scrollLeft / step );
                    current = Math.max( 0, Math.min( Math.round( slideIdx / cols ), maxIndex ) );
                }
                refreshUI();
            }, 120 );
        }, { passive: true } );

        // Resize
        var resizeTimer;
        window.addEventListener( 'resize', function () {
            clearTimeout( resizeTimer );
            resizeTimer = setTimeout( updateTrack, 150 );
        } );

        recalc();
        scrollToCurrent();
        startAuto();
    }

    function initAll() {
        document.querySelectorAll( '.capsf-s5-wrapper' ).forEach( initSlider );
    }
    window.capsfSliderInit = initAll;

    if ( document.readyState === 'loading' ) {
        document.addEventListener( 'DOMContentLoaded', initAll );
    } else {
        initAll();
    }
} )();
