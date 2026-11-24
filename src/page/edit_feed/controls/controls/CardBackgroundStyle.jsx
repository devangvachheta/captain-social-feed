/**
 * CardBackgroundStyle - the "Background" panel for the card box itself:
 * Column Gap / Row Gap (spacing between cards), Background (solid /
 * gradient), Border, Margin, Padding and Shadow. Every row has an
 * icon-only reset. First panel of the Settings step's Styles tab.
 *
 * 7 rows (5 for Slider / Single feeds, which don't use CSS grid gap - see
 * showGap) - always an odd count, hence the `odd` panel layout.
 */

import { __ } from '@wordpress/i18n'
import GapControl from './GapControl.jsx'
import BackgroundControl from './BackgroundControl'
import BorderControl from './BorderControl'
import BoxControl from './BoxControl'
import ShadowControl from './ShadowControl'
import ResetButton from './ResetButton'
import StylePanel, { StyleRow, borderKeyMap, shadowKeyMap, boxKeyMap } from './StylePanel'

const DEFAULT_GAP = { value: 16, unit: 'px' }

const BG_KEY_MAP = {
    type:             'card_bg_type',
    color:            'card_bg_color',
    gradient_color_1: 'card_bg_gradient_color_1',
    gradient_color_2: 'card_bg_gradient_color_2',
    gradient_angle:   'card_bg_gradient_angle',
}

const gapModified = ( gap ) => !! gap && ( Number( gap.value ) !== DEFAULT_GAP.value || ( gap.unit || 'px' ) !== DEFAULT_GAP.unit )

/**
 * @param {Object}   props
 * @param {Object}   props.settings       Current feed settings.
 * @param {Function} props.updateSetting  ( key, value ) => void.
 * @param {Function} props.updateSettings ( { key: value, … } ) => void - batched update, used by the reset icons.
 * @param {boolean}  [props.showGap=true] False for Slider / Single feeds - they
 *                                        don't space cards with CSS grid gap,
 *                                        so Column/Row Gap would do nothing.
 */
const CardBackgroundStyle = ( { settings, updateSetting, updateSettings, showGap = true } ) => {
    const rowProps = { settings, updateSetting, updateSettings }

    return (
        <StylePanel title={ __( 'Background', 'captain-social-feed' ) } layout="odd">
            { showGap && [ [ 'column_gap', __( 'Column Gap', 'captain-social-feed' ) ], [ 'row_gap', __( 'Row Gap', 'captain-social-feed' ) ] ].map( ( [ key, label ] ) => (
                <div className="capsf-display-options__row" key={ key }>
                    <div className="capsf-display-options__label">{ label }</div>
                    <div className="capsf-display-options__control">
                        <GapControl value={ settings[ key ] || DEFAULT_GAP } onChange={ ( v ) => updateSetting( key, v ) } max={ 80 } />
                        <ResetButton disabled={ ! gapModified( settings[ key ] ) } onReset={ () => updateSetting( key, DEFAULT_GAP ) } />
                    </div>
                </div>
            ) ) }
            <StyleRow label={ __( 'Background', 'captain-social-feed' ) } keyMap={ BG_KEY_MAP } Control={ BackgroundControl } { ...rowProps } />
            <StyleRow label={ __( 'Border', 'captain-social-feed' ) } keyMap={ borderKeyMap( 'card_border' ) } Control={ BorderControl } { ...rowProps } />
            <StyleRow label={ __( 'Margin', 'captain-social-feed' ) } keyMap={ boxKeyMap( 'card_margin' ) } Control={ BoxControl } { ...rowProps } />
            <StyleRow label={ __( 'Padding', 'captain-social-feed' ) } keyMap={ boxKeyMap( 'card_padding' ) } Control={ BoxControl } { ...rowProps } />
            <StyleRow label={ __( 'Shadow', 'captain-social-feed' ) } keyMap={ shadowKeyMap( 'card_shadow' ) } Control={ ShadowControl } { ...rowProps } />
        </StylePanel>
    )
}

export default CardBackgroundStyle
