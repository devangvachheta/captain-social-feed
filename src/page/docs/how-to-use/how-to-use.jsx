import React from 'react';
import { __ } from '@wordpress/i18n';

const HowToUse = () => {
    return (
        <article className="capsf-doc-article">
            <div className="capsf-doc-article-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                { __( 'Usage Guide', 'captain-social-feed' ) }
            </div>

            <h1 className="capsf-doc-article-title">
                { __( 'How to Add a Feed to Your Site', 'captain-social-feed' ) }
            </h1>
            <p className="capsf-doc-article-intro">
                { __( 'Once you have created a feed from "Create Feed", there are three ways to place it on your website: paste the shortcode, drag the widget in Elementor, or drag the block in Gutenberg. Pick whichever matches the page builder you use.', 'captain-social-feed' ) }
            </p>

            {/* Method 1: Shortcode */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 16px' }}>
                { __( 'Method 1: Using the Shortcode', 'captain-social-feed' ) }
            </h3>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Open the Dashboard', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Go to the plugin\'s "Dashboard" screen where all your created feeds are listed in a table.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Copy the Shortcode', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Each row shows a ready-made shortcode for that feed. Click the copy icon next to it to copy it to your clipboard.', 'captain-social-feed' ) }</p>
                        <div className="capsf-doc-code">
                            <code>[captain-social-feed id="1"]</code>
                        </div>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Paste It Anywhere', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Paste the shortcode into any WordPress page, post, or a Shortcode/HTML block in any page builder. The feed will render there on the front end.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            </div>

            <hr className="capsf-doc-divider" />

            {/* Method 2: Elementor */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 16px' }}>
                { __( 'Method 2: Using the Elementor Widget', 'captain-social-feed' ) }
            </h3>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Edit a Page with Elementor', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Open the page you want to add the feed to and click "Edit with Elementor".', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Search for "Captain Social Feed"', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'In the Elementor widget panel on the left, search for "Captain Social Feed". It appears as its own widget.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Drag It onto the Page', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Drag the widget onto any section of the page, just like any other Elementor widget.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">4</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Select the Feed', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'In the widget\'s settings panel, choose which of your created feeds to display from the dropdown, then update the page.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            </div>

            <hr className="capsf-doc-divider" />

            {/* Method 3: Gutenberg */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 16px' }}>
                { __( 'Method 3: Using the Gutenberg Block', 'captain-social-feed' ) }
            </h3>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Open the Block Editor', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Edit the page or post using the default WordPress block editor (Gutenberg).', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Add the "Captain Social Feed" Block', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Click the "+" button to add a new block, search for "Captain Social Feed", and select it - or drag it into place from the block inserter.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Select the Feed from the Panel', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'With the block selected, use the "Feed Settings" panel on the right to choose which feed to display, then publish or update the page.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            </div>

            <hr className="capsf-doc-divider" />

            <div className="capsf-doc-tip" style={{ marginTop: '12px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p><strong>{ __( 'Tip:', 'captain-social-feed' ) }</strong> { __( 'All three methods display the exact same feed and settings - pick whichever fits your workflow. Any changes you make later to the feed in "Create Feed" will automatically reflect everywhere it is placed.', 'captain-social-feed' ) }</p>
            </div>
        </article>
    );
};

export default HowToUse;
