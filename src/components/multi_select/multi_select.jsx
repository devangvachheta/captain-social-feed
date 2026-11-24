/**
 * MultiSelect
 *
 * Chip-based multi-select for a fixed list of options (unlike TagMultiSelect,
 * which is free-text with suggestions). Selected options render as removable
 * chips in the box; clicking the box opens a dropdown of the remaining
 * options to add.
 *
 * The dropdown is rendered via a portal into document.body (positioned from
 * the box's own bounding rect), the same way the dashboard's "Last Modified"
 * tooltip escapes its table's `overflow: hidden` - otherwise any container
 * with rounded-corner clipping (e.g. the White Label section cards) cuts the
 * dropdown off instead of letting it float above everything.
 *
 * Props:
 *   options    {Array}   [{ key, label }, ...] - the full list of choices
 *   value      {Array}   selected keys, e.g. ['create', 'docs']
 *   onChange   {fn}      (newArrayOfKeys) => void
 *   placeholder {string} shown in the box when nothing is selected
 *   disabled   {bool}
 */

import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { __ } from '@wordpress/i18n'
import './multi_select.scss'

const MultiSelect = ( { options = [], value = [], onChange, placeholder = '', disabled = false } ) => {
    const [ open, setOpen ] = useState( false )
    const [ pos, setPos ]   = useState( null )
    const wrapRef = useRef( null )
    const boxRef  = useRef( null )

    const updatePosition = () => {
        if ( ! boxRef.current ) return
        const rect = boxRef.current.getBoundingClientRect()
        setPos( {
            top:   rect.bottom + window.scrollY + 4,
            left:  rect.left + window.scrollX,
            width: rect.width,
        } )
    }

    useEffect( () => {
        const onDocClick = ( e ) => {
            if ( wrapRef.current && ! wrapRef.current.contains( e.target ) ) setOpen( false )
        }
        document.addEventListener( 'mousedown', onDocClick )
        return () => document.removeEventListener( 'mousedown', onDocClick )
    }, [] )

    useEffect( () => {
        if ( ! open ) return
        updatePosition()
        const onReposition = () => updatePosition()
        window.addEventListener( 'scroll', onReposition, true )
        window.addEventListener( 'resize', onReposition )
        return () => {
            window.removeEventListener( 'scroll', onReposition, true )
            window.removeEventListener( 'resize', onReposition )
        }
    }, [ open ] )

    const selected  = options.filter( o => value.includes( o.key ) )
    const available = options.filter( o => ! value.includes( o.key ) )

    const addItem = ( key ) => {
        if ( disabled ) return
        onChange( [ ...value, key ] )
    }
    const removeItem = ( key ) => {
        if ( disabled ) return
        onChange( value.filter( k => k !== key ) )
    }

    return (
        <div className='capsf-multiselect' ref={ wrapRef }>
            <div
                ref={ boxRef }
                className={ `capsf-multiselect-box${ disabled ? ' capsf-multiselect-box--disabled' : '' }` }
                onClick={ () => ! disabled && setOpen( o => ! o ) }
            >
                { selected.length === 0 && (
                    <span className='capsf-multiselect-placeholder'>{ placeholder }</span>
                ) }
                { selected.map( item => (
                    <span className='capsf-multiselect-chip' key={ item.key }>
                        <span className='capsf-multiselect-chip-text'>{ item.label }</span>
                        { ! disabled && (
                            <button
                                type='button'
                                className='capsf-multiselect-chip-remove'
                                onClick={ ( e ) => { e.stopPropagation(); removeItem( item.key ) } }
                                aria-label={ __( 'Remove', 'captain-social-feed' ) }
                            >×</button>
                        ) }
                    </span>
                ) ) }
                { ! disabled && (
                    <svg className='capsf-multiselect-chevron' viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                        <polyline points='6 9 12 15 18 9'/>
                    </svg>
                ) }
            </div>

            { open && ! disabled && available.length > 0 && pos && createPortal(
                <div
                    className='capsf-multiselect-dropdown capsf-multiselect-dropdown--portal'
                    style={ { top: pos.top, left: pos.left, width: pos.width } }
                >
                    { available.map( item => (
                        <button
                            type='button'
                            key={ item.key }
                            className='capsf-multiselect-option'
                            onMouseDown={ ( e ) => { e.preventDefault(); addItem( item.key ) } }
                        >
                            { item.label }
                        </button>
                    ) ) }
                </div>,
                document.body
            ) }
        </div>
    )
}

export default MultiSelect
