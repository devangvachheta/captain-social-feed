import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { __ } from '@wordpress/i18n'
import './color_picker.scss'

/**
 * ColorPicker - the plugin's own colour control (global; use it instead of
 * <input type="color">). A swatch button opens a popover with a
 * saturation/brightness box, hue slider, alpha slider and HEX + % inputs.
 *
 * Value format matches what the server already accepts (see
 * capsf_sanitize_leaf() / the style CSS generator): `#rrggbb`, or
 * `#rrggbbaa` when opacity is below 100%.
 *
 * @param {Object}   props
 * @param {string}   props.value       Current colour ("#rrggbb" / "#rrggbbaa").
 * @param {Function} props.onChange    Called with the new hex string.
 * @param {string}   [props.className] Extra class on the swatch button (e.g. an existing swatch class).
 * @param {string}   [props.ariaLabel] Accessible label for the swatch button.
 * @param {boolean}  [props.alpha=true] Show the opacity slider + % input.
 */

/* ── colour maths ─────────────────────────────────────────────────────── */
const clamp = ( n, min, max ) => Math.min( max, Math.max( min, n ) )

// "#abc" / "#aabbcc" / "#aabbccdd" (leading # optional) -> { r, g, b, a } or null
const parseHex = ( input ) => {
    let h = String( input || '' ).trim().replace( /^#/, '' )
    if ( /^[0-9a-f]{3}$/i.test( h ) ) h = h.split( '' ).map( c => c + c ).join( '' )
    if ( /^[0-9a-f]{4}$/i.test( h ) ) h = h.split( '' ).map( c => c + c ).join( '' )
    if ( ! /^([0-9a-f]{6}|[0-9a-f]{8})$/i.test( h ) ) return null
    return {
        r: parseInt( h.slice( 0, 2 ), 16 ),
        g: parseInt( h.slice( 2, 4 ), 16 ),
        b: parseInt( h.slice( 4, 6 ), 16 ),
        a: h.length === 8 ? parseInt( h.slice( 6, 8 ), 16 ) / 255 : 1,
    }
}

const toHexPart = ( n ) => Math.round( clamp( n, 0, 255 ) ).toString( 16 ).padStart( 2, '0' )

const rgbToHex = ( { r, g, b }, a = 1 ) =>
    '#' + toHexPart( r ) + toHexPart( g ) + toHexPart( b ) + ( a < 1 ? toHexPart( a * 255 ) : '' )

// h: 0-360, s/v: 0-1
const hsvToRgb = ( { h, s, v } ) => {
    const f = ( n ) => {
        const k = ( n + h / 60 ) % 6
        return v - v * s * Math.max( 0, Math.min( k, 4 - k, 1 ) )
    }
    return { r: f( 5 ) * 255, g: f( 3 ) * 255, b: f( 1 ) * 255 }
}

const rgbToHsv = ( { r, g, b } ) => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max( r, g, b )
    const min = Math.min( r, g, b )
    const d = max - min
    let h = 0
    if ( d !== 0 ) {
        if ( max === r ) h = ( ( g - b ) / d ) % 6
        else if ( max === g ) h = ( b - r ) / d + 2
        else h = ( r - g ) / d + 4
        h *= 60
        if ( h < 0 ) h += 360
    }
    return { h, s: max === 0 ? 0 : d / max, v: max }
}

const stateFromHex = ( hex, fallbackHue = 0 ) => {
    const rgb = parseHex( hex ) || { r: 0, g: 0, b: 0, a: 1 }
    const hsv = rgbToHsv( rgb )
    // Greys have no meaningful hue - keep whatever the user last dragged to.
    return { h: hsv.s === 0 || hsv.v === 0 ? fallbackHue : hsv.h, s: hsv.s, v: hsv.v, a: rgb.a }
}

/* ── draggable surface (area + sliders share this) ────────────────────── */
const useDrag = ( onMove ) => {
    const ref = useRef( null )

    const handle = useCallback( ( e ) => {
        const el = ref.current
        if ( ! el ) return
        const rect = el.getBoundingClientRect()
        onMove(
            clamp( ( e.clientX - rect.left ) / rect.width, 0, 1 ),
            clamp( ( e.clientY - rect.top ) / rect.height, 0, 1 )
        )
    }, [ onMove ] )

    const onPointerDown = useCallback( ( e ) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.( e.pointerId )
        handle( e )
    }, [ handle ] )

    const onPointerMove = useCallback( ( e ) => {
        if ( e.buttons === 0 ) return
        handle( e )
    }, [ handle ] )

    return { ref, onPointerDown, onPointerMove }
}

const ColorPicker = ( { value, onChange, className = '', ariaLabel, alpha = true } ) => {
    const btnRef = useRef( null )
    const panelRef = useRef( null )
    const [ open, setOpen ] = useState( false )
    const [ pos, setPos ] = useState( null )
    const [ theme, setTheme ] = useState( 'light' )

    // HSV is the source of truth while the popover is open (a hex round-trip
    // would throw away the hue every time brightness/saturation hits 0).
    const [ hsv, setHsv ] = useState( () => stateFromHex( value ) )
    const [ hexText, setHexText ] = useState( '' )
    const [ alphaText, setAlphaText ] = useState( '' )

    const rgb = hsvToRgb( hsv )
    const baseHex = rgbToHex( rgb ) // without alpha, for the HEX field

    // Re-sync from the outside value whenever it changes to something this
    // picker didn't just emit itself (reset button, other control, load).
    const lastEmitted = useRef( null )
    useEffect( () => {
        if ( value === lastEmitted.current ) return
        lastEmitted.current = null
        setHsv( prev => stateFromHex( value, prev.h ) )
    }, [ value ] )

    useEffect( () => {
        setHexText( baseHex.toUpperCase() )
        setAlphaText( String( Math.round( hsv.a * 100 ) ) )
    }, [ baseHex, hsv.a ] )

    const emit = useCallback( ( next ) => {
        setHsv( next )
        const hex = rgbToHex( hsvToRgb( next ), alpha ? next.a : 1 )
        lastEmitted.current = hex
        onChange( hex )
    }, [ onChange, alpha ] )

    /* ── open / position ─────────────────────────────────────────────── */
    const PANEL_W = 300
    const place = useCallback( () => {
        const el = btnRef.current
        if ( ! el ) return
        const r = el.getBoundingClientRect()
        const margin = 8
        const panelH = panelRef.current?.offsetHeight || 340
        const vw = window.innerWidth
        const vh = window.innerHeight
        const openAbove = ( vh - r.bottom ) < panelH + margin && r.top > panelH + margin
        const left = clamp( r.left, margin, vw - PANEL_W - margin )
        const top = openAbove ? r.top - panelH - margin : r.bottom + margin
        setPos( { top: clamp( top, margin, Math.max( margin, vh - panelH - margin ) ), left } )
    }, [] )

    const toggle = () => {
        if ( open ) { setOpen( false ); return }
        // Panels live in a portal at <body>, outside the app's themed root,
        // so carry the theme over for the CSS variables to resolve.
        const themed = btnRef.current?.closest( '[data-capsf-theme]' )
        setTheme( themed?.getAttribute( 'data-capsf-theme' ) || 'light' )
        setHsv( prev => stateFromHex( value, prev.h ) )
        setOpen( true )
    }

    useLayoutEffect( () => {
        if ( ! open ) { setPos( null ); return }
        place()
    }, [ open, place ] )

    useEffect( () => {
        if ( ! open ) return
        const onDown = ( e ) => {
            if ( btnRef.current?.contains( e.target ) ) return
            if ( panelRef.current?.contains( e.target ) ) return
            setOpen( false )
        }
        const onKey = ( e ) => { if ( e.key === 'Escape' ) setOpen( false ) }
        document.addEventListener( 'mousedown', onDown )
        document.addEventListener( 'keydown', onKey )
        window.addEventListener( 'scroll', place, true )
        window.addEventListener( 'resize', place )
        return () => {
            document.removeEventListener( 'mousedown', onDown )
            document.removeEventListener( 'keydown', onKey )
            window.removeEventListener( 'scroll', place, true )
            window.removeEventListener( 'resize', place )
        }
    }, [ open, place ] )

    /* ── drag surfaces ───────────────────────────────────────────────── */
    const area = useDrag( ( x, y ) => emit( { ...hsv, s: x, v: 1 - y } ) )
    const hue = useDrag( ( x ) => emit( { ...hsv, h: x * 360 } ) )
    const alphaDrag = useDrag( ( x ) => emit( { ...hsv, a: Math.round( x * 100 ) / 100 } ) )

    const hueColor = `rgb(${ Math.round( hsvToRgb( { h: hsv.h, s: 1, v: 1 } ).r ) }, ${ Math.round( hsvToRgb( { h: hsv.h, s: 1, v: 1 } ).g ) }, ${ Math.round( hsvToRgb( { h: hsv.h, s: 1, v: 1 } ).b ) })`
    const solid = `rgb(${ Math.round( rgb.r ) }, ${ Math.round( rgb.g ) }, ${ Math.round( rgb.b ) })`

    /* ── text inputs ─────────────────────────────────────────────────── */
    const commitHex = () => {
        const parsed = parseHex( hexText )
        if ( ! parsed ) { setHexText( baseHex.toUpperCase() ); return }
        const next = rgbToHsv( parsed )
        // An 8-digit paste carries its own alpha; a 3/6-digit one keeps the current.
        const hadAlpha = String( hexText ).replace( /^#/, '' ).length === 8
        emit( { h: next.s === 0 || next.v === 0 ? hsv.h : next.h, s: next.s, v: next.v, a: hadAlpha ? parsed.a : hsv.a } )
    }

    const commitAlpha = () => {
        const n = parseFloat( alphaText )
        if ( isNaN( n ) ) { setAlphaText( String( Math.round( hsv.a * 100 ) ) ); return }
        emit( { ...hsv, a: clamp( n, 0, 100 ) / 100 } )
    }

    const onEnter = ( fn ) => ( e ) => { if ( e.key === 'Enter' ) { e.preventDefault(); fn() } }

    // Swatch shows the *incoming* value even while closed.
    const shownParsed = parseHex( value )
    const swatchBg = shownParsed
        ? `rgba(${ shownParsed.r }, ${ shownParsed.g }, ${ shownParsed.b }, ${ shownParsed.a })`
        : 'transparent'

    return (
        <>
            <button
                type="button"
                ref={ btnRef }
                className={ `capsf-colorpicker__swatch${ className ? ' ' + className : '' }${ open ? ' is-open' : '' }` }
                onClick={ toggle }
                aria-label={ ariaLabel || __( 'Pick a color', 'captain-social-feed' ) }
                aria-haspopup="dialog"
                aria-expanded={ open }
            >
                <span className="capsf-colorpicker__swatch-fill">
                    <span className="capsf-colorpicker__swatch-color" style={ { background: swatchBg } } />
                </span>
            </button>

            { open && createPortal(
                <div
                    ref={ panelRef }
                    className="capsf-colorpicker__panel"
                    data-capsf-theme={ theme }
                    role="dialog"
                    aria-label={ ariaLabel || __( 'Color picker', 'captain-social-feed' ) }
                    style={ { top: pos ? pos.top : -9999, left: pos ? pos.left : -9999, width: PANEL_W, visibility: pos ? 'visible' : 'hidden' } }
                >
                    <div
                        className="capsf-colorpicker__area"
                        ref={ area.ref }
                        onPointerDown={ area.onPointerDown }
                        onPointerMove={ area.onPointerMove }
                        style={ { backgroundColor: hueColor } }
                    >
                        <span
                            className="capsf-colorpicker__thumb capsf-colorpicker__thumb--area"
                            style={ { left: `${ hsv.s * 100 }%`, top: `${ ( 1 - hsv.v ) * 100 }%` } }
                        />
                    </div>

                    <div
                        className="capsf-colorpicker__slider capsf-colorpicker__slider--hue"
                        ref={ hue.ref }
                        onPointerDown={ hue.onPointerDown }
                        onPointerMove={ hue.onPointerMove }
                    >
                        <span className="capsf-colorpicker__thumb capsf-colorpicker__thumb--slider" style={ { left: `${ ( hsv.h / 360 ) * 100 }%`, background: hueColor } } />
                    </div>

                    { alpha && (
                        <div
                            className="capsf-colorpicker__slider capsf-colorpicker__slider--alpha"
                            ref={ alphaDrag.ref }
                            onPointerDown={ alphaDrag.onPointerDown }
                            onPointerMove={ alphaDrag.onPointerMove }
                        >
                            <span className="capsf-colorpicker__alpha-gradient" style={ { background: `linear-gradient(to right, transparent, ${ solid })` } } />
                            <span className="capsf-colorpicker__thumb capsf-colorpicker__thumb--slider" style={ { left: `${ hsv.a * 100 }%`, background: `rgba(${ Math.round( rgb.r ) }, ${ Math.round( rgb.g ) }, ${ Math.round( rgb.b ) }, ${ hsv.a })` } } />
                        </div>
                    ) }

                    <div className="capsf-colorpicker__fields">
                        <label className="capsf-colorpicker__field capsf-colorpicker__field--hex">
                            <span>{ __( 'HEX', 'captain-social-feed' ) }</span>
                            <input
                                type="text"
                                value={ hexText }
                                spellCheck="false"
                                maxLength={ 9 }
                                onChange={ ( e ) => setHexText( e.target.value ) }
                                onBlur={ commitHex }
                                onKeyDown={ onEnter( commitHex ) }
                            />
                        </label>
                        { alpha && (
                            <label className="capsf-colorpicker__field capsf-colorpicker__field--alpha">
                                <span>%</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={ alphaText }
                                    maxLength={ 3 }
                                    onChange={ ( e ) => setAlphaText( e.target.value.replace( /[^0-9.]/g, '' ) ) }
                                    onBlur={ commitAlpha }
                                    onKeyDown={ onEnter( commitAlpha ) }
                                />
                            </label>
                        ) }
                    </div>
                </div>,
                document.body
            ) }
        </>
    )
}

export default ColorPicker
