/**
 * LivePreview - the Settings step's "Live Preview" modal.
 *
 * Shows the REAL feed (the shortcode rendered by the site's own theme) in an
 * iframe of the admin-only preview page (?capsf_preview=ID&capsf_embed=1 -
 * see Capsf_Posttype). Because it is a real iframe sized per device, the
 * feed's own Tablet / Mobile media queries (columns, sliders) apply exactly
 * like on a phone or tablet. The parent saves pending settings before
 * opening, so the preview always shows what is saved.
 */

import { useEffect, useRef, useState } from 'react'
import { __ } from '@wordpress/i18n'

const DEVICE_WIDTHS = { desktop: '100%', tablet: '820px', mobile: '390px' }

/**
 * @param {Object}   props
 * @param {string}   props.feedId     Feed ID.
 * @param {number}   props.reloadKey  Changes whenever the iframe must reload.
 * @param {Function} props.onRefresh  Save pending settings + reload.
 * @param {Function} props.onClose    Close the modal.
 * @param {Object}   props.icons      { desktop, tablet, mobile } icon components.
 */
const LivePreview = ( { feedId, reloadKey, onRefresh, onClose, icons } ) => {
    const DEVICES = [
        { key: 'desktop', label: __( 'Desktop', 'captain-social-feed' ), Icon: icons.desktop },
        { key: 'tablet',  label: __( 'Tablet', 'captain-social-feed' ),  Icon: icons.tablet },
        { key: 'mobile',  label: __( 'Mobile', 'captain-social-feed' ),  Icon: icons.mobile },
    ]
    const [ device, setDevice ]   = useState( 'desktop' )
    const [ loading, setLoading ] = useState( true )
    const closeRef = useRef( null )

    const base = ( typeof capsf_data !== 'undefined' && capsf_data.home_url ) ? capsf_data.home_url : '/'
    const url  = new URL( base, window.location.href )
    url.searchParams.set( 'capsf_preview', String( feedId ) )
    url.searchParams.set( 'capsf_embed', '1' )
    url.searchParams.set( 't', String( reloadKey ) )

    // Esc closes; focus starts on the close button and returns on close.
    useEffect( () => {
        const previous = document.activeElement
        closeRef.current?.focus()
        const onKey = e => { if ( e.key === 'Escape' ) onClose() }
        document.addEventListener( 'keydown', onKey )
        return () => {
            document.removeEventListener( 'keydown', onKey )
            if ( previous && previous.focus ) previous.focus()
        }
    }, [ onClose ] )

    useEffect( () => { setLoading( true ) }, [ reloadKey ] )

    const width = DEVICE_WIDTHS[ device ] || '100%'

    return (
        <div className='capsf-lp-overlay' role='presentation' onClick={ e => { if ( e.target === e.currentTarget ) onClose() } }>
            <div className='capsf-lp-dialog' role='dialog' aria-modal='true' aria-labelledby='capsf-lp-title'>
                <div className='capsf-lp-bar'>
                    <h2 className='capsf-lp-title' id='capsf-lp-title'>{ __( 'Live Preview', 'captain-social-feed' ) }</h2>
                    <div className='capsf-lp-devices' role='group' aria-label={ __( 'Screen size', 'captain-social-feed' ) }>
                        { DEVICES.map( ( { key, label, Icon } ) => (
                            <button
                                key={ key }
                                type='button'
                                className={ `capsf-lp-device${ device === key ? ' active' : '' }` }
                                aria-pressed={ device === key }
                                onClick={ () => setDevice( key ) }
                            >
                                <Icon />
                                <span>{ label }</span>
                            </button>
                        ) ) }
                    </div>
                    <div className='capsf-lp-actions'>
                        <button type='button' className='capsf-lp-btn' onClick={ onRefresh }>
                            { __( 'Refresh', 'captain-social-feed' ) }
                        </button>
                        <button type='button' className='capsf-lp-btn capsf-lp-btn--close' ref={ closeRef } onClick={ onClose } aria-label={ __( 'Close preview', 'captain-social-feed' ) }>
                            <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' aria-hidden='true'><line x1='6' y1='6' x2='18' y2='18'/><line x1='18' y1='6' x2='6' y2='18'/></svg>
                        </button>
                    </div>
                </div>
                <div className='capsf-lp-stage'>
                    { loading && <div className='capsf-lp-loading' role='status'>{ __( 'Loading preview…', 'captain-social-feed' ) }</div> }
                    <iframe
                        key={ reloadKey }
                        className='capsf-lp-frame'
                        style={ { width } }
                        src={ url.toString() }
                        title={ __( 'Feed preview', 'captain-social-feed' ) }
                        onLoad={ () => setLoading( false ) }
                    />
                </div>
            </div>
        </div>
    )
}

export default LivePreview
