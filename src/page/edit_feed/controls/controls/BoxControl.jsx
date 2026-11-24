/**
 * BoxControl - a compact trigger that opens a popover with a linked/
 * per-side 4-value box (Top/Right/Bottom/Left), same one-input-or-four
 * pattern as BorderControl's width/radius rows, but standalone so it can
 * be reused for anything box-model-shaped (Margin, Padding, …).
 *
 * Generic/reusable - takes a flat { linked, value, top, right, bottom,
 * left } value object and reports patches back via onChange( key, value ).
 */

import { useState, useRef } from 'react'
import { __ } from '@wordpress/i18n'
import PopoverPanel from './PopoverPanel'

const LinkIcon = ( { linked } ) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        { linked
            ? <path d="M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 1 1 0 10h-2M8 12h8" />
            : <><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /></>
        }
    </svg>
)

/**
 * @param {Object}   props
 * @param {string}   props.label    Trigger row label (e.g. "Margin", "Padding").
 * @param {Object}   props.value    { linked, value, top, right, bottom, left }
 * @param {Function} props.onChange ( key, value ) => void - key is one of
 *                                   linked/value/top/right/bottom/left.
 */
const BoxControl = ( { label, value, onChange } ) => {
    const [ open, setOpen ] = useState( false )
    const triggerRef = useRef( null )
    const v = value || {}
    const linked = v.linked !== false // default true

    return (
        <>
            <button type="button" ref={ triggerRef } className="capsf-typo-control__trigger" onClick={ () => setOpen( ( o ) => ! o ) } aria-expanded={ open }>
                <span>{ label }</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            </button>
            { open && (
                <PopoverPanel anchorRef={ triggerRef } onClose={ () => setOpen( false ) } width={ 240 }>
                    <div className="capsf-border-control__box">
                        <div className="capsf-border-control__box-head">
                            <label>{ label } (px)</label>
                            <button type="button" className={ `capsf-border-control__link${ linked ? ' capsf-border-control__link--on' : '' }` } onClick={ () => onChange( 'linked', ! linked ) } aria-label={ __( 'Link sides', 'captain-social-feed' ) } title={ __( 'Link sides', 'captain-social-feed' ) }>
                                <LinkIcon linked={ linked } />
                            </button>
                        </div>
                        { linked ? (
                            <input type="number" min="0" max="200" className="capsf-typo-control__input" placeholder="0" value={ v.value ?? '' } onChange={ ( e ) => onChange( 'value', e.target.value ) } />
                        ) : (
                            <div className="capsf-border-control__sides">
                                { [
                                    [ 'top', __( 'Top', 'captain-social-feed' ) ],
                                    [ 'right', __( 'Right', 'captain-social-feed' ) ],
                                    [ 'bottom', __( 'Bottom', 'captain-social-feed' ) ],
                                    [ 'left', __( 'Left', 'captain-social-feed' ) ],
                                ].map( ( [ k, sideLabel ] ) => (
                                    <div key={ k } className="capsf-border-control__side">
                                        <input type="number" min="0" max="200" className="capsf-typo-control__input" placeholder="0" value={ v[ k ] ?? '' } onChange={ ( e ) => onChange( k, e.target.value ) } />
                                        <span>{ sideLabel }</span>
                                    </div>
                                ) ) }
                            </div>
                        ) }
                    </div>
                </PopoverPanel>
            ) }
        </>
    )
}

export default BoxControl
