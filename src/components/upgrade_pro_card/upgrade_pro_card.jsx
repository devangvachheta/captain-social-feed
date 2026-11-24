import React from 'react';
import { __ } from '@wordpress/i18n';
import { CAPSF_PRO_URL_BANNER } from '../../constants/pro.js';
import './upgrade_pro_card.scss';

const isPro = typeof capsf_data !== 'undefined' && !! capsf_data?.capsfpro_active;

const IconCrown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 18.5h19l1-9-5.5 4-4-7-4 7-5.5-4 1 9Z"/>
        <rect x="2.5" y="19.5" width="19" height="2" rx="1"/>
    </svg>
);

/* ── "Upgrade to Pro" card - the sidebar's single upgrade CTA, free users
 *    only. Links straight out to Gumroad rather than the internal /upgrade
 *    page, so it works as a one-click purchase CTA from wherever the person
 *    happens to be in the plugin. Self-contained (own isPro check, own
 *    styles) so it can be dropped into the sidebar footer - or anywhere
 *    else later - without the caller needing to guard it. ──────────────── */
const UpgradeProCard = () => {
    if ( isPro ) return null

    return (
        <a
            className="capsf-upgrade-pro-card"
            href={ CAPSF_PRO_URL_BANNER }
            target="_blank"
            rel="noopener noreferrer"
        >
            <div className="capsf-upgrade-pro-card-top">
                <span className="capsf-upgrade-pro-card-icon"><IconCrown /></span>
                <div className="capsf-upgrade-pro-card-text">
                    <span className="capsf-upgrade-pro-card-title">
                        { __( 'Upgrade to Pro', 'captain-social-feed' ) }
                    </span>
                    <span className="capsf-upgrade-pro-card-subtitle">
                        { __( 'Unlock Unlimited Power', 'captain-social-feed' ) }
                    </span>
                </div>
            </div>
            <span className="capsf-upgrade-pro-card-btn">
                { __( 'Upgrade Now', 'captain-social-feed' ) } <span aria-hidden="true">&rarr;</span>
            </span>
        </a>
    );
};

export default UpgradeProCard;
