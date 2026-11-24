/**
 * DeviceSelect - the shared Desktop/Tablet/Mobile switcher (plus the three
 * device icons), used by edit_feed.jsx (Columns, Initial Videos, Videos Per
 * Click, Live Preview) and by TypographyControl's "Responsive" row.
 */

import { useState, useEffect, useRef } from 'react'
import { __ } from '@wordpress/i18n'

export const DesktopIcon = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>
export const TabletIcon  = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='4' y='2' width='16' height='20' rx='2'/><line x1='12' y1='18' x2='12.01' y2='18'/></svg>
export const MobileIcon  = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='5' y='2' width='14' height='20' rx='2'/><line x1='12' y1='18' x2='12.01' y2='18'/></svg>

// Compact Desktop/Tablet/Mobile switcher: a single icon button for the
// current device that opens a small dropdown menu, instead of a 3-button
// row that's always fully visible. Shared/global - reused wherever a
// field needs a per-device value (Columns, Initial Videos, Videos Per
// Click, and any new one going forward). Pass `proGated` to lock the
// Tablet/Mobile options behind Pro (onLockedClick fires instead of
// onChange); omit it where every device is free to pick, like Columns.
const DeviceSelect = ( { value, onChange, proGated = false, isPro = false, onLockedClick } ) => {
    const [ open, setOpen ] = useState( false )
    const wrapRef = useRef( null )

    useEffect( () => {
        if ( ! open ) return
        const onDocClick = e => {
            if ( wrapRef.current && ! wrapRef.current.contains( e.target ) ) setOpen( false )
        }
        document.addEventListener( 'mousedown', onDocClick )
        return () => document.removeEventListener( 'mousedown', onDocClick )
    }, [ open ] )

    const DEVICES = [
        { key: 'desktop', Icon: DesktopIcon, label: __( 'Desktop', 'captain-social-feed' ) },
        { key: 'tablet',  Icon: TabletIcon,  label: __( 'Tablet',  'captain-social-feed' ) },
        { key: 'mobile',  Icon: MobileIcon,  label: __( 'Mobile',  'captain-social-feed' ) },
    ]
    const current = DEVICES.find( d => d.key === value ) || DEVICES[ 0 ]

    return (
        // onClick + preventDefault here (not on the buttons themselves) stops
        // a click from also toggling the <summary> accordion this lives
        // inside, while still letting each button's own onClick run first
        // (React bubbles child handlers before parent ones).
        <div className='capsf-device-select' ref={ wrapRef } onClick={ e => e.preventDefault() }>
            <button
                type='button'
                className={ `capsf-device-select-trigger${ open ? ' active' : '' }` }
                onClick={ () => setOpen( o => ! o ) }
                title={ current.label }
            >
                <current.Icon />
            </button>
            { open && (
                <div className='capsf-device-select-menu'>
                    { DEVICES.map( ( { key, Icon, label } ) => {
                        const locked = proGated && key !== 'desktop' && ! isPro
                        return (
                            <button
                                key={ key }
                                type='button'
                                className={ `capsf-device-select-option${ value === key ? ' active' : '' }${ locked ? ' locked' : '' }` }
                                onClick={ () => {
                                    setOpen( false )
                                    if ( locked ) { onLockedClick && onLockedClick() } else { onChange( key ) }
                                } }
                            >
                                <Icon />
                                <span>{ label }</span>
                                { locked && (
                                    <svg className='capsf-device-select-lock' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>
                                ) }
                            </button>
                        )
                    } ) }
                </div>
            ) }
        </div>
    )
}

export default DeviceSelect
