/**
 * ResetButton - a small icon-only "reset to default" button that sits next
 * to a Styles-tab control (icon only so it takes almost no row space), plus
 * the helpers the panels use to work out which keys it resets and whether
 * anything has actually been changed yet (disabled + dimmed until then).
 */

import { __ } from '@wordpress/i18n'

// Default a settings key falls back to when reset.
const defaultFor = ( key ) => {
    if ( key.endsWith( '_linked' ) ) return true
    if ( key === 'card_bg_type' ) return 'solid'
    return ''
}

/** { key: default } object for a list of settings keys - pass to updateSettings(). */
export const resetValuesFor = ( keys ) => {
    const out = {}
    keys.forEach( ( k ) => { out[ k ] = defaultFor( k ) } )
    return out
}

/** True when at least one of the keys differs from its default. */
export const isModified = ( settings, keys ) => keys.some( ( k ) => {
    const v = settings[ k ]
    if ( v === undefined || v === null ) return false
    // "Link sides" toggles: false (or '' from older saves) means unlinked.
    if ( k.endsWith( '_linked' ) ) return v === false || v === '' || v === '0'
    return v !== defaultFor( k )
} )

/**
 * @param {Object}   props
 * @param {Function} props.onReset  Called on click.
 * @param {boolean}  props.disabled True when there is nothing to reset.
 */
const ResetButton = ( { onReset, disabled } ) => (
    <button
        type="button"
        className="capsf-reset-btn"
        onClick={ onReset }
        disabled={ disabled }
        aria-label={ __( 'Reset', 'captain-social-feed' ) }
        title={ __( 'Reset', 'captain-social-feed' ) }
    >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" />
            <polyline points="3 4 3 10 9 10" />
        </svg>
    </button>
)

export default ResetButton
