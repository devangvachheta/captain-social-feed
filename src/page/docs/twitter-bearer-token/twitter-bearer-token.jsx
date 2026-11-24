import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Docs → Twitter / X: what each "What to Show" option needs, what is free
 * and what needs X API credits, where to get the Bearer Token / post links,
 * the settings and the error messages.
 */
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

const CodeLine = ( { text } ) => (
    <div className="capsf-doc-code">
        <code>{ text }</code>
        <CopyButton text={ text } />
    </div>
);

const Step = ( { num, title, children } ) => (
    <div className="capsf-doc-step">
        <div className="capsf-doc-step-num">{ num }</div>
        <div className="capsf-doc-step-body">
            <h4>{ title }</h4>
            { children }
        </div>
    </div>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
);
const WarnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
const TipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const SOURCES = [
    { name: __( 'Profile Timeline', 'captain-social-feed' ), needs: __( 'Bearer Token + @username', 'captain-social-feed' ), cost: __( 'X API credits', 'captain-social-feed' ), free: false },
    { name: __( 'Tweets Grid', 'captain-social-feed' ),      needs: __( 'Bearer Token + @username', 'captain-social-feed' ), cost: __( 'X API credits', 'captain-social-feed' ), free: false },
    { name: __( 'Sidebar Widget', 'captain-social-feed' ),   needs: __( 'Bearer Token + @username', 'captain-social-feed' ), cost: __( 'X API credits', 'captain-social-feed' ), free: false },
    { name: __( 'Hashtag Feed', 'captain-social-feed' ),     needs: __( 'Bearer Token + #hashtag or search words', 'captain-social-feed' ), cost: __( 'X API credits', 'captain-social-feed' ), free: false },
    { name: __( 'Testimonials', 'captain-social-feed' ),     needs: __( 'Post links (Bearer Token optional)', 'captain-social-feed' ), cost: __( 'Free (text only) - credits add photos, pictures and counts', 'captain-social-feed' ), free: true },
];

const ERRORS = [
    { msg: __( 'X rejected the Bearer Token (401 Unauthorized)', 'captain-social-feed' ), fix: __( 'The token is wrong, cut short or was regenerated. Regenerate it in the Developer Console and paste the whole token again (it is long and contains % characters).', 'captain-social-feed' ) },
    { msg: __( 'X did not allow reading posts with this App (credits depleted)', 'captain-social-feed' ), fix: __( 'The token is fine, but your X developer account has no credits left. Buy credits in the Developer Console. Testimonials keep working in free mode meanwhile.', 'captain-social-feed' ) },
    { msg: __( 'X did not allow reading posts with this App (403 / client-not-enrolled)', 'captain-social-feed' ), fix: __( 'The App is not inside a Project or has no API access. In the Developer Console, make sure the App belongs to a Project and API access is turned on.', 'captain-social-feed' ) },
    { msg: __( 'X rate limit reached for this App', 'captain-social-feed' ), fix: __( 'Too many requests in a short time (often while testing). Wait 15 minutes. Raise the cache duration in Settings so the feed asks X less often.', 'captain-social-feed' ) },
    { msg: __( 'Could not find that Twitter/X account', 'captain-social-feed' ), fix: __( 'Check the @username spelling. Protected (private) and suspended accounts cannot be shown.', 'captain-social-feed' ) },
    { msg: __( 'No posts found', 'captain-social-feed' ), fix: __( 'Hashtag Feed: X only searches the last 7 days - try a busier hashtag. Profile feeds: turn on Show Reposts / Show Replies if the account mostly reposts or replies. Show Posts (Settings) may also be filtering them out.', 'captain-social-feed' ) },
];

const TwitterBearerToken = () => {
    return (
        <article className="capsf-doc-article">
            <img src={ ( typeof capsf_data !== 'undefined' ? capsf_data.plugin_url : '' ) + 'assets/svg/social/twitter.svg' } alt="" width="40" height="40" className="capsf-doc-platform-logo" />
            <div className="capsf-doc-article-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                { __( 'Setup Guide', 'captain-social-feed' ) }
            </div>

            <h1 className="capsf-doc-article-title">
                { __( 'Twitter / X Feeds - Complete Guide', 'captain-social-feed' ) }
            </h1>
            <p className="capsf-doc-article-intro">
                { __( 'Everything you need for an X feed: what each "What to Show" option needs, what is free and what needs X API credits, where to get the Bearer Token and post links, the settings, and what every error message means.', 'captain-social-feed' ) }
            </p>

            {/* ── 1. Overview ── */}
            <h3 className="capsf-doc-section-title">{ __( '1. What to Show - what each option needs', 'captain-social-feed' ) }</h3>
            <p className="capsf-doc-text">{ __( 'Pick it in Step 1 of the feed editor. It decides which fields you fill in and the starting design (you can still switch between the two X designs in Step 2).', 'captain-social-feed' ) }</p>
            <div className="capsf-doc-table-wrap">
                <table className="capsf-doc-table">
                    <thead>
                        <tr>
                            <th scope="col">{ __( 'What to Show', 'captain-social-feed' ) }</th>
                            <th scope="col">{ __( 'You need', 'captain-social-feed' ) }</th>
                            <th scope="col">{ __( 'Free or paid', 'captain-social-feed' ) }</th>
                        </tr>
                    </thead>
                    <tbody>
                        { SOURCES.map( src => (
                            <tr key={ src.name }>
                                <th scope="row">{ src.name }</th>
                                <td>{ src.needs }</td>
                                <td><span className={ `capsf-doc-tag ${ src.free ? 'capsf-doc-tag--free' : 'capsf-doc-tag--paid' }` }>{ src.cost }</span></td>
                            </tr>
                        ) ) }
                    </tbody>
                </table>
            </div>
            <div className="capsf-doc-steps">
                <Step num="A" title={ __( 'Profile Timeline', 'captain-social-feed' ) }>
                    <p>{ __( 'Your profile header (banner, picture, name, verified badge, Follow on X button, Posts / Following / Followers) with your latest posts in a scrolling list.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="B" title={ __( 'Tweets Grid', 'captain-social-feed' ) }>
                    <p>{ __( 'Your latest posts as cards in a masonry grid - photos (up to 4), videos, reply / repost / like counts and a Share menu.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="C" title={ __( 'Hashtag Feed', 'captain-social-feed' ) }>
                    <p>{ __( 'Recent posts from anyone that use a #hashtag or contain your search words. X only searches the last 7 days.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="D" title={ __( 'Testimonials', 'captain-social-feed' ) }>
                    <p>{ __( 'Posts you pick yourself (for example customers praising you), shown in the order you paste them, with 5 stars and a heading such as "What our clients tweet about us". Works for free - see section 2.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="E" title={ __( 'Sidebar Widget', 'captain-social-feed' ) }>
                    <p>{ __( 'A compact Profile Timeline that fits a sidebar or a narrow column.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            <hr className="capsf-doc-divider" />

            {/* ── 2. Free vs paid ── */}
            <h3 className="capsf-doc-section-title">{ __( '2. Free or paid? (X API credits)', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-info">
                <InfoIcon />
                <p>{ __( 'X charges for reading posts through its API. There is no monthly plan any more: you buy credits in the X Developer Console and every request uses some of them (pay-per-use). Captain Social Feed itself is not charging anything - the cost is X\'s.', 'captain-social-feed' ) }</p>
            </div>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Needs credits: Profile Timeline, Tweets Grid, Sidebar Widget, Hashtag Feed', 'captain-social-feed' ) }>
                    <p>{ __( 'These read posts through the X API, so they only work while your X developer account has credits. Without credits X answers "credits depleted" and the feed stays empty.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Free: Testimonials', 'captain-social-feed' ) }>
                    <p>{ __( 'Without a token or without credits, Testimonials read your pasted posts from X\'s free public embed. You get the post text, links, author name, @username and date. Photos, videos, profile pictures and reply / repost / like counts are not available this way - they appear automatically once the feed has a Bearer Token with credits.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'What does it cost?', 'captain-social-feed' ) }>
                    <p>{ __( 'At the time of writing X charges about $0.005 per post read and $0.010 per profile read. Prices change - check X\'s pricing page:', 'captain-social-feed' ) }</p>
                    <CodeLine text="https://docs.x.com/x-api/getting-started/pricing" />
                    <p>{ __( 'Example: a Profile Timeline with 6 posts reads 6 posts + 1 profile ≈ $0.04 each time it refreshes. The plugin keeps the posts in its cache, so X is only asked again when the cache runs out: with a 1-hour cache that is up to 24 refreshes a day (≈ $1 a day); with a 12-hour cache only 2 (≈ $0.08 a day). Hashtag Feed always reads at least 10 posts per refresh.', 'captain-social-feed' ) }</p>
                </Step>
            </div>
            <div className="capsf-doc-tip">
                <TipIcon />
                <p><strong>{ __( 'Keep the cost low:', 'captain-social-feed' ) }</strong> { __( 'raise Settings → Cache Management → API Cache Duration (12 or 24 hours), keep Max Posts small, and keep the Fallback Cache on so visitors still see the last posts if your credits run out.', 'captain-social-feed' ) }</p>
            </div>

            <hr className="capsf-doc-divider" />

            {/* ── 3. Bearer Token ── */}
            <h3 className="capsf-doc-section-title">{ __( '3. Get your Bearer Token', 'captain-social-feed' ) }</h3>
            <p className="capsf-doc-text">{ __( 'Only the Bearer Token is needed. Consumer Key / Secret, Access Token / Secret and OAuth 2.0 Client ID are for apps that post or log users in - the plugin does not use them.', 'captain-social-feed' ) }</p>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Open the X Developer Console', 'captain-social-feed' ) }>
                    <p>{ __( 'Sign in with the X account that should own the App (it does not have to be the account you show).', 'captain-social-feed' ) }</p>
                    <CodeLine text="https://console.x.com/" />
                </Step>
                <Step num="2" title={ __( 'Create a Project and an App', 'captain-social-feed' ) }>
                    <p>{ __( 'Follow the sign-up questions, then create a Project and an App inside it. Apps outside a Project cannot read posts.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Copy the Bearer Token', 'captain-social-feed' ) }>
                    <p>{ __( 'Open your App → "Keys and tokens" → "Bearer Token" → Generate (or Regenerate). Copy the whole token - it is long, starts with several "A"s and contains % characters. X shows it only once.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="4" title={ __( 'Buy credits', 'captain-social-feed' ) }>
                    <p>{ __( 'In the Developer Console open Billing / Purchase credits and add credits (not needed for free Testimonials).', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="5" title={ __( 'Paste it in the plugin', 'captain-social-feed' ) }>
                    <p>{ __( 'Feed editor → Step 1 → Bearer Token, then click "Test Connection". "Connected successfully" means the token works and has credits.', 'captain-social-feed' ) }</p>
                </Step>
            </div>
            <div className="capsf-doc-warning">
                <WarnIcon />
                <p>{ __( 'Treat the token like a password: never share it in chats, emails or screenshots. Regenerating it makes the old one stop working - paste the new one in every feed that used it.', 'captain-social-feed' ) }</p>
            </div>

            <hr className="capsf-doc-divider" />

            {/* ── 4. Per-option fields ── */}
            <h3 className="capsf-doc-section-title">{ __( '4. Fill in the second field', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( '@Username (Profile Timeline, Tweets Grid, Sidebar Widget)', 'captain-social-feed' ) }>
                    <p>{ __( 'The handle from the profile address, with or without @. For https://x.com/captaininfokit type:', 'captain-social-feed' ) }</p>
                    <CodeLine text="captaininfokit" />
                    <p>{ __( 'The account must be public. Reposts and replies are hidden unless you turn them on in Step 3.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Hashtag or Search Words (Hashtag Feed)', 'captain-social-feed' ) }>
                    <p>{ __( 'One word becomes a hashtag automatically ("WordPress" → #WordPress). Several words, quotes or X search operators are used as typed, for example:', 'captain-social-feed' ) }</p>
                    <CodeLine text="#WordPress" />
                    <CodeLine text='"captain social feed" lang:en' />
                    <p>{ __( 'X only returns posts from the last 7 days.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Post Links (Testimonials)', 'captain-social-feed' ) }>
                    <p>{ __( 'Open the post on X → click the Share icon → "Copy link" (or copy the address bar). Paste one link per line, up to 20 for the free mode (100 with a token). x.com and twitter.com links both work; the posts show in the order you paste them.', 'captain-social-feed' ) }</p>
                    <CodeLine text="https://x.com/captaininfokit/status/2099901578455261673" />
                </Step>
            </div>

            <hr className="capsf-doc-divider" />

            {/* ── 5. Designs + settings ── */}
            <h3 className="capsf-doc-section-title">{ __( '5. Designs and settings', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Step 2 - two X designs', 'captain-social-feed' ) }>
                    <p>{ __( 'Profile Timeline (profile header + scrolling list) and Tweets Grid (masonry cards). X feeds only use these two; the other designs stay for the other platforms.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Step 3 - X Options', 'captain-social-feed' ) }>
                    <p>{ __( 'Show Profile Header (Profile Timeline / Sidebar), Show Reposts (with a "Reposted" label and the original author), Show Replies.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Step 3 - everything else', 'captain-social-feed' ) }>
                    <p>{ __( 'Section Title (heading above the feed), Columns (Tweets Grid), Max Posts, Show Posts (all / videos / photos / text), Click Action (open on X, popup or play inline), Dark Mode and the Styles tab.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            <hr className="capsf-doc-divider" />

            {/* ── 6. Errors ── */}
            <h3 className="capsf-doc-section-title">{ __( '6. Error messages and how to fix them', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-table-wrap">
                <table className="capsf-doc-table">
                    <thead>
                        <tr>
                            <th scope="col">{ __( 'Message', 'captain-social-feed' ) }</th>
                            <th scope="col">{ __( 'What to do', 'captain-social-feed' ) }</th>
                        </tr>
                    </thead>
                    <tbody>
                        { ERRORS.map( err => (
                            <tr key={ err.msg }>
                                <th scope="row">{ err.msg }</th>
                                <td>{ err.fix }</td>
                            </tr>
                        ) ) }
                    </tbody>
                </table>
            </div>
            <div className="capsf-doc-tip">
                <TipIcon />
                <p>{ __( 'After fixing the token or adding credits, open the feed and click "Test Connection" - saving the feed also refreshes its posts. Settings → Clear Cache refreshes every feed.', 'captain-social-feed' ) }</p>
            </div>
        </article>
    );
};

export default TwitterBearerToken;
