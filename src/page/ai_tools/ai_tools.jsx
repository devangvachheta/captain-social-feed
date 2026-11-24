import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Link } from 'react-router-dom';
import { useAttentionPing } from '../../context/AttentionPingContext.jsx';
import './ai_tools.scss';

const ABILITIES = [
    { key: 'list',      label: __( 'List Feeds', 'captain-social-feed' ),      desc: __( 'See every feed on this site. Read-only.', 'captain-social-feed' ), risk: 'read' },
    { key: 'get',        label: __( 'Get Feed', 'captain-social-feed' ),        desc: __( 'Read one feed\'s full settings - read-only.', 'captain-social-feed' ), risk: 'read' },
    { key: 'shortcode',  label: __( 'Get Shortcode', 'captain-social-feed' ),   desc: __( 'Fetch the embeddable shortcode for a feed. Read-only.', 'captain-social-feed' ), risk: 'read' },
    { key: 'diagnose',   label: __( 'Diagnose Feed', 'captain-social-feed' ),   desc: __( 'Check why a feed isn\'t showing posts - read-only.', 'captain-social-feed' ), risk: 'read' },
    { key: 'create',     label: __( 'Create Feed', 'captain-social-feed' ),     desc: __( 'Create a brand new feed.', 'captain-social-feed' ), risk: 'write' },
    { key: 'update',     label: __( 'Update Feed', 'captain-social-feed' ),     desc: __( 'Change an existing feed\'s settings.', 'captain-social-feed' ), risk: 'write' },
    { key: 'duplicate',  label: __( 'Duplicate Feed', 'captain-social-feed' ),  desc: __( 'Copy an existing feed under a new name.', 'captain-social-feed' ), risk: 'write' },
    { key: 'delete',     label: __( 'Delete Feed', 'captain-social-feed' ),     desc: __( 'Permanently remove a feed. Cannot be undone.', 'captain-social-feed' ), risk: 'destructive' },
];

const AiTools = () => {
    const abilitiesSupported = typeof capsf_data !== 'undefined' && !!capsf_data.abilities_supported;
    const adapterActive      = typeof capsf_data !== 'undefined' && !!capsf_data.mcp_adapter_active;

    const [mcpEnabled,   setMcpEnabled]   = useState( false );
    const [flags,        setFlags]        = useState( {} ); // { create: true, delete: false, ... }
    const [loaded,       setLoaded]       = useState( false );
    const [savingKey,    setSavingKey]    = useState( '' );

    // Points a user who clicks a locked per-ability toggle back at the
    // master switch: scrolls it into view, pulses it, and shows a short
    // tooltip explaining why nothing happened. See handleAbilityToggle().
    const { targetRef: masterSwitchRef, highlighted: masterPinged, ping } = useAttentionPing();

    useEffect( () => {
        const formData = new FormData();
        formData.append( 'action', 'capsf_dashboard_ajax_call' );
        formData.append( 'nonce',  capsf_data.capsf_nonce );
        formData.append( 'type',   'get_global_settings' );

        fetch( capsf_data.ajax_url, { method: 'POST', body: formData } )
            .then( r => r.json() )
            .then( result => {
                if ( result.success && result.data ) {
                    const d = result.data;
                    // Master switch defaults to OFF - only 'true' turns it on (matches
                    // the PHP-side default in class-capsf-abilities.php::is_enabled()).
                    setMcpEnabled( d.mcp_enabled === 'true' );
                    const next = {};
                    ABILITIES.forEach( a => {
                        const raw = d[ 'mcp_ability_' + a.key ];
                        next[ a.key ] = a.risk === 'read'
                            ? ( raw === undefined || raw !== 'false' )   // read-only: on unless explicitly off
                            : raw === 'true';                            // write/destructive: off unless explicitly on
                    } );
                    setFlags( next );
                }
                setLoaded( true );
            } )
            .catch( () => setLoaded( true ) );
    }, [] );

    const saveSetting = async ( key, value ) => {
        const formData = new FormData();
        formData.append( 'action', 'capsf_dashboard_ajax_call' );
        formData.append( 'nonce',  capsf_data.capsf_nonce );
        formData.append( 'type',   'set_global_setting' );
        formData.append( 'key',    key );
        formData.append( 'value',  value ? 'true' : 'false' );
        await fetch( capsf_data.ajax_url, { method: 'POST', body: formData } );
    };

    const handleMasterToggle = async () => {
        const next = ! mcpEnabled;
        setMcpEnabled( next );
        setSavingKey( 'mcp_enabled' );
        await saveSetting( 'mcp_enabled', next );
        setSavingKey( '' );
    };

    const handleAbilityToggle = async ( key ) => {
        if ( ! mcpEnabled ) {
            ping( __( 'Turn this on first to unlock individual abilities', 'captain-social-feed' ) );
            return;
        }
        const next = ! flags[ key ];
        setFlags( f => ( { ...f, [ key ]: next } ) );
        setSavingKey( key );
        await saveSetting( 'mcp_ability_' + key, next );
        setSavingKey( '' );
    };

    return (
        <div className="capsf-settings-wrapper capsf-ai-tools">

            <div className="capsf-settings-header">
                <h1 className="capsf-settings-title">{ __( 'MCP', 'captain-social-feed' ) }</h1>
                <p className="capsf-settings-subtitle">
                    { __( 'Let AI assistants like Claude or Cursor create and manage your social feeds through natural language, via the WordPress Abilities API.', 'captain-social-feed' ) }
                    { ' ' }
                    <Link to="/docs/mcp-integration">{ __( 'Read the full guide', 'captain-social-feed' ) }</Link>
                </p>
            </div>

            {/* ── Compatibility status ─────────────────────────────── */}
            { ! abilitiesSupported ? (
                <div className="capsf-ai-banner capsf-ai-banner--warn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    <div>
                        <strong>{ __( 'Requires WordPress 6.9 or newer.', 'captain-social-feed' ) }</strong>
                        <p>{ __( 'This site\'s WordPress version doesn\'t include the Abilities API yet. Update WordPress to use MCP. Nothing else in the plugin is affected.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            ) : ! adapterActive ? (
                <div className="capsf-ai-banner capsf-ai-banner--info">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    <div>
                        <strong>{ __( 'Abilities are registered and ready.', 'captain-social-feed' ) }</strong>
                        <p>
                            { __( 'To connect Claude, Cursor, or another AI client, install an MCP bridge plugin. The easiest option, ', 'captain-social-feed' ) }
                            <a href="https://wordpress.org/plugins/easy-mcp-ai/" target="_blank" rel="noopener noreferrer">{ __( 'Easy MCP AI', 'captain-social-feed' ) }</a>
                            { __( ', installs normally from the WordPress.org plugin directory and works with any plugin\'s registered abilities, including this one. Alternatively, the official ', 'captain-social-feed' ) }
                            <a href="https://github.com/WordPress/mcp-adapter/releases" target="_blank" rel="noopener noreferrer">{ __( 'WordPress MCP Adapter', 'captain-social-feed' ) }</a>
                            { __( ' isn\'t on WordPress.org yet - download it from GitHub Releases and upload it under Plugins → Add New → Upload Plugin. Either way, this plugin doesn\'t bundle one, so it stays optional.', 'captain-social-feed' ) }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="capsf-ai-banner capsf-ai-banner--ok">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                    <div>
                        <strong>{ __( 'MCP active', 'captain-social-feed' ) }</strong>
                        <p>{ __( 'The MCP Adapter is installed. Any connected AI client can already use the abilities enabled below.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            ) }

            <div className="capsf-settings-sections">

                {/* ── Master switch ─────────────────────────────────── */}
                <div className="capsf-settings-section">
                    <div className="capsf-settings-section-header">
                        <div className="capsf-settings-section-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="capsf-settings-section-title">{ __( 'AI Access', 'captain-social-feed' ) }</h2>
                            <p className="capsf-settings-section-desc">{ __( 'Master switch for every ability below. Turn this off to fully block AI clients from this plugin.', 'captain-social-feed' ) }</p>
                        </div>
                    </div>
                    <div className="capsf-settings-section-body">
                        <div className="capsf-settings-toggle-row">
                            <div className="capsf-settings-toggle-info">
                                <span className="capsf-settings-cache-label">{ __( 'Enable AI Abilities', 'captain-social-feed' ) }</span>
                                <span className="capsf-settings-cache-hint">{ __( 'Only logged-in users with the "manage_options" capability can ever be acted on behalf of, same as this Settings page.', 'captain-social-feed' ) }</span>
                            </div>
                            <button
                                ref={ masterSwitchRef }
                                className={ `capsf-switcher ${ mcpEnabled ? 'capsf-switcher--on' : '' }${ masterPinged ? ' capsf-switcher--pinged' : '' }` }
                                onClick={ handleMasterToggle }
                                aria-pressed={ mcpEnabled }
                                disabled={ ! loaded || savingKey === 'mcp_enabled' }
                            >
                                <span className="capsf-switcher-thumb" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Per-ability toggles ──────────────────────────── */}
                <div className={ `capsf-settings-section${ ! mcpEnabled ? ' capsf-ai-tools-disabled' : '' }` }>
                    <div className="capsf-settings-section-header">
                        <div className="capsf-settings-section-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="capsf-settings-section-title">{ __( 'Abilities', 'captain-social-feed' ) }</h2>
                            <p className="capsf-settings-section-desc">{ __( 'Turn individual abilities on or off. Read-only abilities (List, Get, Get Shortcode, Diagnose) are on by default, since they can\'t change anything. Write and Destructive abilities (Create, Update, Duplicate, Delete) are off by default and only take effect once you switch them on here.', 'captain-social-feed' ) }</p>
                        </div>
                    </div>
                    <div className="capsf-settings-section-body">
                        { ABILITIES.map( ( a, i ) => (
                            <div key={ a.key } className={ `capsf-settings-toggle-row${ i < ABILITIES.length - 1 ? ' capsf-settings-row--border' : '' }` }>
                                <div className="capsf-settings-toggle-info">
                                    <span className="capsf-settings-cache-label">
                                        { a.label }
                                        <span className={ `capsf-ai-risk-badge capsf-ai-risk-badge--${ a.risk }` }>
                                            { a.risk === 'read' && __( 'Read-only', 'captain-social-feed' ) }
                                            { a.risk === 'write' && __( 'Write', 'captain-social-feed' ) }
                                            { a.risk === 'destructive' && __( 'Destructive', 'captain-social-feed' ) }
                                        </span>
                                    </span>
                                    <span className="capsf-settings-cache-hint">{ a.desc }</span>
                                </div>
                                <button
                                    className={ `capsf-switcher ${ flags[ a.key ] && mcpEnabled ? 'capsf-switcher--on' : '' }${ a.risk === 'destructive' ? ' capsf-switcher--danger' : '' }${ ! mcpEnabled ? ' capsf-switcher--locked' : '' }` }
                                    onClick={ () => handleAbilityToggle( a.key ) }
                                    aria-pressed={ !! flags[ a.key ] }
                                    aria-disabled={ ! mcpEnabled }
                                    disabled={ ! loaded || savingKey === a.key }
                                >
                                    <span className="capsf-switcher-thumb" />
                                </button>
                            </div>
                        ) ) }
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AiTools;
