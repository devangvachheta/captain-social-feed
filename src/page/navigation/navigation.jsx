import React, { useState } from 'react';
import './navigation.scss';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, toggleSidebar } from '../../redux/slice.jsx';
import { __ } from '@wordpress/i18n';
import UpgradeProCard from '../../components/upgrade_pro_card/upgrade_pro_card.jsx';

// CAPSF_VERSION from PHP - the same value the Quick Support widget shows.
const PLUGIN_VERSION = (typeof capsf_data !== 'undefined' && capsf_data?.capsf_version)
    ? capsf_data.capsf_version
    : '1.0.0';

// ── Icon helpers ────────────────────────────────────────────────────────
const IconDashboard = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);
const IconCreate = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
);
const IconDocs = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
);
const IconSettings = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
);
const IconAiTools = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
        <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/>
        <path d="M19 14l.6 1.8L21.4 16.4l-1.8.6L19 18.8l-.6-1.8-1.8-.6 1.8-.6L19 14z"/>
    </svg>
);
const IconHelp = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
const IconProducts = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
);
const IconRollback = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-3.35"/>
    </svg>
);
const IconWhiteLabel = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.17L4 3a1 1 0 0 0-1 1l.17 5.59a2 2 0 0 0 .66 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"/>
        <circle cx="7.5" cy="7.5" r="1.5"/>
    </svg>
);
const IconUpgrade = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 18.5h19l1-9-5.5 4-4-7-4 7-5.5-4 1 9Z"/>
        <rect x="2.5" y="19.5" width="19" height="2" rx="1"/>
    </svg>
);
const IconChevron = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
const LogoSVG = ( { theme, customIcon } ) => {
    const color = theme === 'dark' ? '#ffffff' : '#085F63';

    if ( customIcon ) {
        return <img src={ customIcon } alt="" className="capsf-nav-logo-custom-icon" />;
    }

    return (
        <svg width="36" height="36" viewBox="0 0 103 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <mask id="capsf-logo-mask" style={{ maskType:'luminance' }} maskUnits="userSpaceOnUse" x="0" y="0" width="90" height="100">
                <path d="M89.5467 24.1887C84.1784 14.9566 76.0753 7.76999 66.4459 3.70031C56.8165 -0.369367 46.1761 -1.10421 36.1109 1.60534C26.0456 4.31491 17.0947 10.3237 10.5924 18.7361C4.09008 27.1484 0.384603 37.5138 0.0283297 48.2869C-0.327943 59.0602 2.68408 69.6643 8.61537 78.5184C14.5467 87.3725 23.0796 94.0029 32.9422 97.4205C42.8047 100.838 53.4686 100.86 63.3447 97.4836C73.2204 94.107 81.7788 87.5127 87.7443 78.6832L74.5659 69.1156C70.5902 75 64.8863 79.3947 58.3047 81.6451C51.7231 83.8951 44.6161 83.8803 38.0434 81.6029C31.4706 79.325 25.7839 74.9066 21.8311 69.0057C17.8782 63.1049 15.8709 56.0381 16.1083 48.8586C16.3457 41.6787 18.8152 34.7709 23.1486 29.1645C27.482 23.5582 33.4473 19.5537 40.1553 17.7479C46.8627 15.9422 53.9541 16.4319 60.3718 19.1441C66.789 21.8563 72.189 26.6457 75.7667 32.7984L89.5467 24.1887Z" fill="white"/>
            </mask>
            <g mask="url(#capsf-logo-mask)">
                <path d="M89.5467 24.1887C84.1784 14.9566 76.0753 7.76999 66.4459 3.70031C56.8165 -0.369367 46.1761 -1.10421 36.1109 1.60534C26.0456 4.31491 17.0947 10.3237 10.5924 18.7361C4.09008 27.1484 0.384603 37.5138 0.0283297 48.2869C-0.327943 59.0602 2.68408 69.6643 8.61537 78.5184C14.5467 87.3725 23.0796 94.0029 32.9422 97.4205C42.8047 100.838 53.4686 100.86 63.3447 97.4836C73.2204 94.107 81.7788 87.5127 87.7443 78.6832L74.5659 69.1156C70.5902 75 64.8863 79.3947 58.3047 81.6451C51.7231 83.8951 44.6161 83.8803 38.0434 81.6029C31.4706 79.325 25.7839 74.9066 21.8311 69.0057C17.8782 63.1049 15.8709 56.0381 16.1083 48.8586C16.3457 41.6787 18.8152 34.7709 23.1486 29.1645C27.482 23.5582 33.4473 19.5537 40.1553 17.7479C46.8627 15.9422 53.9541 16.4319 60.3718 19.1441C66.789 21.8563 72.189 26.6457 75.7667 32.7984L89.5467 24.1887Z" fill={ color } stroke={ color } strokeWidth="2"/>
            </g>
            <path d="M66.3295 37H48.3678C46.5078 37 45 38.1411 45 39.5488V63.4512C45 64.8589 46.5078 66 48.3678 66C50.2278 66 51.7356 64.8589 51.7356 63.4512V54.0488H62.7371C64.5971 54.0488 66.1049 52.9077 66.1049 51.5C66.1049 50.0923 64.5971 48.9512 62.7371 48.9512H51.7356V42.0977H66.3295C68.1895 42.0977 69.6973 40.9565 69.6973 39.5488C69.6973 38.1411 68.1895 37 66.3295 37Z" fill={ color }/>
            <path d="M89.5463 49.03L83.0987 37H76.1543L86.5277 55.174V67H92.4677V55.042L92.6351 54.754L89.5463 49.03ZM96.0911 37L91.5767 45.298L94.7195 51.13L102.846 37H96.0911ZM90.8963 46.54L90.2213 47.8L93.3317 53.554L94.0283 52.354L90.8963 46.54Z" fill={ color }/>
        </svg>
    );
};
const ThemeToggle = ( { theme, dispatch } ) => (
    <button
        type="button"
        className="capsf-dm-toggle"
        title={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-social-feed' ) : __( 'Switch to Dark Mode', 'captain-social-feed' ) }
        aria-label={ theme === 'dark' ? __( 'Switch to Light Mode', 'captain-social-feed' ) : __( 'Switch to Dark Mode', 'captain-social-feed' ) }
        onClick={ () => dispatch( toggleTheme() ) }
    >
        {/* Moon - visible in light mode, hidden in dark */}
        <svg className="capsf-dm-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        {/* Sun - visible in dark mode, hidden in light */}
        <svg className="capsf-dm-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    </button>
);

// ── Hamburger icon ──────────────────────────────────────────────────────
const IconHamburger = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);
const IconClose = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6"  x2="6"  y2="18"/>
        <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
);

// ── Sidebar collapse/expand icon - double-chevron, rotates 180° between
//    the "collapse" (pointing left) and "expand" (pointing right) states,
//    same affordance shown by the reference screenshots (e.g. Captain
//    Live Chat's «/» toggle). ─────────────────────────────────────────
const IconSidebarToggle = ( { collapsed = false } ) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
        style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
        <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ── Small "PRO" badge shown next to gated nav items ─────────────────────
const ProBadge = () => (
    <span className="capsf-nav-pro-badge">{ __( 'PRO', 'captain-social-feed' ) }</span>
);

// ── Main navigation ─────────────────────────────────────────────────────
const Navigation = () => {
    const location  = useLocation();
    const navigate  = useNavigate();
    const dispatch  = useDispatch();
    const theme     = useSelector( state => state.theme );
    const sidebarCollapsed = useSelector( state => state.sidebarCollapsed );
    const [ extraOpen,  setExtraOpen ]  = useState( true );
    const [ generalOpen, setGeneralOpen ] = useState( true );
    const [ creating,   setCreating ]   = useState( false );
    const [ mobileOpen, setMobileOpen ] = useState( false );
    const sidebarStateClass = sidebarCollapsed ? ' capsf-navigation-sidebar--collapsed' : '';
    const isPro = typeof capsf_data !== 'undefined' && !! capsf_data?.capsfpro_active;
    const wlSettings   = ( typeof capsf_data !== 'undefined' && capsf_data?.capsfpro_wl ) || {};
    const hiddenItems  = Array.isArray( wlSettings.hide_items ) ? wlSettings.hide_items : [];
    const isHidden     = ( key ) => isPro && hiddenItems.includes( key );
    const displayName  = ( isPro && wlSettings.plugin_name )
        ? wlSettings.plugin_name
        : __( 'Captain Social Feed', 'captain-social-feed' );
    const customLogoIcon = isPro
        ? ( theme === 'dark' ? wlSettings.menu_icon_dark : wlSettings.menu_icon_light ) || ''
        : '';

    const closeMobile = () => setMobileOpen( false );

    const createAndEdit = async () => {
        if ( creating || typeof capsf_data === 'undefined' ) return
        setCreating( true )
        try {
            const fd = new FormData()
            fd.append( 'action', 'capsf_dashboard_ajax_call' )
            fd.append( 'nonce',  capsf_data.capsf_nonce )
            fd.append( 'type',   'create_new_feed' )
            const res    = await fetch( capsf_data.ajax_url, { method: 'POST', body: fd } )
            const result = await res.json()
            if ( result.success && result.data?.feed_id ) {
                navigate( `/edit?id=${ result.data.feed_id }` )
            }
        } catch( e ) {
            console.error( '[capsf] create error:', e )
        } finally {
            setCreating( false )
        }
    }

    const isActive = ( path ) => {
        if ( path === '/' ) return location.pathname === '/';
        return location.pathname.startsWith( path );
    };

    const linkClass = ( path ) =>
        `capsf-nav-link ${ isActive( path ) ? 'capsf-nav-link--active' : '' }`;

    const subLinkClass = ( path ) =>
        `capsf-nav-sublink ${ isActive( path ) ? 'capsf-nav-sublink--active' : '' }`;

    if ( location.pathname.includes( '/edit' ) ) {
        // On edit page - show compact sidebar without active states
        return (
            <>
                <button
                    className={ `capsf-hamburger${ mobileOpen ? ' capsf-hamburger--hidden' : '' }` }
                    aria-label={ __( 'Toggle navigation menu', 'captain-social-feed' ) }
                    aria-expanded={ mobileOpen }
                    data-label={ mobileOpen ? __( 'Close Menu', 'captain-social-feed' ) : __( 'Menu', 'captain-social-feed' ) }
                    onClick={ () => setMobileOpen( o => !o ) }
                >
                    { mobileOpen ? <IconClose /> : <IconHamburger /> }
                </button>
                { mobileOpen && <div className="capsf-nav-overlay" onClick={ closeMobile } aria-hidden="true" /> }
                <div className={ `capsf-navigation-sidebar capsf-navigation-sidebar--edit${ sidebarStateClass }${ mobileOpen ? ' capsf-nav--open' : '' }` }>

                {/* ── Logo ── */}
                <div className="capsf-navigation-sidebar-logo">
                    <span className="capsf-nav-logo-hover-area">
                        <span className="capsf-nav-logo-icon"><LogoSVG theme={ theme } customIcon={ customLogoIcon } /></span>
                        {/* Only relevant/visible in the collapsed rail - hovering
                            the logo there reveals this to expand back. */}
                        <button
                            type="button"
                            className="capsf-nav-collapse-btn capsf-nav-collapse-btn--overlay"
                            title={ __( 'Expand sidebar', 'captain-social-feed' ) }
                            aria-label={ __( 'Expand sidebar', 'captain-social-feed' ) }
                            onClick={ () => dispatch( toggleSidebar() ) }
                        >
                            <IconSidebarToggle collapsed={ sidebarCollapsed } />
                        </button>
                    </span>
                    <h3>{ displayName }</h3>
                    {/* Static, always-visible - the expanded-state collapse
                        control (no more hover-over-logo to reveal it). */}
                    <button
                        type="button"
                        className="capsf-nav-collapse-btn capsf-nav-collapse-btn--inline"
                        title={ __( 'Collapse sidebar', 'captain-social-feed' ) }
                        aria-label={ __( 'Collapse sidebar', 'captain-social-feed' ) }
                        onClick={ () => dispatch( toggleSidebar() ) }
                    >
                        <IconSidebarToggle />
                    </button>
                </div>

                {/* ── Menu ── */}
                <nav className="capsf-navigation-sidebar-menu">

                    <Link to="/" className="capsf-nav-link">
                        <span className="capsf-nav-icon"><IconDashboard /></span>
                        <span className="capsf-nav-label">{ __( 'Dashboard', 'captain-social-feed' ) }</span>
                    </Link>

                    { ! isHidden( 'create' ) && (
                        <Link to="/create" className="capsf-nav-link">
                            <span className="capsf-nav-icon"><IconCreate /></span>
                            <span className="capsf-nav-label">{ __( 'Create Feed', 'captain-social-feed' ) }</span>
                        </Link>
                    ) }

                    { ! isHidden( 'settings' ) && (
                        <Link to="/settings" className="capsf-nav-link">
                            <span className="capsf-nav-icon"><IconSettings /></span>
                            <span className="capsf-nav-label">{ __( 'Settings', 'captain-social-feed' ) }</span>
                        </Link>
                    ) }

                    <div className="capsf-nav-group">
                        <button
                            className={ `capsf-nav-group-header ${ generalOpen ? 'capsf-nav-group-header--open' : '' }` }
                            onClick={ () => setGeneralOpen( o => !o ) }
                        >
                            <span className="capsf-nav-group-label">{ __( 'General', 'captain-social-feed' ) }</span>
                            <span className="capsf-nav-group-chevron"><IconChevron open={ generalOpen } /></span>
                        </button>
                        { ( generalOpen || sidebarCollapsed ) && (
                            <div className="capsf-nav-group-items">
                                { ! isHidden( 'mcp' ) && (
                                    <Link to="/mcp" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconAiTools /></span>
                                        <span>{ __( 'MCP', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                                { ! isHidden( 'docs' ) && (
                                    <Link to="/docs/how-to-use" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconDocs /></span>
                                        <span>{ __( 'Documentation', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                            </div>
                        ) }
                    </div>

                    <div className="capsf-nav-group">
                        <button
                            className={ `capsf-nav-group-header ${ extraOpen ? 'capsf-nav-group-header--open' : '' }` }
                            onClick={ () => setExtraOpen( o => !o ) }
                        >
                            <span className="capsf-nav-group-label">{ __( 'Extra Options', 'captain-social-feed' ) }</span>
                            <span className="capsf-nav-group-chevron"><IconChevron open={ extraOpen } /></span>
                        </button>
                        { ( extraOpen || sidebarCollapsed ) && (
                            <div className="capsf-nav-group-items">
                                { ! isHidden( 'help' ) && (
                                    <Link to="/help" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconHelp /></span>
                                        <span>{ __( 'Help', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                                { ! isHidden( 'rollback' ) && (
                                    <Link to="/rollback" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconRollback /></span>
                                        <span>{ __( 'Roll Back', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                                { ! isHidden( 'white-label' ) && (
                                    <Link to="/white-label" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconWhiteLabel /></span>
                                        <span>{ __( 'White Label', 'captain-social-feed' ) }</span>
                                        { ! isPro && <ProBadge /> }
                                    </Link>
                                ) }
                                { ! isHidden( 'our-products' ) && (
                                    <Link to="/our-products" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconProducts /></span>
                                        <span>{ __( 'Our Products', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                                { ! isPro && ! isHidden( 'upgrade' ) && (
                                    <Link to="/upgrade" className="capsf-nav-sublink">
                                        <span className="capsf-nav-icon"><IconUpgrade /></span>
                                        <span>{ __( 'Upgrade', 'captain-social-feed' ) }</span>
                                    </Link>
                                ) }
                            </div>
                        ) }
                    </div>

                </nav>

                <UpgradeProCard />

                <div className="capsf-navigation-sidebar-footer">
                    <span className="capsf-nav-version">
                        { __( 'VERSION', 'captain-social-feed' ) } : { PLUGIN_VERSION }
                    </span>
                    <ThemeToggle theme={ theme } dispatch={ dispatch } />
                </div>

                </div>
            </>
        );
    }

    return (
        <>
            <button
                className={ `capsf-hamburger${ mobileOpen ? ' capsf-hamburger--hidden' : '' }` }
                aria-label={ __( 'Toggle navigation menu', 'captain-social-feed' ) }
                aria-expanded={ mobileOpen }
                onClick={ () => setMobileOpen( o => !o ) }
            >
                { mobileOpen ? <IconClose /> : <IconHamburger /> }
            </button>
            { mobileOpen && <div className="capsf-nav-overlay" onClick={ closeMobile } aria-hidden="true" /> }
            <div className={ `capsf-navigation-sidebar${ sidebarStateClass }${ mobileOpen ? ' capsf-nav--open' : '' }` }>

            {/* ── Logo ── */}
            <div className="capsf-navigation-sidebar-logo">
                <span className="capsf-nav-logo-hover-area">
                    <span className="capsf-nav-logo-icon"><LogoSVG theme={ theme } customIcon={ customLogoIcon } /></span>
                    {/* Only relevant/visible in the collapsed rail - hovering
                        the logo there reveals this to expand back. */}
                    <button
                        type="button"
                        className="capsf-nav-collapse-btn capsf-nav-collapse-btn--overlay"
                        title={ __( 'Expand sidebar', 'captain-social-feed' ) }
                        aria-label={ __( 'Expand sidebar', 'captain-social-feed' ) }
                        onClick={ () => dispatch( toggleSidebar() ) }
                    >
                        <IconSidebarToggle collapsed={ sidebarCollapsed } />
                    </button>
                </span>
                <h3>{ displayName }</h3>
                {/* Static, always-visible - the expanded-state collapse
                    control (no more hover-over-logo to reveal it). */}
                <button
                    type="button"
                    className="capsf-nav-collapse-btn capsf-nav-collapse-btn--inline"
                    title={ __( 'Collapse sidebar', 'captain-social-feed' ) }
                    aria-label={ __( 'Collapse sidebar', 'captain-social-feed' ) }
                    onClick={ () => dispatch( toggleSidebar() ) }
                >
                    <IconSidebarToggle />
                </button>
            </div>

            {/* ── Menu ── */}
            <nav className="capsf-navigation-sidebar-menu">

                <Link to="/" className={ linkClass( '/' ) } onClick={ closeMobile }>
                    <span className="capsf-nav-icon"><IconDashboard /></span>
                    <span className="capsf-nav-label">{ __( 'Dashboard', 'captain-social-feed' ) }</span>
                </Link>

                { ! isHidden( 'create' ) && (
                    <Link to="/create" className={ linkClass( '/create' ) } onClick={ closeMobile }>
                        <span className="capsf-nav-icon"><IconCreate /></span>
                        <span className="capsf-nav-label">{ __( 'Create Feed', 'captain-social-feed' ) }</span>
                    </Link>
                ) }

                { ! isHidden( 'settings' ) && (
                    <Link to="/settings" className={ linkClass( '/settings' ) } onClick={ closeMobile }>
                        <span className="capsf-nav-icon"><IconSettings /></span>
                        <span className="capsf-nav-label">{ __( 'Settings', 'captain-social-feed' ) }</span>
                    </Link>
                ) }

                {/* ── General accordion ── */}
                <div className="capsf-nav-group">
                    <button
                        className={ `capsf-nav-group-header ${ generalOpen ? 'capsf-nav-group-header--open' : '' }` }
                        onClick={ () => setGeneralOpen( o => !o ) }
                    >
                        <span className="capsf-nav-group-label">{ __( 'General', 'captain-social-feed' ) }</span>
                        <span className="capsf-nav-group-chevron"><IconChevron open={ generalOpen } /></span>
                    </button>

                    { ( generalOpen || sidebarCollapsed ) && (
                        <div className="capsf-nav-group-items">
                            { ! isHidden( 'mcp' ) && (
                                <Link to="/mcp" className={ subLinkClass( '/mcp' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconAiTools /></span>
                                    <span>{ __( 'MCP', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                            { ! isHidden( 'docs' ) && (
                                <Link to="/docs/how-to-use" className={ subLinkClass( '/docs' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconDocs /></span>
                                    <span>{ __( 'Documentation', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                        </div>
                    ) }
                </div>

                {/* ── Extra Options accordion ── */}
                <div className="capsf-nav-group">
                    <button
                        className={ `capsf-nav-group-header ${ extraOpen ? 'capsf-nav-group-header--open' : '' }` }
                        onClick={ () => setExtraOpen( o => !o ) }
                    >
                        <span className="capsf-nav-group-label">{ __( 'Extra Options', 'captain-social-feed' ) }</span>
                        <span className="capsf-nav-group-chevron"><IconChevron open={ extraOpen } /></span>
                    </button>

                    { ( extraOpen || sidebarCollapsed ) && (
                        <div className="capsf-nav-group-items">
                            { ! isHidden( 'help' ) && (
                                <Link to="/help" className={ subLinkClass( '/help' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconHelp /></span>
                                    <span>{ __( 'Help', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                            { ! isHidden( 'rollback' ) && (
                                <Link to="/rollback" className={ subLinkClass( '/rollback' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconRollback /></span>
                                    <span>{ __( 'Roll Back', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                            { ! isHidden( 'white-label' ) && (
                                <Link to="/white-label" className={ subLinkClass( '/white-label' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconWhiteLabel /></span>
                                    <span>{ __( 'White Label', 'captain-social-feed' ) }</span>
                                    { ! isPro && <ProBadge /> }
                                </Link>
                            ) }
                            { ! isHidden( 'our-products' ) && (
                                <Link to="/our-products" className={ subLinkClass( '/our-products' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconProducts /></span>
                                    <span>{ __( 'Our Products', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                            { ! isPro && ! isHidden( 'upgrade' ) && (
                                <Link to="/upgrade" className={ subLinkClass( '/upgrade' ) } onClick={ closeMobile }>
                                    <span className="capsf-nav-icon"><IconUpgrade /></span>
                                    <span>{ __( 'Upgrade', 'captain-social-feed' ) }</span>
                                </Link>
                            ) }
                        </div>
                    ) }
                </div>

            </nav>

            <UpgradeProCard />

            {/* ── Footer version ── */}
            <div className="capsf-navigation-sidebar-footer">
                <span className="capsf-nav-version">
                    { __( 'VERSION', 'captain-social-feed' ) } : { PLUGIN_VERSION }
                </span>
                <ThemeToggle theme={ theme } dispatch={ dispatch } />
            </div>

            </div>
        </>
    );
};

export default Navigation;
