import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Docs → Customize Your Feed: layouts, the three Slider styles, the Step 3
 * Layout / Behaviors / Styles tabs, Click Action (popup) and caching.
 */
const Step = ( { num, title, children } ) => (
    <div className="capsf-doc-step">
        <div className="capsf-doc-step-num">{ num }</div>
        <div className="capsf-doc-step-body">
            <h4>{ title }</h4>
            { children }
        </div>
    </div>
);

const CustomizeFeed = () => {
    return (
        <article className="capsf-doc-article">
            <div className="capsf-doc-article-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <circle cx="13.5" cy="6.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10a10 10 0 0 0 10-10c0-.26 0-.52-.02-.78a3.5 3.5 0 0 1-3.16-1.54 3.5 3.5 0 0 1-4.32-4.32A3.5 3.5 0 0 1 12.78 2.02c-.26-.02-.52-.02-.78-.02Z"/>
                </svg>
                { __( 'Customization', 'captain-social-feed' ) }
            </div>

            <h1 className="capsf-doc-article-title">
                { __( 'Customize Your Feed', 'captain-social-feed' ) }
            </h1>
            <p className="capsf-doc-article-intro">
                { __( 'Every feed is built in four steps: Connect, Select Layout, Settings and Insert Code. This guide covers the design choices in steps 2 and 3 and the plugin-wide cache settings.', 'captain-social-feed' ) }
            </p>

            {/* Layouts */}
            <h3 className="capsf-doc-section-title">{ __( 'Step 2: Select Layout', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Pick a category', 'captain-social-feed' ) }>
                    <p>{ __( 'Grid shows a card grid (Social Post, Social Post - Image First, Classic Card, Professional, Dark Cinematic, Simple Grid). Playlist shows one featured post with a scrollable list. Single shows one centered card. Reel shows portrait cards.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Social Post:', 'captain-social-feed' ) }</strong> { __( 'account header (picture, name, time, platform logo), caption, image, then likes / comments / shares - like the post on the platform.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Simple Grid:', 'captain-social-feed' ) }</strong> { __( 'square pictures; hovering shows the likes, comments and caption, and a corner icon marks albums and videos. Clicking opens the post in a popup - every photo of an album as a slider, videos with their player, likes, comments, caption and date, plus previous / next post.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Social Post - Image First:', 'captain-social-feed' ) }</strong> { __( 'image on top, then the caption, the account row and likes / comments / shares.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Turn on Slider (Grid and Reel)', 'captain-social-feed' ) }>
                    <p>{ __( 'Switch on "Slider" next to the categories and pick a style:', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Style 1 - Equal Cards:', 'captain-social-feed' ) }</strong> { __( 'cards of equal size, arrows on both sides and dots below.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Style 2 - Spotlight:', 'captain-social-feed' ) }</strong> { __( 'the active card is enlarged in the center while the cards beside it peek in.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Style 3 - Carousel:', 'captain-social-feed' ) }</strong> { __( 'a counter ("01 / 05") and arrows above the cards, with a progress bar below.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Select a design', 'captain-social-feed' ) }>
                    <p>{ __( 'Each row previews your real posts in that design. Click "Select" to use it.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            {/* Twitter / X */}
            <h3 className="capsf-doc-section-title">{ __( 'Twitter / X Feeds', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'What to Show (Step 1)', 'captain-social-feed' ) }>
                    <p><strong>{ __( 'Profile Timeline:', 'captain-social-feed' ) }</strong> { __( 'your profile header (banner, picture, name, Follow button, post / follower counts) with your latest posts in a scrolling list.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Tweets Grid:', 'captain-social-feed' ) }</strong> { __( 'your latest posts as cards in a masonry grid.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Hashtag Feed:', 'captain-social-feed' ) }</strong> { __( 'recent posts from anyone with a #hashtag or search words. X only searches the last 7 days.', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Testimonials:', 'captain-social-feed' ) }</strong> { __( 'paste the links of posts about you (one per line); they show in that order with 5 stars. Add a Section Title such as "What our clients tweet about us".', 'captain-social-feed' ) }</p>
                    <p><strong>{ __( 'Sidebar Widget:', 'captain-social-feed' ) }</strong> { __( 'a compact profile timeline that fits a sidebar.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Two X designs (Step 2)', 'captain-social-feed' ) }>
                    <p>{ __( 'X feeds use their own designs: Profile Timeline and Tweets Grid. Each card shows the author with the verified badge, the text with links, up to 4 photos or a video, reply / repost / like counts and a Share menu (Facebook, X). Reposts carry a "Reposted" label.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'X Options (Step 3)', 'captain-social-feed' ) }>
                    <p>{ __( 'Show or hide the profile header, reposts and replies. Profile Timeline, Tweets Grid, Sidebar Widget and Hashtag Feed read posts with X API credits; Testimonials also work for free (text only). Docs → Twitter / X Feeds explains the token, the cost and every error message.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            <hr className="capsf-doc-divider" />

            {/* Settings tabs */}
            <h3 className="capsf-doc-section-title">{ __( 'Step 3: Settings', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Layout tab', 'captain-social-feed' ) }>
                    <p>{ __( 'Columns per screen size (for a Slider: how many slides are visible), Max Posts, which card details to show (account name, title, description, likes, date) and the Click Action.', 'captain-social-feed' ) }</p>
                    <p>{ __( 'Show Posts picks which posts the feed lists: All, only Videos, only Photos (albums included) or Text Only (posts without a photo or video). The feed still fills its Max Posts with matching posts.', 'captain-social-feed' ) }</p>
                    <p>{ __( 'For the Social Post designs, Caption sets how long captions behave: "Show More" cuts them after a number of characters with a Show More / Show Less link (both texts can be changed), "Scroll" shows them in a fixed-height box with a scrollbar.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Behaviors tab', 'captain-social-feed' ) }>
                    <p>{ __( 'Equal Card Height for grids (cards in a row get the same height and their header, caption, image and likes line up; turned off, every card keeps its own height), Auto Slide, Infinite Loop and arrow offsets for sliders, and Pagination (Load More with Initial Posts and Posts Per Click). Only the options that apply to your layout are shown.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Styles tab', 'captain-social-feed' ) }>
                    <p>{ __( 'Color Mode (Light or Dark) sets the starting colors of the cards. Then: card background (solid or gradient), border, margin, padding, shadow and gaps; color and typography for the title (account name on Social Post), caption and stats; border and shadow for the image. Social Post also gets the Show More / Less link color and typography, or in Scroll mode the box height and the scrollbar width, radius and colors. The Playlist layout has its own panels for the featured post and the list. Every row has a reset icon.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="4" title={ __( 'Live Preview', 'captain-social-feed' ) }>
                    <p>{ __( 'The Live Preview tab (next to Layout, Behaviors and Styles) saves your changes and shows the real feed inside your theme, as visitors will see it. Switch between Desktop, Tablet and Mobile to check the columns on each screen size, and use Refresh after more changes.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            <div className="capsf-doc-info">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>
                    <strong>{ __( 'Click Action:', 'captain-social-feed' ) }</strong>{ ' ' }
                    { __( '"Open in Popup" shows photos and videos in a lightbox on your site. "Play Inline on Page" plays videos inside the card. Videos use the direct video file when the platform provides one, otherwise the platform\'s own embeddable player (Facebook, X, Pinterest). Videos that can be played neither way, and text-only posts, open the original post, because social networks do not allow their normal pages to be shown inside another site.', 'captain-social-feed' ) }
                </p>
            </div>

            <hr className="capsf-doc-divider" />

            {/* Cache */}
            <h3 className="capsf-doc-section-title">{ __( 'Caching', 'captain-social-feed' ) }</h3>
            <div className="capsf-doc-steps">
                <Step num="1" title={ __( 'Cache Duration', 'captain-social-feed' ) }>
                    <p>{ __( 'Settings → Cache Management → API Cache Duration sets how long posts are kept before the platform is asked again. Longer durations mean fewer API calls.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="2" title={ __( 'Cache Storage', 'captain-social-feed' ) }>
                    <p>{ __( '"WordPress transients" is the default. Choose "Plugin database table" if another plugin, an object cache or your host keeps clearing transients. Switching clears the cache once.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="3" title={ __( 'Fallback Cache', 'captain-social-feed' ) }>
                    <p>{ __( 'When on (default), the last successful posts are kept in the plugin table and shown if a platform request fails, for example an expired token or a rate limit, so visitors never see an empty feed.', 'captain-social-feed' ) }</p>
                </Step>
                <Step num="4" title={ __( 'Clearing the cache', 'captain-social-feed' ) }>
                    <p>{ __( 'Use "Clear Cache" in Settings to refresh every feed, or "Clear This Feed Cache" in Step 4 (Insert Code) of a feed to refresh just that one. Changing the settings of a feed also refreshes its cache.', 'captain-social-feed' ) }</p>
                </Step>
            </div>

            <div className="capsf-doc-tip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p><strong>{ __( 'Tip:', 'captain-social-feed' ) }</strong> { __( 'Changes are saved automatically while you edit. Reload the page that shows the feed to see them on your site.', 'captain-social-feed' ) }</p>
            </div>
        </article>
    );
};

export default CustomizeFeed;
