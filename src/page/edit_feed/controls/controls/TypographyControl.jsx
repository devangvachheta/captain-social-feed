/**
 * TypographyControl - a compact "Typography" trigger that opens a popover
 * with Size / Weight / Transform / Style / Line Height / Letter Spacing,
 * modeled on Elementor's Typography control so several text properties are
 * managed from one place instead of one field per row.
 *
 * Generic/reusable - takes a flat value object and reports patches back,
 * not tied to "title" specifically. Ported from Captain Advance Filter's
 * TypographyControl.jsx (same popover pattern, this plugin's capsf-
 * class prefix and text domain).
 *
 * Values apply to every screen size; the matching CSS is built by
 * Capsf_Style_CSS_Generator::panel_text() on the front end.
 */

import { useState, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import PopoverPanel from './PopoverPanel'

const WEIGHTS = [
    { value: '',    label: __( 'Default', 'captain-social-feed' ) },
    { value: '400', label: __( '400 (Normal)', 'captain-social-feed' ) },
    { value: '500', label: __( '500 (Medium)', 'captain-social-feed' ) },
    { value: '600', label: __( '600 (Semi Bold)', 'captain-social-feed' ) },
    { value: '700', label: __( '700 (Bold)', 'captain-social-feed' ) },
    { value: '800', label: __( '800 (Extra Bold)', 'captain-social-feed' ) },
]
const TRANSFORMS = [
    { value: '',           label: __( 'Default', 'captain-social-feed' ) },
    { value: 'uppercase',  label: __( 'Uppercase', 'captain-social-feed' ) },
    { value: 'lowercase',  label: __( 'Lowercase', 'captain-social-feed' ) },
    { value: 'capitalize', label: __( 'Capitalize', 'captain-social-feed' ) },
]
const STYLES = [
    { value: '',       label: __( 'Default', 'captain-social-feed' ) },
    { value: 'italic', label: __( 'Italic', 'captain-social-feed' ) },
]

/**
 * @param {Object}   props
 * @param {string}   props.label    Trigger row label (e.g. "Typography").
 * @param {Object}   props.value    { size, weight, transform, style, line_height, letter_spacing }
 * @param {Function} props.onChange ( key, value ) => void - called per changed sub-field.
 */
const TypographyControl = ( { label, value, onChange } ) => {
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
                        <label>{ __( 'Size', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="10" max="48" className="capsf-typo-control__input" placeholder='16' value={ v.size ?? '' } onChange={ set( 'size' ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Weight', 'captain-social-feed' ) }</label>
                        <select className="capsf-typo-control__select" value={ v.weight ?? '' } onChange={ set( 'weight' ) }>
                            { WEIGHTS.map( ( w ) => <option key={ w.value } value={ w.value }>{ w.label }</option> ) }
                        </select>
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Transform', 'captain-social-feed' ) }</label>
                        <select className="capsf-typo-control__select" value={ v.transform ?? '' } onChange={ set( 'transform' ) }>
                            { TRANSFORMS.map( ( t ) => <option key={ t.value } value={ t.value }>{ t.label }</option> ) }
                        </select>
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Style', 'captain-social-feed' ) }</label>
                        <select className="capsf-typo-control__select" value={ v.style ?? '' } onChange={ set( 'style' ) }>
                            { STYLES.map( ( s ) => <option key={ s.value } value={ s.value }>{ s.label }</option> ) }
                        </select>
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Line Height', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="0" max="120" className="capsf-typo-control__input" placeholder='-' value={ v.line_height ?? '' } onChange={ set( 'line_height' ) } />
                    </div>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Letter Spacing', 'captain-social-feed' ) } (px)</label>
                        <input type="number" min="-5" max="20" step="0.5" className="capsf-typo-control__input" placeholder='-' value={ v.letter_spacing ?? '' } onChange={ set( 'letter_spacing' ) } />
                    </div>
                </PopoverPanel>
            ) }
        </>
    )
}

export default TypographyControl
