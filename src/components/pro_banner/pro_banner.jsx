import React from 'react';
import { __ } from '@wordpress/i18n';
import { Link } from 'react-router-dom';
import { CAPSF_PRO_URL_BANNER } from '../../constants/pro.js';
import './pro_banner.scss';

const isPro = typeof capsf_data !== 'undefined' && !! capsf_data?.capsfpro_active;

const FEATURES = [
    __( 'More layout & style options',      'captain-social-feed' ),
    __( 'White Label - your own branding',  'captain-social-feed' ),
    __( 'Hide menu items from the sidebar', 'captain-social-feed' ),
    __( 'Priority support',                 'captain-social-feed' ),
]

/* ── Pro upsell banner - shown only on the free version, hidden the
 *    moment Pro is active. Own layout/colours (brand blue, not copied
 *    from any other plugin) - a feature checklist + CTA on the left,
 *    a simple layout-style preview grid on the right.
 *
 *    Placed explicitly at the bottom of specific pages (Documentation,
 *    Settings, Help, Roll Back, Our Products) - NOT on Dashboard or
 *    Create Feed, so it doesn't get in the way of the core workflow. ── */
const ProBanner = () => {
    if ( isPro ) return null

    return (
        <div className='capsf-pro-banner'>
            <div className='capsf-pro-banner-copy'>
                <span className='capsf-pro-banner-eyebrow'>{ __( 'CAPTAIN SOCIAL FEED - PRO', 'captain-social-feed' ) }</span>
                <h3 className='capsf-pro-banner-title'>
                    { __( 'Unlock every layout, every option.', 'captain-social-feed' ) }
                </h3>
                <p className='capsf-pro-banner-desc'>
                    { __( 'Get more layout styles, white labeling, and priority support - everything you need to make your feeds truly yours.', 'captain-social-feed' ) }
                </p>
                <ul className='capsf-pro-banner-features'>
                    { FEATURES.map( ( f, i ) => (
                        <li key={ i }>
                            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                <polyline points='20 6 9 17 4 12'/>
                            </svg>
                            { f }
                        </li>
                    ) ) }
                </ul>
                <div className='capsf-pro-banner-actions'>
                    <a className='capsf-pro-banner-cta' href={ CAPSF_PRO_URL_BANNER } target='_blank' rel='noopener noreferrer'>
                        { __( 'Upgrade Now', 'captain-social-feed' ) }
                    </a>
                    <Link className='capsf-pro-banner-link' to='/upgrade'>
                        { __( 'Compare Free vs Pro', 'captain-social-feed' ) }
                    </Link>
                </div>
            </div>
            <div className='capsf-pro-banner-visual' aria-hidden='true'>
                { [ 'Grid', 'Slider', 'Popup', 'Channel Profile' ].map( ( label, i ) => (
                    <div className='capsf-pro-banner-chip' key={ i }>
                        <span className='capsf-pro-banner-chip-dot' />
                        { label }
                    </div>
                ) ) }
            </div>
        </div>
    )
}

export default ProBanner;
