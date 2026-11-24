import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

const CopyButton = ( { text } ) => {
    const [ copied, setCopied ] = useState( false );
    const handleCopy = () => {
        navigator.clipboard.writeText( text ).then( () => {
            setCopied( true );
            setTimeout( () => setCopied( false ), 2000 );
        } );
    };
    return (
        <button className="capsf-doc-code-copy" onClick={ handleCopy }>
            { copied ? __( 'Copied!', 'captain-social-feed' ) : __( 'Copy', 'captain-social-feed' ) }
        </button>
    );
};

const ThreadsAccessToken = () => {
    return (
        <article className="capsf-doc-article">
            <img src={ (typeof capsf_data !== 'undefined' ? capsf_data.plugin_url : '') + "assets/svg/social/threads.svg" } alt="" width="40" height="40" className="capsf-doc-platform-logo" />
            <div className="capsf-doc-article-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                { __( 'Setup Guide', 'captain-social-feed' ) }
            </div>

            <h1 className="capsf-doc-article-title">
                { __( 'How to Get a Threads Access Token', 'captain-social-feed' ) }
            </h1>
            <p className="capsf-doc-article-intro">
                { __( 'Captain Social Feed uses the official Threads API (by Meta) to fetch your posts. You need a long-lived Access Token and your Threads User ID.', 'captain-social-feed' ) }
            </p>

            <div className="capsf-doc-steps">

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Create a Meta App with the Threads Use Case', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Go to Meta for Developers, create a new app, and add the "Threads API" use case to it.', 'captain-social-feed' ) }</p>
                        <div className="capsf-doc-code">
                            <code>https://developers.facebook.com/apps/</code>
                            <CopyButton text="https://developers.facebook.com/apps/" />
                        </div>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Authorize Your Threads Account', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Use the Threads API\'s OAuth authorization flow to log in with your Threads account and grant the "threads_basic" permission.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Exchange for a Long-Lived Token', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'The initial token is short-lived. Exchange it for a long-lived token (valid ~60 days) via the token exchange endpoint.', 'captain-social-feed' ) }</p>
                        <div className="capsf-doc-warning">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <p>{ __( 'Long-lived tokens still expire after ~60 days and need refreshing periodically.', 'captain-social-feed' ) }</p>
                        </div>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">4</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Find Your Threads User ID', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Query the "/me" endpoint with your access token to get your numeric Threads User ID.', 'captain-social-feed' ) }</p>
                        <div className="capsf-doc-code">
                            <code>GET /me?fields=id,username</code>
                        </div>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">5</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Add Both to the Plugin', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'In WordPress admin, go to Captain Social Feed → Create Feed → Threads, then paste your Access Token and Threads User ID.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            </div>

            <div className="capsf-doc-tip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p><strong>{ __( 'Done!', 'captain-social-feed' ) }</strong> { __( 'Use "Test Connection" in the plugin to confirm it works before moving on.', 'captain-social-feed' ) }</p>
            </div>
        </article>
    );
};

export default ThreadsAccessToken;
