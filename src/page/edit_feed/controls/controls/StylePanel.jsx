/**
 * StylePanel - the collapsible bordered card every Styles-tab panel sits
 * in (header button + chevron, then a grid of label / control rows), plus
 * the small key-map helpers those panels share.
 *
 * Each panel stores its values as flat feed settings with a common prefix
 * (e.g. `card_border_color`, `image_shadow_blur`), which the front end
 * turns into CSS in Capsf_Style_CSS_Generator::get_panel_css().
 */

import { useState } from 'react'
import ResetButton, { isModified, resetValuesFor } from './ResetButton'

/** Border sub-keys → `{prefix}_type`, `{prefix}_width_top`, … */
export const borderKeyMap = ( prefix ) => ( {
    type:          `${ prefix }_type`,
    color:         `${ prefix }_color`,
    width_linked:  `${ prefix }_width_linked`,
    width:         `${ prefix }_width`,
    width_top:     `${ prefix }_width_top`,
    width_right:   `${ prefix }_width_right`,
    width_bottom:  `${ prefix }_width_bottom`,
    width_left:    `${ prefix }_width_left`,
    radius_linked: `${ prefix }_radius_linked`,
    radius:        `${ prefix }_radius`,
    radius_tl:     `${ prefix }_radius_tl`,
    radius_tr:     `${ prefix }_radius_tr`,
    radius_br:     `${ prefix }_radius_br`,
    radius_bl:     `${ prefix }_radius_bl`,
} )

/** Box-shadow sub-keys → `{prefix}_color`, `{prefix}_x`, … */
export const shadowKeyMap = ( prefix ) => ( {
    color:  `${ prefix }_color`,
    x:      `${ prefix }_x`,
    y:      `${ prefix }_y`,
    blur:   `${ prefix }_blur`,
    spread: `${ prefix }_spread`,
} )

/** Margin / padding sub-keys → `{prefix}`, `{prefix}_top`, … */
export const boxKeyMap = ( prefix ) => ( {
    linked: `${ prefix }_linked`,
    value:  prefix,
    top:    `${ prefix }_top`,
    right:  `${ prefix }_right`,
    bottom: `${ prefix }_bottom`,
    left:   `${ prefix }_left`,
} )

/** Build the flat { subKey: value } object a control expects from a key map. */
export const pick = ( settings, keyMap ) => {
    const out = {}
    Object.keys( keyMap ).forEach( ( k ) => {
        const raw = settings[ keyMap[ k ] ]
        out[ k ] = raw !== undefined && raw !== null ? raw : ( k.endsWith( 'linked' ) ? true : '' )
    } )
    return out
}

/**
 * One label / control / reset row bound to a key map.
 *
 * @param {Object}   props
 * @param {string}   props.label          Row label.
 * @param {Object}   props.keyMap         { subKey: settingsKey }.
 * @param {Function} props.Control        Control component ( { label, value, onChange } ).
 * @param {Object}   props.settings       Current feed settings.
 * @param {Function} props.updateSetting  ( key, value ) => void.
 * @param {Function} props.updateSettings ( { key: value } ) => void - used by reset.
 */
export const StyleRow = ( { label, keyMap, Control, settings, updateSetting, updateSettings } ) => {
    const keys = Object.values( keyMap )
    return (
        <div className="capsf-display-options__row">
            <div className="capsf-display-options__label">{ label }</div>
            <div className="capsf-display-options__control">
                <Control label={ label } value={ pick( settings, keyMap ) } onChange={ ( key, value ) => updateSetting( keyMap[ key ], value ) } />
                <ResetButton disabled={ ! isModified( settings, keys ) } onReset={ () => updateSettings( resetValuesFor( keys ) ) } />
            </div>
        </div>
    )
}

/**
 * @param {Object}  props
 * @param {string}  props.title    Header text.
 * @param {string}  [props.layout] '' (two columns) | 'odd' (odd row count) | 'single' (one column).
 * @param {*}       props.children Rows.
 */
const StylePanel = ( { title, layout = '', children } ) => {
    const [ open, setOpen ] = useState( true )

    return (
        <div className="capsf-display-options">
            <button
                type="button"
                className="capsf-display-options__header--toggle"
                onClick={ () => setOpen( ( o ) => ! o ) }
                aria-expanded={ open }
            >
                <span>{ title }</span>
                <svg
                    className={ `capsf-display-options__chevron${ open ? ' capsf-display-options__chevron--open' : '' }` }
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true" focusable="false"
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>
            { open && (
                <div className={ `capsf-display-options__rows${ layout ? ` capsf-display-options__rows--${ layout }` : '' }` }>
                    { children }
                </div>
            ) }
        </div>
    )
}

export default StylePanel
