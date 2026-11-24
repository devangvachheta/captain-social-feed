/**
 * Captain Social Feed - Centered Carousel (Style-7)
 * Vanilla JS, no dependencies. The active slide sits enlarged in the
 * center of the track; side slides stay smaller/dimmed on either side.
 */
( function () {
    'use strict';

    // Translated label from the feed wrapper (see get_feed_label_attrs()
    // in class-capsf-shortcode.php), with an English fallback.
    function capsfLabel( el, key, fallback ) {
        var root = el && el.closest ? el.closest( '[data-capsf-instance]' ) : null;
        return ( root && root.getAttribute( 'data-capsf-label-' + key ) ) || fallback;
    }

    function initCarousel( wrapper ) {
        // Init once per wrapper - see capsf-slider.js.
        if ( wrapper.dataset.capsfReady ) return;
        wrapper.dataset.capsfReady = '1';
        var slideLabel = capsfLabel( wrapper, 'slide', 'Slide %d' );

        var track       = wrapper.querySelector( '.capsf-s7-track' );
        var prevBtn     = wrapper.querySelector( '.capsf-s7-prev' );
        var nextBtn     = wrapper.querySelector( '.capsf-s7-next' );
        var dotsWrap    = wrapper.querySelector( '.capsf-s7-dots' );
        var autoTimer   = null;
        var current     = 0;
        var dots        = [];
        // No auto-advance for visitors who ask the OS for reduced motion.
        var autoSlide    = wrapper.dataset.autoSlide !== '0' && ! ( window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches );
        var infiniteLoop = wrapper.dataset.infiniteLoop !== '0';

        function getSlides() {
            return Array.prototype.slice.call( track.querySelectorAll( '.capsf-s7-slide' ) );
        }

        function buildDots() {
            if ( ! dotsWrap ) return;
            var slides = getSlides();
            dotsWrap.innerHTML = '';
            dots = [];
            slides.forEach( function ( _slide, i ) {
                var dot = document.createElement( 'button' );
                dot.type = 'button';
                dot.className = 'capsf-s7-dot' + ( i === current ? ' active' : '' );
                dot.setAttribute( 'aria-label', slideLabel.replace( '%d', i + 1 ) );
                ( function ( idx ) {
                    dot.addEventListener( 'click', function () { goTo( idx ); startAuto(); } );
                } )( i );
                dotsWrap.appendChild( dot );
                dots.push( dot );
            } );
        }

        function refreshUI( slides ) {
            slides.forEach( function ( slide, i ) {
                slide.classList.toggle( 'capsf-s7-active', i === current );
            } );
            dots.forEach( function ( d, i ) {
                d.classList.toggle( 'active', i === current );
            } );
            if ( prevBtn ) prevBtn.classList.toggle( 'disabled', ! infiniteLoop && current === 0 );
            if ( nextBtn ) nextBtn.classList.toggle( 'disabled', ! infiniteLoop && current === slides.length - 1 );
        }

        function getPercentVar( name, fallback ) {
            var raw = getComputedStyle( wrapper ).getPropertyValue( name ).trim();
            var num = parseFloat( raw );
            return isNaN( num ) ? fallback : num;
        }

        function centerTrack() {
            var slides = getSlides();
            if ( ! slides.length ) return;

            refreshUI( slides );

            var trackWidth  = track.clientWidth;
            var gapStr      = getComputedStyle( track ).getPropertyValue( 'gap' ) || getComputedStyle( track ).getPropertyValue( 'column-gap' ) || '16px';
            var gap         = parseFloat( gapStr ) || 16;
            var activePct   = getPercentVar( '--s7-active-w', 46 );
            var sidePct     = getPercentVar( '--s7-side-w', 30 );

            // Analytic width of each slide - avoids measuring mid-transition (which
            // races the CSS flex-basis animation and drifts the center over time).
            function slideWidth( idx ) {
                var pct = ( idx === current ) ? activePct : sidePct;
                return ( pct / 100 ) * trackWidth;
            }

            var offsetBeforeCurrent = 0;
            for ( var i = 0; i < current; i++ ) {
                offsetBeforeCurrent += slideWidth( i ) + gap;
            }
            var activeSlideCenter = offsetBeforeCurrent + slideWidth( current ) / 2;
            var targetShift        = ( trackWidth / 2 ) - activeSlideCenter;

            track.style.transform = 'translateX(' + targetShift + 'px)';
        }

        function goTo( idx ) {
            var slides = getSlides();
            current = Math.max( 0, Math.min( idx, slides.length - 1 ) );
            centerTrack();
        }

        function next() {
            var slides = getSlides();
            if ( current >= slides.length - 1 ) {
                if ( infiniteLoop ) goTo( 0 );
                return;
            }
            goTo( current + 1 );
        }
        function prev() {
            var slides = getSlides();
            if ( current <= 0 ) {
                if ( infiniteLoop ) goTo( slides.length - 1 );
                return;
            }
            goTo( current - 1 );
        }

        function startAuto() {
            stopAuto();
            if ( ! autoSlide ) return;
            autoTimer = setInterval( next, 3500 );
        }
        function stopAuto() {
            if ( autoTimer ) { clearInterval( autoTimer ); autoTimer = null; }
        }

        if ( prevBtn ) prevBtn.addEventListener( 'click', function () { prev(); startAuto(); } );
        if ( nextBtn ) nextBtn.addEventListener( 'click', function () { next(); startAuto(); } );

        // Clicking a side (non-active) card brings it to center instead of navigating away.
        track.addEventListener( 'click', function ( e ) {
            var slide = e.target.closest( '.capsf-s7-slide' );
            if ( ! slide ) return;
            var slides = getSlides();
            var idx = slides.indexOf( slide );
            if ( idx !== -1 && idx !== current ) {
                e.preventDefault();
                goTo( idx );
                startAuto();
            }
        } );

        wrapper.addEventListener( 'mouseenter', stopAuto );
        wrapper.addEventListener( 'mouseleave', startAuto );
        // Keyboard users: pause while focus is inside the slider.
        wrapper.addEventListener( 'focusin', stopAuto );
        wrapper.addEventListener( 'focusout', function ( e ) {
            if ( ! wrapper.contains( e.relatedTarget ) ) startAuto();
        } );

        var resizeTimer;
        window.addEventListener( 'resize', function () {
            clearTimeout( resizeTimer );
            resizeTimer = setTimeout( centerTrack, 150 );
        } );

        buildDots();
        centerTrack();
        startAuto();

        // "Load More" appends new slides - rebuild dots + recenter when that happens.
        var observer = new MutationObserver( function () {
            buildDots();
            centerTrack();
        } );
        observer.observe( track, { childList: true } );
    }

    function initAll() {
        document.querySelectorAll( '.capsf-s7-wrapper' ).forEach( initCarousel );
    }
    window.capsfCarouselInit = initAll;

    if ( document.readyState === 'loading' ) {
        document.addEventListener( 'DOMContentLoaded', initAll );
    } else {
        initAll();
    }
} )();
