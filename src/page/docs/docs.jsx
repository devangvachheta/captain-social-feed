import React from 'react';
import { __ } from '@wordpress/i18n';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import './docs.scss';
import HowToUse from './how-to-use/how-to-use.jsx';
import CustomizeFeed from './customize-feed/customize-feed.jsx';
import InstagramAccessToken from './instagram-access-token/instagram-access-token.jsx';
import FacebookAccessToken from './facebook-access-token/facebook-access-token.jsx';
import TwitterBearerToken from './twitter-bearer-token/twitter-bearer-token.jsx';
import ThreadsAccessToken from './threads-access-token/threads-access-token.jsx';
import PinterestAccessToken from './pinterest-access-token/pinterest-access-token.jsx';
import McpIntegration from './mcp-integration/mcp-integration.jsx';
import ProBanner from '../../components/pro_banner/pro_banner.jsx';

const DOC_LINKS = [
    { path: '/docs/how-to-use',              label: __( 'How to Use (Shortcode / Elementor / Gutenberg)', 'captain-social-feed' ), icon: null },
    { path: '/docs/customize-feed',          label: __( 'Customize Your Feed (Layouts, Sliders, Styles, Cache)', 'captain-social-feed' ), icon: null },
    { path: '/docs/instagram-access-token',  label: __( 'Instagram Access Token', 'captain-social-feed' ), icon: 'instagram.svg' },
    { path: '/docs/facebook-access-token',   label: __( 'Facebook Page Access Token', 'captain-social-feed' ), icon: 'facebook.svg' },
    { path: '/docs/twitter-bearer-token',    label: __( 'Twitter / X Feeds (Token, Free vs Paid)', 'captain-social-feed' ), icon: 'twitter.svg' },
    { path: '/docs/threads-access-token',    label: __( 'Threads Access Token', 'captain-social-feed' ), icon: 'threads.svg' },
    { path: '/docs/pinterest-access-token',  label: __( 'Pinterest Access Token', 'captain-social-feed' ), icon: 'pinterest.svg' },
    { path: '/docs/mcp-integration',         label: __( 'Connecting AI Assistants (MCP)', 'captain-social-feed' ), icon: null },
];

const DocsSidebar = () => {
    const location = useLocation();
    const iconBase = ( typeof capsf_data !== 'undefined' ? capsf_data.plugin_url : '' ) + 'assets/svg/social/';
    return (
        <aside className="capsf-docs-sidebar">
            <p className="capsf-docs-sidebar-heading">{ __( 'Guides', 'captain-social-feed' ) }</p>
            { DOC_LINKS.map( ( doc, i ) => (
                <Link
                    key={ i }
                    to={ doc.path }
                    className={ `capsf-docs-sidebar-link ${ location.pathname === doc.path ? 'capsf-docs-sidebar-link--active' : '' }` }
                >
                    { doc.icon && <img src={ iconBase + doc.icon } alt="" width="16" height="16" /> }
                    { doc.label }
                </Link>
            ) ) }
        </aside>
    );
};

const Docs = () => {
    return (
        <div className="capsf-docs-wrapper">
            <div className="capsf-docs-header">
                <h1 className="capsf-docs-title">{ __( 'Documentation', 'captain-social-feed' ) }</h1>
                <p className="capsf-docs-subtitle">{ __( 'Everything you need to set up and use Captain Social Feed.', 'captain-social-feed' ) }</p>
            </div>

            <div className="capsf-docs-layout">
                <DocsSidebar />
                <main className="capsf-docs-content">
                    <Routes>
                        <Route path="how-to-use"             element={ <HowToUse /> } />
                        <Route path="customize-feed"         element={ <CustomizeFeed /> } />
                        <Route path="instagram-access-token" element={ <InstagramAccessToken /> } />
                        <Route path="facebook-access-token"  element={ <FacebookAccessToken /> } />
                        <Route path="twitter-bearer-token"   element={ <TwitterBearerToken /> } />
                        <Route path="threads-access-token"   element={ <ThreadsAccessToken /> } />
                        <Route path="pinterest-access-token" element={ <PinterestAccessToken /> } />
                        <Route path="mcp-integration"        element={ <McpIntegration /> } />
                        <Route path="*"                      element={ <Navigate to="/docs/how-to-use" replace /> } />
                    </Routes>
                </main>
            </div>

            <ProBanner />
        </div>
    );
};

export default Docs;
