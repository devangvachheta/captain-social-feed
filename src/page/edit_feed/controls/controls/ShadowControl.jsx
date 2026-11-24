/**
 * ShadowControl - a compact "Shadow" trigger that opens a popover with
 * Color, Horizontal, Vertical, Blur and Spread - a box-shadow builder,
 * same one-popover pattern as the other style controls here.
 *
 * Generic/reusable - takes a flat value object and reports patches back.
 * An empty/unset color means no shadow is applied.
 */

import { useState, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import PopoverPanel from './PopoverPanel'
import ColorPicker from '../../../../components/color_picker/color_picker.jsx'

/**
 * @param {Object}   props
 * @param {string}   props.label    Trigger row label (e.g. "Shadow").
 * @param {Object}   props.value    { color, x, y, blur, spread }
 * @param {Function} props.onChange ( key, value ) => void.
 */
const ShadowControl = ( { label, value, onChange } ) => {
    const [ open, setOpen ] = useState( false )
    const triggerRef = useRef( null )
    const v = value || {}
    const set = ( key ) => ( e ) => onChange( key, e.target.value )

    return (
        <>
            <button type="button" ref={ triggerRef } className="capsf-typo-control__trigger" onClick={ () => setOpen( ( o ) => ! o ) } aria-expanded={ open }>
                <span>{ label }</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            { open && (
                <PopoverPanel anchorRef={ triggerRef } onClose={ () => setOpen( false ) } width={ 240 }>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Color', 'captain-social-feed' ) }</label>
                        <ColorPicker className="capsf-border-control__swatch" value={ v.color || '#000000' } onChange={ ( hex ) => onChange( 'color', hex ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Horizontal', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="-100" max="100" className="capsf-typo-control__input" placeholder="0" value={ v.x ?? '' } onChange={ set( 'x' ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Vertical', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="-100" max="100" className="capsf-typo-control__input" placeholder="4" value={ v.y ?? '' } onChange={ set( 'y' ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Blur', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="0" max="150" className="capsf-typo-control__input" placeholder="12" value={ v.blur ?? '' } onChange={ set( 'blur' ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Spread', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="-50" max="50" className="capsf-typo-control__input" placeholder="0" value={ v.spread ?? '' } onChange={ set( 'spread' ) } />
                    </div>
                </PopoverPanel>
            ) }
        </>
    )
}

export default ShadowControl
