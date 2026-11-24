import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import AttentionTooltip from '../components/attention_tooltip/attention_tooltip.jsx';

// Tooltip is visible for exactly this long (from when it appears, i.e. after
// the scroll-settle delay below) - kept short and snappy per feedback.
const TOOLTIP_DURATION = 3000;
// The target's pulse/glow outlasts the tooltip by this much - the switch
// effect itself reads well, so it's allowed to linger a bit after the
// tooltip text has already faded.
const HIGHLIGHT_EXTRA_MS = 1500;
const HIGHLIGHT_DURATION = TOOLTIP_DURATION + HIGHLIGHT_EXTRA_MS;
// Let the smooth-scroll settle before measuring position + showing the
// tooltip, so it doesn't jump around mid-scroll.
const SCROLL_SETTLE_DELAY = 400;
// Minimum room (px) required on a side before we'll place the tooltip there.
const SPACE_THRESHOLD = 100;
// Keep the bubble at least this far from the left/right viewport edge.
const VIEWPORT_PADDING = 12;
// Matches attention_tooltip.scss's max-width - used to keep the bubble from
// overflowing the viewport without needing a measure-then-reposition pass.
const TOOLTIP_HALF_WIDTH = 130;
const GAP = 10; // px between the target and the bubble

const AttentionPingContext = createContext( null );

// Works out where the shared bubble goes for a given target element: above
// it by default, flipped below only if there's no room above, and clamped
// so it never overflows the viewport horizontally. Used by both the
// attention ping and the hover tooltip (see showHover below).
const getTooltipData = ( targetEl, message ) => {
    const rect = targetEl.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Default: open above. Only flip below if there's genuinely not
    // enough room above but there is below; otherwise fall back to
    // the default (above) even if neither side is very roomy.
    const placement = spaceAbove >= SPACE_THRESHOLD
        ? 'top'
        : ( spaceBelow >= SPACE_THRESHOLD ? 'bottom' : 'top' );

    const left = Math.min(
        Math.max( rect.left + rect.width / 2, VIEWPORT_PADDING + TOOLTIP_HALF_WIDTH ),
        window.innerWidth - VIEWPORT_PADDING - TOOLTIP_HALF_WIDTH
    );
    const top = placement === 'top' ? rect.top - GAP : rect.bottom + GAP;

    return { message, top, left, placement };
};

export const AttentionPingProvider = ( { children } ) => {
    const [ highlightEl, setHighlightEl ] = useState( null );
    const [ tooltipData, setTooltipData ] = useState( null ); // { message, top, left, placement }
    const [ hoverActive, setHoverActive ] = useState( false ); // true only while a hover/focus tooltip is showing

    const showTimer      = useRef( null );
    const hideTooltipTimer = useRef( null );
    const clearHighlightTimer = useRef( null );

    const clearTimers = () => {
        clearTimeout( showTimer.current );
        clearTimeout( hideTooltipTimer.current );
        clearTimeout( clearHighlightTimer.current );
    };

    useEffect( () => clearTimers, [] );

    const ping = useCallback( ( targetEl, message ) => {
        if ( ! targetEl ) return;

        clearTimers();
        setHoverActive( false );
        setTooltipData( null );
        setHighlightEl( targetEl );

        targetEl.scrollIntoView( { behavior: 'smooth', block: 'center' } );

        showTimer.current = setTimeout( () => {
            setTooltipData( getTooltipData( targetEl, message ) );
        }, SCROLL_SETTLE_DELAY );

        hideTooltipTimer.current = setTimeout( () => {
            setTooltipData( null );
        }, SCROLL_SETTLE_DELAY + TOOLTIP_DURATION );

        clearHighlightTimer.current = setTimeout( () => {
            setHighlightEl( null );
        }, HIGHLIGHT_DURATION );
    }, [] );

    // Hover/focus tooltips (e.g. the little "i" icons next to settings) -
    // same bubble as the attention ping, but no scrolling, no auto-hide
    // timer and no highlight: it shows while the pointer/focus is on the
    // target and hides on leave/blur (or as soon as the page scrolls, since
    // the bubble is position:fixed and would otherwise float away from it).
    const showHover = useCallback( ( targetEl, message ) => {
        if ( ! targetEl || ! message ) return;
        clearTimers();
        setHighlightEl( null );
        setTooltipData( getTooltipData( targetEl, message ) );
        setHoverActive( true );
    }, [] );

    const hideHover = useCallback( () => {
        setHoverActive( false );
        setTooltipData( null );
    }, [] );

    useEffect( () => {
        if ( ! hoverActive ) return;
        const onScroll = () => hideHover();
        window.addEventListener( 'scroll', onScroll, true );
        return () => window.removeEventListener( 'scroll', onScroll, true );
    }, [ hoverActive, hideHover ] );

    return (
        <AttentionPingContext.Provider value={ { ping, highlightEl, showHover, hideHover } }>
            { children }
            <AttentionTooltip { ...tooltipData } />
        </AttentionPingContext.Provider>
    );
};

/**
 * Consumer-side hook - same shape as before, so existing call sites
 * (e.g. ai_tools.jsx) don't need to change how they use it.
 *
 *   const { targetRef, highlighted, ping } = useAttentionPing();
 *   <button ref={targetRef} className={highlighted ? 'is-pinged' : ''}>...</button>
 *   ping('Turn this on first'); // from wherever the blocked interaction happens
 */
export const useAttentionPing = () => {
    const ctx = useContext( AttentionPingContext );
    const targetRef = useRef( null );

    const ping = useCallback( ( message ) => {
        if ( ctx && targetRef.current ) ctx.ping( targetRef.current, message );
    }, [ ctx ] );

    return {
        targetRef,
        highlighted: !! ctx && ctx.highlightEl !== null && targetRef.current === ctx.highlightEl,
        ping,
    };
};

/**
 * Hover/focus tooltip using the app's one shared bubble. Returns handlers
 * to spread onto the element that should trigger it:
 *
 *   const tip = useGlobalTooltip( 'Explains this option' );
 *   <span tabIndex="0" { ...tip }>i</span>
 *
 * Outside the provider the handlers are harmless no-ops.
 */
export const useGlobalTooltip = ( message ) => {
    const ctx = useContext( AttentionPingContext );

    return {
        onMouseEnter: ( e ) => ctx?.showHover( e.currentTarget, message ),
        onMouseLeave: () => ctx?.hideHover(),
        onFocus:      ( e ) => ctx?.showHover( e.currentTarget, message ),
        onBlur:       () => ctx?.hideHover(),
    };
};

export default AttentionPingProvider;
