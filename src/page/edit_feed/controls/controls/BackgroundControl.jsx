/**
 * BackgroundControl - a compact "Background" trigger that opens a popover
 * with a Solid / Gradient switch, modeled on Elementor's Background
 * control: solid shows one color swatch, gradient shows two color stops
 * and an angle.
 *
 * Generic/reusable - takes a flat value object and reports patches back.
 */

import { useState, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import PopoverPanel from './PopoverPanel'
import ColorPicker from '../../../../components/color_picker/color_picker.jsx'

/**
 * @param {Object}   props
 * @param {string}   props.label    Trigger row label (e.g. "Background").
 * @param {Object}   props.value    { type, color, gradient_color_1, gradient_color_2, gradient_angle }
 * @param {Function} props.onChange ( key, value ) => void.
 */
const BackgroundControl = ( { label, value, onChange } ) => {
    const [ open, setOpen ] = useState( false )
    const triggerRef = useRef( null )
    const v = value || {}
    const type = v.type || 'solid'

    const preview = type === 'gradient'
        ? `linear-gradient(${ v.gradient_angle || 90 }deg, ${ v.gradient_color_1 || '#2271B1' }, ${ v.gradient_color_2 || '#e2e8f0' })`
        : ( v.color || 'transparent' )

    return (
        <>
            <button type="button" ref={ triggerRef } className="capsf-typo-control__trigger" onClick={ () => setOpen( ( o ) => ! o ) } aria-expanded={ open }>
                <span className="capsf-bg-control__swatch" style={ { background: preview } } />
                <span>{ label }</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            { open && (
                <PopoverPanel anchorRef={ triggerRef } onClose={ () => setOpen( false ) } width={ 240 }>
                    <div className="capsf-bg-control__type-switch">
                        <button type="button" className={ `capsf-bg-control__type-btn${ type === 'solid' ? ' active' : '' }` } onClick={ () => onChange( 'type', 'solid' ) }>
                            { __( 'Solid', 'captain-social-feed' ) }
                        </button>
                        <button type="button" className={ `capsf-bg-control__type-btn${ type === 'gradient' ? ' active' : '' }` } onClick={ () => onChange( 'type', 'gradient' ) }>
                            { __( 'Gradient', 'captain-social-feed' ) }
                        </button>
                    </div>
                    { type === 'solid' ? (
                        <div className="capsf-typo-control__row">
                            <label>{ __( 'Color', 'captain-social-feed' ) }</label>
                            <ColorPicker className="capsf-border-control__swatch" value={ v.color || '#ffffff' } onChange={ ( hex ) => onChange( 'color', hex ) } />
                        </div>
                    ) : (
                        <>
                            <div className="capsf-typo-control__row">
                                <label>{ __( 'Color 1', 'captain-social-feed' ) }</label>
                                <ColorPicker className="capsf-border-control__swatch" value={ v.gradient_color_1 || '#2271B1' } onChange={ ( hex ) => onChange( 'gradient_color_1', hex ) } />
                            </div>
                            <div className="capsf-typo-control__row">
                                <label>{ __( 'Color 2', 'captain-social-feed' ) }</label>
                                <ColorPicker className="capsf-border-control__swatch" value={ v.gradient_color_2 || '#e2e8f0' } onChange={ ( hex ) => onChange( 'gradient_color_2', hex ) } />
                            </div>
                            <div className="capsf-typo-control__row">
                                <label>{ __( 'Angle', 'captain-social-feed' ) } (deg)</label>
                                <input type="number" min="0" max="360" className="capsf-typo-control__input" placeholder="90" value={ v.gradient_angle ?? '' } onChange={ ( e ) => onChange( 'gradient_angle', e.target.value ) } />
                            </div>
                        </>
                    ) }
                </PopoverPanel>
            ) }
        </>
    )
}

export default BackgroundControl
