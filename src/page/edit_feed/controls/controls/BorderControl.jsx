/**
 * BorderControl - a compact "Border" trigger that opens a popover with
 * Border Type, Border Color, Border Width (linked or per-side), and Border
 * Radius (linked or per-corner) - modeled on the same one-popover pattern
 * as TypographyControl.jsx.
 *
 * Generic/reusable - takes a flat value object and reports patches back.
 * Ported from Captain Advance Filter's BorderControl.jsx (same popover
 * pattern, this plugin's capsf- class prefix and text domain).
 */

import { useState, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import PopoverPanel from './PopoverPanel'
import ColorPicker from '../../../../components/color_picker/color_picker.jsx'

const TYPES = [
    { value: '',       label: __( 'None', 'captain-social-feed' ) },
    { value: 'solid',  label: __( 'Solid', 'captain-social-feed' ) },
    { value: 'dashed', label: __( 'Dashed', 'captain-social-feed' ) },
    { value: 'dotted', label: __( 'Dotted', 'captain-social-feed' ) },
    { value: 'double', label: __( 'Double', 'captain-social-feed' ) },
]

const LinkIcon = ( { linked } ) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        { linked
            ? <path d="M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 1 1 0 10h-2M8 12h8" />
            : <><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /></>
        }
    </svg>
)

/**
 * A 4-value box control (width or radius): one input + link toggle when
 * linked, four labelled inputs when unlinked.
 */
const BoxRow = ( { legend, unit, linkedKey, singleKey, sideKeys, sideLabels, v, onChange } ) => {
    const linked = v[ linkedKey ] !== false // default true
    const toggleLinked = () => onChange( linkedKey, ! linked )

    return (
        <div className="capsf-border-control__box">
            <div className="capsf-border-control__box-head">
                <label>{ legend } { unit ? `(${ unit })` : '' }</label>
                <button type="button" className={ `capsf-border-control__link${ linked ? ' capsf-border-control__link--on' : '' }` } onClick={ toggleLinked } aria-label={ __( 'Link sides', 'captain-social-feed' ) } title={ __( 'Link sides', 'captain-social-feed' ) }>
                    <LinkIcon linked={ linked } />
                </button>
            </div>
            { linked ? (
                <input type="number" min="0" max="200" className="capsf-typo-control__input" placeholder="0" value={ v[ singleKey ] ?? '' } onChange={ ( e ) => onChange( singleKey, e.target.value ) } />
            ) : (
                <div className="capsf-border-control__sides">
                    { sideKeys.map( ( k, i ) => (
                        <div key={ k } className="capsf-border-control__side">
                            <input type="number" min="0" max="200" className="capsf-typo-control__input" placeholder="0" value={ v[ k ] ?? '' } onChange={ ( e ) => onChange( k, e.target.value ) } />
                            <span>{ sideLabels[ i ] }</span>
                        </div>
                    ) ) }
                </div>
            ) }
        </div>
    )
}

/**
 * @param {Object}   props
 * @param {string}   props.label    Trigger row label (e.g. "Border").
 * @param {Object}   props.value    Flat border value object, see keys used below.
 * @param {Function} props.onChange ( key, value ) => void - called per changed sub-field.
 */
const BorderControl = ( { label, value, onChange } ) => {
    const [ open, setOpen ] = useState( false )
    const triggerRef = useRef( null )
    const v = value || {}

    return (
        <>
            <button type="button" ref={ triggerRef } className="capsf-typo-control__trigger" onClick={ () => setOpen( ( o ) => ! o ) } aria-expanded={ open }>
                <span>{ label }</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            { open && (
                <PopoverPanel anchorRef={ triggerRef } onClose={ () => setOpen( false ) } width={ 260 }>
                    <div className="capsf-typo-control__row">
                        <label>{ __( 'Border Type', 'captain-social-feed' ) }</label>
                        <select className="capsf-typo-control__select" value={ v.type ?? '' } onChange={ ( e ) => onChange( 'type', e.target.value ) }>
                            { TYPES.map( ( t ) => <option key={ t.value } value={ t.value }>{ t.label }</option> ) }
                        </select>
                    </div>
                    { v.type && (
                        <>
                            <div className="capsf-typo-control__row">
                                <label>{ __( 'Border Color', 'captain-social-feed' ) }</label>
                                <ColorPicker className="capsf-border-control__swatch" value={ v.color || '#e2e8f0' } onChange={ ( hex ) => onChange( 'color', hex ) } />
                            </div>
                            <BoxRow
                                legend={ __( 'Border Width', 'captain-social-feed' ) } unit="px"
                                linkedKey="width_linked" singleKey="width"
                                sideKeys={ [ 'width_top', 'width_right', 'width_bottom', 'width_left' ] }
                                sideLabels={ [ __( 'Top', 'captain-social-feed' ), __( 'Right', 'captain-social-feed' ), __( 'Bottom', 'captain-social-feed' ), __( 'Left', 'captain-social-feed' ) ] }
                                v={ v } onChange={ onChange }
                            />
                            <BoxRow
                                legend={ __( 'Border Radius', 'captain-social-feed' ) } unit="px"
                                linkedKey="radius_linked" singleKey="radius"
                                sideKeys={ [ 'radius_tl', 'radius_tr', 'radius_br', 'radius_bl' ] }
                                sideLabels={ [ __( 'TL', 'captain-social-feed' ), __( 'TR', 'captain-social-feed' ), __( 'BR', 'captain-social-feed' ), __( 'BL', 'captain-social-feed' ) ] }
                                v={ v } onChange={ onChange }
                            />
                        </>
                    ) }
                </PopoverPanel>
            ) }
        </>
    )
}

export default BorderControl
