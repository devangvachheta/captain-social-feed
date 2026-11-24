/**
 * CardImageStyle - a Styles-tab panel with Border and Shadow controls for
 * an image. Generic over the settings key prefix, so one component covers
 * the card thumbnail (`image`) and the Playlist layout's featured / list
 * thumbnails (`playlist_featured_thumb`, `playlist_item_thumb`).
 */

import { __ } from '@wordpress/i18n'
import BorderControl from './BorderControl'
import ShadowControl from './ShadowControl'
import StylePanel, { StyleRow, borderKeyMap, shadowKeyMap } from './StylePanel'

/**
 * @param {Object}   props
 * @param {string}   [props.prefix='image'] Settings key prefix.
 * @param {string}   [props.title]          Panel header.
 * @param {string}   [props.layout]         StylePanel layout - 'single' in a half-width column.
 * @param {Object}   props.settings         Current feed settings.
 * @param {Function} props.updateSetting    ( key, value ) => void.
 * @param {Function} props.updateSettings   ( { key: value, … } ) => void - used by the reset icons.
 */
const CardImageStyle = ( { prefix = 'image', title, layout = '', settings, updateSetting, updateSettings } ) => {
    const rowProps = { settings, updateSetting, updateSettings }

    return (
        <StylePanel title={ title || __( 'Image', 'captain-social-feed' ) } layout={ layout }>
            <StyleRow label={ __( 'Border', 'captain-social-feed' ) } keyMap={ borderKeyMap( `${ prefix }_border` ) } Control={ BorderControl } { ...rowProps } />
            <StyleRow label={ __( 'Shadow', 'captain-social-feed' ) } keyMap={ shadowKeyMap( `${ prefix }_shadow` ) } Control={ ShadowControl } { ...rowProps } />
        </StylePanel>
    )
}

export default CardImageStyle
