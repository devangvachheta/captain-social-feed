import React from 'react';
import { __ } from '@wordpress/i18n';
import { Link } from 'react-router-dom';

const McpIntegration = () => {
    return (
        <article className="capsf-doc-article">
            <div className="capsf-doc-article-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z"/>
                    <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/>
                </svg>
                { __( 'MCP Guide', 'captain-social-feed' ) }
            </div>

            <h1 className="capsf-doc-article-title">
                { __( 'Connecting AI Assistants (MCP)', 'captain-social-feed' ) }
            </h1>
            <p className="capsf-doc-article-intro">
                { __( 'Captain Social Feed can let AI assistants like Claude, Cursor, or ChatGPT create and manage your feeds through natural language, using WordPress\'s own Model Context Protocol (MCP) support. This page explains what that means, what it needs, and how to connect.', 'captain-social-feed' ) }
            </p>

            <div className="capsf-doc-info" style={{ marginTop: '4px', marginBottom: '24px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>
                    { __( 'This entire feature is optional. If you never connect an AI assistant, nothing about it affects the rest of the plugin. Every setting, feed type, and shortcode works exactly the same either way.', 'captain-social-feed' ) }
                </p>
            </div>

            <hr className="capsf-doc-divider" />

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 12px' }}>
                { __( 'How It Works', 'captain-social-feed' ) }
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--capsf-text-secondary)', lineHeight: '1.7', marginBottom: '12px' }}>
                { __( 'Captain Social Feed does not run its own MCP server, and it does not require any dedicated bridge app made specifically for this plugin. Instead, it registers its feed actions (list, create, update, duplicate, delete, and diagnose) as WordPress "Abilities", using the Abilities API that\'s built into WordPress core.', 'captain-social-feed' ) }
            </p>
            <p style={{ fontSize: '13px', color: 'var(--capsf-text-secondary)', lineHeight: '1.7', marginBottom: '12px' }}>
                { __( 'A separate, general-purpose "MCP bridge" plugin then exposes those abilities to any AI client. That bridge plugin isn\'t specific to Captain Social Feed - the same one works for every plugin on your site that registers abilities, so you only ever connect Claude to your site once, not once per plugin.', 'captain-social-feed' ) }
            </p>

            <div className="capsf-doc-tip" style={{ marginTop: '12px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p><strong>{ __( 'Why this matters:', 'captain-social-feed' ) }</strong> { __( 'You\'re never locked into a connector built and maintained by this plugin alone. You can swap the bridge plugin at any time, and any other WordPress plugin you install that also supports the Abilities API will show up in the same AI connection automatically.', 'captain-social-feed' ) }</p>
            </div>

            <hr className="capsf-doc-divider" />

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 12px' }}>
                { __( 'Requirements', 'captain-social-feed' ) }
            </h3>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'WordPress 6.9 or newer', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'The Abilities API shipped in WordPress core with version 6.9. On older WordPress versions, the MCP page will show a compatibility notice and no abilities are registered. Everything else in the plugin is unaffected. Check your version under Dashboard → Updates, and update WordPress if needed.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'An MCP bridge plugin', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Captain Social Feed doesn\'t bundle one, so you\'ll install one separately (see below). This is a one-time setup for your whole site.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'An admin account', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Every ability requires the "manage_options" capability, the same permission level needed to use this plugin\'s Settings page. AI assistants can never act as a user with less access than that.', 'captain-social-feed' ) }</p>
                    </div>
                </div>
            </div>

            <hr className="capsf-doc-divider" />

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 12px' }}>
                { __( 'Which Bridge Plugin Should I Use?', 'captain-social-feed' ) }
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--capsf-text-secondary)', lineHeight: '1.7', marginBottom: '16px' }}>
                { __( 'Any plugin that supports the WordPress Abilities API will work. Two common options:', 'captain-social-feed' ) }
            </p>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">A</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Easy MCP AI (recommended)', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Available directly from the WordPress.org plugin directory. Install and activate it like any other plugin, no separate download needed. It includes a built-in OAuth 2.1 connector, so connecting Claude Desktop is just pasting a URL and clicking Approve: no config files, no passwords, no command line.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">B</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Official WordPress MCP Adapter (GitHub only)', 'captain-social-feed' ) }</h4>
                        <p>
                            { __( 'Maintained by the WordPress core team, but not yet listed on WordPress.org, it\'s installed from its ', 'captain-social-feed' ) }
                            <a href="https://github.com/WordPress/mcp-adapter/releases" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--capsf-primary)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '2px' }}>{ __( 'GitHub Releases page', 'captain-social-feed' ) }</a>
                            { __( ' instead (Plugins → Add New → Upload Plugin). It connects using a WordPress Application Password, pasted into Claude Desktop\'s own MCP config file.', 'captain-social-feed' ) }
                        </p>
                    </div>
                </div>
            </div>

            <div className="capsf-doc-warning" style={{ marginTop: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p>{ __( 'This guide is not affiliated with either bridge plugin. Both are independent, general-purpose WordPress plugins. Captain Social Feed simply registers its abilities in the standard way any of them can pick up.', 'captain-social-feed' ) }</p>
            </div>

            <hr className="capsf-doc-divider" />

            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--capsf-text-primary)', margin: '0 0 16px' }}>
                { __( 'How to Connect (Easy MCP AI)', 'captain-social-feed' ) }
            </h3>

            <div className="capsf-doc-steps">
                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">1</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Install Easy MCP AI', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'In your WordPress admin, go to Plugins → Add New, search for "Easy MCP AI", then install and activate it.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">2</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Turn on the abilities you want', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'On this plugin\'s ', 'captain-social-feed' ) }<Link to="/mcp">{ __( 'MCP page', 'captain-social-feed' ) }</Link>{ __( ', make sure the master switch is on. Read-only abilities (List, Get, Get Shortcode, Diagnose) are on by default. Create, Update, Duplicate, and Delete are all off by default. Switch on only the ones you actually want AI assistants to be able to do.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">3</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Copy your MCP server URL', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Go to Easy MCP AI → Dashboard and copy the MCP server URL shown there.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">4</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Add it as a connector in Claude', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'In Claude Desktop, go to Settings → Connectors → Add custom connector, and paste the URL. Approve the permissions screen when it appears. That\'s the whole connection, no config file editing needed.', 'captain-social-feed' ) }</p>
                    </div>
                </div>

                <div className="capsf-doc-step">
                    <div className="capsf-doc-step-num">5</div>
                    <div className="capsf-doc-step-body">
                        <h4>{ __( 'Try it out', 'captain-social-feed' ) }</h4>
                        <p>{ __( 'Start a new chat and ask something like:', 'captain-social-feed' ) }</p>
                        <div className="capsf-doc-code">
                            <code>{ __( 'List my social feeds', 'captain-social-feed' ) }</code>
                        </div>
                    </div>
                </div>
            </div>

            <div className="capsf-doc-tip" style={{ marginTop: '16px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p><strong>{ __( 'Using the official Adapter instead?', 'captain-social-feed' ) }</strong> { __( 'Steps 1 and 3-4 differ slightly: you\'ll upload the plugin from its GitHub Releases zip instead of searching WordPress.org, generate a WordPress Application Password under your user profile, and paste both the site\'s MCP endpoint and that password into Claude Desktop\'s MCP config file (Settings → Developer → Edit Config) rather than a Connectors screen.', 'captain-social-feed' ) }</p>
            </div>
        </article>
    );
};

export default McpIntegration;
