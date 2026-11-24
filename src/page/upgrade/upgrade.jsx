import React from 'react';
import { __ } from '@wordpress/i18n';
import { CAPSF_PRO_URL_PRICING_TABLE } from '../../constants/pro.js';
import './upgrade.scss';

const isPro = typeof capsf_data !== 'undefined' && !! capsf_data?.capsfpro_active;

const PRICING_URL = CAPSF_PRO_URL_PRICING_TABLE;

// true  = included
// false = not included
// 'text'= a custom label instead of a check/cross (e.g. support tiers)
const FEATURES = [
    { label: __( 'Instagram, Facebook, X (Twitter), Threads & Pinterest feeds', 'captain-social-feed' ), free: true,  pro: true  },
    { label: __( 'Multiple card layouts (Social Post, Simple Grid, Classic, Reel, Playlist)', 'captain-social-feed' ), free: true,  pro: true  },
    { label: __( 'Elementor widget & Gutenberg block', 'captain-social-feed' ),                           free: true,  pro: true  },
    { label: __( 'Click Action (Open Post, Lightbox Popup, Inline Player)', 'captain-social-feed' ),      free: true,  pro: true  },
    { label: __( 'Responsive controls & styling (Desktop, Tablet, Mobile)', 'captain-social-feed' ),     free: true,  pro: true  },
    { label: __( 'Automatic token refresh for Instagram & Threads', 'captain-social-feed' ),             free: true,  pro: true  },
    { label: __( 'White Label - custom plugin name & menu icons', 'captain-social-feed' ),               free: false, pro: true  },
    { label: __( 'Hide menu items from the dashboard sidebar', 'captain-social-feed' ),                  free: false, pro: true  },
    { label: __( 'Hide plugin from the Plugins list', 'captain-social-feed' ),                           free: false, pro: true  },
    { label: __( 'Support', 'captain-social-feed' ),                                                      free: __( 'WordPress.org', 'captain-social-feed' ), pro: __( 'Priority Support', 'captain-social-feed' ) },
];

const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);
const IconCross = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const Cell = ( { value, variant } ) => {
    if ( typeof value === 'string' ) {
        return <span className="capsf-up-cell-text">{ value }</span>;
    }
    return value
        ? <span className={ `capsf-up-icon capsf-up-icon--yes capsf-up-icon--${ variant }` }><IconCheck /></span>
        : <span className="capsf-up-icon capsf-up-icon--no"><IconCross /></span>;
};

const Upgrade = () => {

    // Nothing to upsell once Pro is already active.
    if ( isPro ) {
        return (
            <div className="capsf-up-wrapper">
                <div className="capsf-up-header">
                    <h1 className="capsf-up-title">{ __( 'Upgrade Now', 'captain-social-feed' ) }</h1>
                    <p className="capsf-up-subtitle">
                        { __( 'You\u2019re already on Pro - thanks for supporting the plugin!', 'captain-social-feed' ) }
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="capsf-up-wrapper">
            <div className="capsf-up-header">
                <div>
                    <h1 className="capsf-up-title">{ __( 'Upgrade Now', 'captain-social-feed' ) }</h1>
                    <p className="capsf-up-subtitle">
                        { __( 'Here\u2019s exactly what changes if you upgrade - nothing hidden.', 'captain-social-feed' ) }
                    </p>
                </div>
                <a className="capsf-up-cta" href={ PRICING_URL } target="_blank" rel="noopener noreferrer">
                    { __( 'Upgrade Now', 'captain-social-feed' ) }
                </a>
            </div>

            <div className="capsf-up-table">
                <div className="capsf-up-row capsf-up-row--head">
                    <div className="capsf-up-col capsf-up-col--feature">{ __( 'Feature', 'captain-social-feed' ) }</div>
                    <div className="capsf-up-col capsf-up-col--free">{ __( 'Free', 'captain-social-feed' ) }</div>
                    <div className="capsf-up-col capsf-up-col--pro">{ __( 'Pro', 'captain-social-feed' ) }</div>
                </div>

                { FEATURES.map( ( row, i ) => (
                    <div className="capsf-up-row" key={ i }>
                        <div className="capsf-up-col capsf-up-col--feature">{ row.label }</div>
                        <div className="capsf-up-col capsf-up-col--free"><Cell value={ row.free } variant="free" /></div>
                        <div className="capsf-up-col capsf-up-col--pro"><Cell value={ row.pro } variant="pro" /></div>
                    </div>
                ) ) }

                <div className="capsf-up-row capsf-up-row--footer">
                    <div className="capsf-up-col capsf-up-col--feature" />
                    <div className="capsf-up-col capsf-up-col--free" />
                    <div className="capsf-up-col capsf-up-col--pro">
                        <a className="capsf-up-cta capsf-up-cta--table" href={ PRICING_URL } target="_blank" rel="noopener noreferrer">
                            { __( 'Upgrade Now', 'captain-social-feed' ) }
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upgrade;
