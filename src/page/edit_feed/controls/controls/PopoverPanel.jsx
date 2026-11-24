/**
 * PopoverPanel - renders its children into a portal at document.body,
 * positioned under (or above, if there's no room below) a trigger element.
 *
 * Why a portal: panels like TypographyControl/BorderControl live inside
 * `.capsf-setup-section`/accordion content areas, which can clip an
 * absolutely-positioned popover via an ancestor's overflow rules. Rendering
 * at document.body sidesteps every ancestor's overflow/z-index/stacking
 * context entirely.
 *
 * Ported from Captain Advance Filter's PopoverPanel.jsx - same behavior,
 * just renamed to this plugin's capsf- class prefix.
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * @param {Object}          props
 * @param {React.RefObject} props.anchorRef Ref to the trigger element the panel positions against.
 * @param {Function}        props.onClose   Called on outside click / Escape.
 * @param {number}          [props.width]   Panel width in px (default 240).
 * @param {React.ReactNode} props.children
 */
const PopoverPanel = ( { anchorRef, onClose, width = 240, children } ) => {
    const [ pos, setPos ] = useState( null )

    useEffect( () => {
        const place = () => {
            const el = anchorRef.current
            if ( ! el ) return
            const r = el.getBoundingClientRect()
            const margin = 8
            const vh = window.innerHeight
            const vw = window.innerWidth

            // Prefer opening below-right-aligned to the trigger; flip above if
            // there isn't room below, and clamp horizontally so it never runs
            // off the right edge of the viewport.
            const openAbove = ( vh - r.bottom ) < 320 && r.top > 320
            let left = r.right - width
            left = Math.max( margin, Math.min( left, vw - width - margin ) )
            const top = openAbove ? r.top - margin : r.bottom + margin

            setPos( { top, left, openAbove } )
        }

        place()
        window.addEventListener( 'scroll', place, true )
        window.addEventListener( 'resize', place )
        return () => {
            window.removeEventListener( 'scroll', place, true )
            window.removeEventListener( 'resize', place )
        }
    }, [ anchorRef ] )

    useEffect( () => {
        const onDocClick = ( e ) => {
            if ( anchorRef.current && anchorRef.current.contains( e.target ) ) return
            if ( e.target.closest && e.target.closest( '.capsf-popover-panel, .capsf-colorpicker__panel' ) ) return
            onClose()
        }
        const onKey = ( e ) => { if ( e.key === 'Escape' ) onClose() }
        document.addEventListener( 'mousedown', onDocClick )
        document.addEventListener( 'keydown', onKey )
        return () => {
            document.removeEventListener( 'mousedown', onDocClick )
            document.removeEventListener( 'keydown', onKey )
        }
    }, [ anchorRef, onClose ] )

    if ( ! pos ) return null

    return createPortal(
        <div
            className="capsf-popover-panel"
            style={ {
                position: 'fixed',
                top: pos.openAbove ? undefined : pos.top,
                bottom: pos.openAbove ? ( window.innerHeight - pos.top ) : undefined,
                left: pos.left,
                width,
            } }
        >
            { children }
        </div>,
        document.body
    )
}

export default PopoverPanel
