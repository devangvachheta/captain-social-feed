/**
 * CardTextStyle - a Styles-tab panel for one text element: a colour swatch
 * plus a Typography popover. One generic component (driven by the settings
 * key prefix) covers the card title, description and stats line, and the
 * Playlist layout's featured / list-item titles and stats.
 *
 * Saves `{prefix}_color`, `{prefix}_font_size`, `{prefix}_font_weight`,
 * `{prefix}_text_transform`, `{prefix}_font_style`, `{prefix}_line_height`
 * and `{prefix}_letter_spacing`.
 */

import { __ } from '@wordpress/i18n'
import TypographyControl from './TypographyControl'
import ResetButton, { isModified, resetValuesFor } from './ResetButton'
import StylePanel from './StylePanel'
import ColorPicker from '../../../../components/color_picker/color_picker.jsx'

const typoKeyMap = ( prefix ) => ( {
    size:           `${ prefix }_font_size`,
    weight:         `${ prefix }_font_weight`,
    transform:      `${ prefix }_text_transform`,
    style:          `${ prefix }_font_style`,
    line_height:    `${ prefix }_line_height`,
    letter_spacing: `${ prefix }_letter_spacing`,
} )

/**
 * @param {Object}   props
 * @param {string}   props.prefix         Settings key prefix, e.g. 'title'.
 * @param {string}   props.title          Panel header.
 * @param {string}   props.colorLabel     Colour row label.
 * @param {string}   [props.defaultColor] Swatch colour shown while unset.
 * @param {Object}   props.settings       Current feed settings.
 * @param {Function} props.updateSetting  ( key, value ) => void.
 * @param {Function} props.updateSettings ( { key: value, … } ) => void - used by the reset icons.
 */
const CardTextStyle = ( { prefix, title, colorLabel, defaultColor = '#0f172a', settings, updateSetting, updateSettings } ) => {
    const colorKey = `${ prefix }_color`
    const keyMap   = typoKeyMap( prefix )
    const typoKeys = Object.values( keyMap )

    const typoValue = {}
    Object.keys( keyMap ).forEach( ( k ) => { typoValue[ k ] = settings[ keyMap[ k ] ] ?? '' } )

    return (
        <StylePanel title={ title } layout="single">
            <div className="capsf-display-options__row">
                <div className="capsf-display-options__label">{ colorLabel }</div>
                <div className="capsf-display-options__control">
                    <ColorPicker
                        className="capsf-title-color-control__swatch"
                        value={ settings[ colorKey ] || defaultColor }
                        onChange={ ( hex ) => updateSetting( colorKey, hex ) }
                        ariaLabel={ colorLabel }
                    />
                    <ResetButton disabled={ ! isModified( settings, [ colorKey ] ) } onReset={ () => updateSettings( resetValuesFor( [ colorKey ] ) ) } />
                </div>
            </div>
            <div className="capsf-display-options__row">
                <div className="capsf-display-options__label">{ __( 'Typography', 'captain-social-feed' ) }</div>
                <div className="capsf-display-options__control">
                    <TypographyControl label={ __( 'Typography', 'captain-social-feed' ) } value={ typoValue } onChange={ ( key, value ) => updateSetting( keyMap[ key ], value ) } />
                    <ResetButton disabled={ ! isModified( settings, typoKeys ) } onReset={ () => updateSettings( resetValuesFor( typoKeys ) ) } />
                </div>
            </div>
        </StylePanel>
    )
}

export default CardTextStyle
