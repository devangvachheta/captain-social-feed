import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import './rollback.scss';

const PLUGIN_SLUG   = 'captain-social-feed';
const CURRENT_VER   = (typeof capsf_data !== 'undefined' && capsf_data?.capsf_version)
    ? capsf_data.capsf_version
    : '1.0.0';

// Fetch all versions from the WordPress.org SVN tags API
const fetchVersions = async () => {
    const res  = await fetch( `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${ PLUGIN_SLUG }&request[fields][versions]=1` );
    const data = await res.json();
    const versions = data?.versions ? Object.keys( data.versions ).filter( v => v !== 'trunk' ) : [];
    // Sort descending (newest first), take last 10
    return versions
        .sort( ( a, b ) => b.localeCompare( a, undefined, { numeric: true, sensitivity: 'base' } ) )
        .slice( 0, 10 );
};

const Rollback = () => {
    const [ versions,      setVersions      ] = useState( [] );
    const [ loading,       setLoading       ] = useState( true );
    const [ error,         setError         ] = useState( '' );
    const [ installing,    setInstalling    ] = useState( null );   // version string being installed
    const [ installStatus, setInstallStatus ] = useState( {} );     // { version: 'success'|'error'|'loading' }

    useEffect( () => {
        fetchVersions()
            .then( setVersions )
            .catch( () => setError( __( 'Could not fetch version list. Please check your internet connection.', 'captain-social-feed' ) ) )
            .finally( () => setLoading( false ) );
    }, [] );

    const handleInstall = async ( version ) => {
        if ( installing ) return;

        const confirmed = window.confirm(
            sprintf(
                /* translators: %s: Plugin version number */
                __( "This will install and activate version %s of Captain Social Feed.\n\nYour feeds and settings will not be affected.\n\nContinue?", 'captain-social-feed' ),
                version
            )
        );
        if ( ! confirmed ) return;

        setInstalling( version );
        setInstallStatus( prev => ( { ...prev, [ version ]: 'loading' } ) );

        const formData = new FormData();
        formData.append( 'action', 'capsf_dashboard_ajax_call' );
        formData.append( 'nonce',  capsf_data.capsf_nonce );
        formData.append( 'type',   'rollback_version' );
        formData.append( 'version', version );

        try {
            const res    = await fetch( capsf_data.ajax_url, { method: 'POST', body: formData } );
            const result = await res.json();

            if ( result.success ) {
                setInstallStatus( prev => ( { ...prev, [ version ]: 'success' } ) );
                // Reload after 2s so WP loads the new version
                setTimeout( () => { window.location.reload(); }, 2000 );
            } else {
                setInstallStatus( prev => ( { ...prev, [ version ]: 'error' } ) );
            }
        } catch {
            setInstallStatus( prev => ( { ...prev, [ version ]: 'error' } ) );
        } finally {
            setInstalling( null );
        }
    };

    const getButtonLabel = ( version ) => {
        const status = installStatus[ version ];
        if ( version === CURRENT_VER )  return __( 'Current Version', 'captain-social-feed' );
        if ( status === 'loading' )     return __( 'Installing…', 'captain-social-feed' );
        if ( status === 'success' )     return __( 'Installed! Reloading…', 'captain-social-feed' );
        if ( status === 'error' )       return __( 'Failed - Retry', 'captain-social-feed' );
        return __( 'Install & Activate', 'captain-social-feed' );
    };

    const getButtonClass = ( version ) => {
        const status = installStatus[ version ];
        if ( version === CURRENT_VER )  return 'capsf-rollback-btn capsf-rollback-btn--current';
        if ( status === 'success' )     return 'capsf-rollback-btn capsf-rollback-btn--success';
        if ( status === 'error' )       return 'capsf-rollback-btn capsf-rollback-btn--error';
        if ( status === 'loading' || installing === version )
                                        return 'capsf-rollback-btn capsf-rollback-btn--loading';
        return 'capsf-rollback-btn capsf-rollback-btn--install';
    };

    return (
        <div className="capsf-rollback-wrapper">
            <div className="capsf-rollback-header">
                <h1 className="capsf-rollback-title">{ __( 'Rollback', 'captain-social-feed' ) }</h1>
                <p className="capsf-rollback-subtitle">
                    { __( 'Downgrade or re-install a previous version of Captain Social Feed. Your feeds and settings will remain intact.', 'captain-social-feed' ) }
                </p>
            </div>

            {/* Current version badge */}
            <div className="capsf-rollback-current">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>
                    { __( 'Currently installed:', 'captain-social-feed' ) }
                    <strong> v{ CURRENT_VER }</strong>
                </span>
            </div>

            <div className="capsf-rollback-warning">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>{ __( 'Rolling back will replace the current plugin files. We recommend creating a backup before proceeding.', 'captain-social-feed' ) }</p>
            </div>

            {/* Version list */}
            <div className="capsf-rollback-list-wrap">
                <h2 className="capsf-rollback-list-title">{ __( 'Available Versions', 'captain-social-feed' ) }</h2>

                { loading && (
                    <div className="capsf-rollback-state">
                        <div className="capsf-rollback-spinner"></div>
                        <span>{ __( 'Fetching versions from WordPress.org…', 'captain-social-feed' ) }</span>
                    </div>
                ) }

                { error && (
                    <div className="capsf-rollback-state capsf-rollback-state--error">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        { error }
                    </div>
                ) }

                { ! loading && ! error && (
                    <div className="capsf-rollback-list">
                        { versions.map( ( version, i ) => (
                            <div
                                key={ version }
                                className={ `capsf-rollback-item ${ version === CURRENT_VER ? 'capsf-rollback-item--current' : '' }` }
                            >
                                <div className="capsf-rollback-item-left">
                                    <span className="capsf-rollback-item-num">{ i === 0 ? '🆕' : `#${ i + 1 }` }</span>
                                    <div>
                                        <span className="capsf-rollback-item-ver">v{ version }</span>
                                        { i === 0 && (
                                            <span className="capsf-rollback-item-latest">{ __( 'Latest', 'captain-social-feed' ) }</span>
                                        ) }
                                        { version === CURRENT_VER && (
                                            <span className="capsf-rollback-item-installed">{ __( 'Installed', 'captain-social-feed' ) }</span>
                                        ) }
                                    </div>
                                </div>
                                <button
                                    className={ getButtonClass( version ) }
                                    onClick={ () => handleInstall( version ) }
                                    disabled={ version === CURRENT_VER || installing !== null || installStatus[ version ] === 'success' }
                                >
                                    { getButtonLabel( version ) }
                                </button>
                            </div>
                        ) ) }
                    </div>
                ) }
            </div>

        </div>
    );
};

export default Rollback;
