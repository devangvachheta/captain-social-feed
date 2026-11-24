/**
 * CaptionScrollStyle - Styles-tab panel for the Social Post designs when
 * the caption is a scroll box (Layout tab → Caption → Scroll): box height
 * and the scrollbar's width, corner radius, thumb and track colours.
 *
 * Saves caption_scroll_height, scrollbar_width, scrollbar_radius,
 * scrollbar_thumb_color and scrollbar_track_color - turned into CSS custom
 * properties by Capsf_Style_CSS_Generator::get_caption_css().
 */

import { __ } from '@wordpress/i18n'
import ResetButton, { isModified, resetValuesFor } from './ResetButton'
import StylePanel from './StylePanel'
import ColorPicker from '../../../../components/color_picker/color_picker.jsx'

const NUMBER_ROWS = [
    { key: 'caption_scroll_height', label: __( 'Box Height', 'captain-social-feed' ), min: 40, max: 800, placeholder: 140 },
    { key: 'scrollbar_width',       label: __( 'Scrollbar Width', 'captain-social-feed' ), min: 2, max: 20, placeholder: 6 },
    { key: 'scrollbar_radius',      label: __( 'Scrollbar Radius', 'captain-social-feed' ), min: 0, max: 20, placeholder: 10 },
]

const COLOR_ROWS = [
    { key: 'scrollbar_thumb_color', label: __( 'Scrollbar Color', 'captain-social-feed' ), fallback: '#c1c7d0' },
    { key: 'scrollbar_track_color', label: __( 'Track Color', 'captain-social-feed' ), fallback: '#f1f5f9' },
]

/**
 * @param {Object}   props
 * @param {Object}   props.settings       Current feed settings.
 * @param {Function} props.updateSetting  ( key, value ) => void.
 * @param {Function} props.updateSettings ( { key: value, … } ) => void - used by the reset icons.
 */
const CaptionScrollStyle = ( { settings, updateSetting, updateSettings } ) => (
    <StylePanel title={ __( 'Caption Scroll Box', 'captain-social-feed' ) } layout="single">
        { NUMBER_ROWS.map( row => {
            const id = `capsf-${ row.key }`
            return (
                <div className="capsf-display-options__row" key={ row.key }>
                    <label className="capsf-display-options__label" htmlFor={ id }>{ row.label } (px)</label>
                    <div className="capsf-display-options__control">
                        <div className="capsf-gap-control">
                            <input
                                type="range"
                                className="capsf-gap-slider"
                                min={ row.min }
                                max={ row.max }
                                aria-label={ row.label }
                                value={ Number( settings[ row.key ] ) || row.placeholder }
                                onChange={ e => updateSetting( row.key, e.target.value ) }
                            />
                            <input
                                id={ id }
                                type="number"
                                className="capsf-gap-number"
                                min={ row.min }
                                max={ row.max }
                                placeholder={ String( row.placeholder ) }
                                value={ settings[ row.key ] ?? '' }
                                onChange={ e => updateSetting( row.key, e.target.value ) }
                            />
                        </div>
                        <ResetButton disabled={ ! isModified( settings, [ row.key ] ) } onReset={ () => updateSettings( resetValuesFor( [ row.key ] ) ) } />
                    </div>
                </div>
            )
        } ) }
        { COLOR_ROWS.map( row => (
            <div className="capsf-display-options__row" key={ row.key }>
                <div className="capsf-display-options__label">{ row.label }</div>
                <div className="capsf-display-options__control">
                    <ColorPicker
                        className="capsf-title-color-control__swatch"
                        value={ settings[ row.key ] || row.fallback }
                        onChange={ hex => updateSetting( row.key, hex ) }
                        ariaLabel={ row.label }
                    />
                    <ResetButton disabled={ ! isModified( settings, [ row.key ] ) } onReset={ () => updateSettings( resetValuesFor( [ row.key ] ) ) } />
                </div>
            </div>
        ) ) }
    </StylePanel>
)

export default CaptionScrollStyle
