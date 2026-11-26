=== Captain Social Feed ===
Contributors: devangvachheta
Tags: instagram feed, facebook feed, twitter feed, social feed, pinterest feed
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 0.3.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display beautiful, customizable social media feeds from Instagram, Facebook, Twitter (X), Threads, and Pinterest directly on your WordPress website.

== Description ==

**Captain Social Feed** is an easy-to-use WordPress plugin that lets you display your social media posts on your website with full control over layout and styling.

Connect an Instagram Business/Creator account, a Facebook Page, a Twitter (X) account, a Threads account, or a Pinterest board, and Captain Social Feed pulls in the latest posts and displays them using one of several card layouts. No coding required.

Add the feed to any page using a shortcode, or with the built-in Elementor widget and Gutenberg block.

= Key Features =

* Connect Instagram, Facebook, Twitter (X), Threads, or Pinterest
* Social Post designs that look like the post on the platform: account header (or image first), caption with Show More / Show Less or a styleable scroll box, likes / comments / shares
* Each platform's own logo, profile picture and counts on every card
* More card layouts: Grid (Classic Card, Professional, Dark Cinematic, Simple Grid), Playlist, Single and Reel
* Three slider styles for Grid and Reel layouts: Equal Cards, Spotlight and Carousel (counter + progress bar)
* Styles tab: card background (solid/gradient), border, margin, padding, shadow, gaps, and color/typography for title, description and stats
* Behaviors tab: Equal Card Height, Auto Slide, Infinite Loop, arrow offsets and Load More
* Open photos and videos in a popup lightbox, play videos inline, or open the original post
* Load More with responsive initial / per-click counts
* Elementor widget integration
* Gutenberg block integration
* Shortcode support for any page builder or theme
* Built-in response caching for fast page loads, stored in WordPress transients or the plugin's own database table, with a last-known-good fallback when a platform request fails
* Fully responsive, mobile-friendly card designs
* Plugin Rollback to any previous version
* Built-in Documentation pages with setup guides for each platform
* Light/Dark mode admin interface

= How It Works =

1. Go to Captain Social Feed → Create Feed and choose a platform.
2. For Instagram, Facebook, Threads, Pinterest, and Twitter/X Timeline/Hashtag feeds, enter the platform's API credentials (a setup guide is linked for each platform). For Twitter/X Testimonials, you can also paste public post URLs directly, which can display using X's public oEmbed service even without a Bearer Token.
3. Pick a card layout and configure display options.
4. Copy the shortcode, or use the Elementor widget/Gutenberg block, to place the feed on any page.

== Frequently Asked Questions ==

= Does this plugin store my posts' content? =

Only as a cache. The posts it fetches (captions, image URLs, engagement counts) are cached in WordPress transients or, if you choose it under Settings, in the plugin's own database table, to reduce API calls and speed up page loads. When the Fallback Cache is on (default), the last successful copy of each feed is also kept in that table and shown if a platform request fails. Use Settings → Clear Cache to remove everything; all of it is deleted on uninstall when "Clear all data on uninstall" is enabled.

= Do I need a developer account for each platform? =

Yes. Each platform (Instagram, Facebook, Twitter/X, Threads, Pinterest) requires you to create a developer app/token through that platform's own developer portal in order to read your posts via their official API. Step-by-step guides for each are built into the plugin under Documentation.

= Is a paid plan required for any platform? =

Twitter/X's API currently requires a paid developer plan (Basic tier or above) to read a timeline. Instagram, Facebook, Threads, and Pinterest can be used with free developer access.

= Can I display more than one feed on the same site? =

Yes, you can create and place an unlimited number of feeds, each connected to its own account/platform.

= How are access tokens stored and protected? =

Access tokens and bearer tokens are stored in the WordPress database (in the plugin's `wp_capsf_feeds` custom table and WordPress options) so that your server can authenticate with official social platform APIs. They are never sent, exposed, or rendered to front-end website visitors. Within the WordPress admin dashboard, token values are automatically masked for privacy and security.

= Does this plugin install or download other plugins automatically? =

No. The plugin never downloads, installs, or updates external plugins or files automatically. Connections to api.wordpress.org and downloads.wordpress.org only take place upon explicit administrator interaction:
1. Version Rollback: when an administrator explicitly selects an older version and clicks "Rollback".
2. Recommended Products: when an administrator explicitly clicks "Install" or "Activate" on a recommended plugin card.
All packages are fetched directly from the official WordPress.org repository.

= Is the public Load More feature rate-limited? =

Yes. Front-end AJAX requests for loading more posts are rate-limited per visitor IP address (default is 30 requests per minute based on a SHA-256 hash of the remote IP). Site administrators and developers can customize this limit using the `capsf_load_more_rate_limit` WordPress filter.

== External Services ==

This plugin connects to external third-party services to retrieve and display social posts:

1. **Official Platform APIs (Instagram, Facebook, Threads, Pinterest, and Twitter/X):** Connections to these APIs are made when you configure a feed and enter the corresponding platform's API credentials (Access Token or Bearer Token).
2. **Twitter / X oEmbed (publish.twitter.com):** This is the only connection that works without credentials. When a Twitter/X Testimonials feed has no API Bearer Token (or the API read limits are exhausted), the plugin sends the specific post URLs you pasted into the feed to X's public oEmbed service. No API credentials are required for this fallback.

No external connections are made upon plugin installation or activation. Requests to fetch feed content only occur when an administrator tests or creates a feed in the admin dashboard, or when a configured feed's shortcode, block, or widget is rendered on the front end and its cache has expired.

Images and videos of the posts you display are loaded by your visitors' browsers directly from the platform's own content-delivery network (for example Meta, X or Pinterest CDNs), so those services receive the visitor's IP address. When the Click Action is "Open in Popup" or "Play Inline on Page" and a video has no direct file, the platform's own video player is loaded in a frame only after the visitor clicks it: Facebook (www.facebook.com/plugins/video.php), X (platform.twitter.com) or Pinterest (assets.pinterest.com). Instagram and Threads access tokens are refreshed automatically once every ~20 days via the platform's token-refresh endpoint.

= Instagram (Meta) =
Used to fetch posts from an Instagram Business/Creator account you connect.
Data sent: the Access Token (sent via HTTP Authorization header, or fallback query parameter if required by the API endpoint) and Instagram Business Account ID you enter.
Terms of Service: https://developers.facebook.com/terms/
Privacy Policy: https://www.facebook.com/privacy/policy/

= Facebook (Meta) =
Used to fetch posts from a Facebook Page you connect.
Data sent: the Page Access Token (sent via HTTP Authorization header, or fallback query parameter if required by the API endpoint) and Facebook Page ID you enter.
Terms of Service: https://developers.facebook.com/terms/
Privacy Policy: https://www.facebook.com/privacy/policy/

= Threads (Meta) =
Used to fetch posts from a Threads account you connect.
Data sent: the Access Token (sent via HTTP Authorization header, or fallback query parameter if required by the API endpoint) and Threads User ID you enter.
Terms of Service: https://developers.facebook.com/terms/
Privacy Policy: https://www.facebook.com/privacy/policy/

= Twitter / X =
Used to fetch posts from a public Twitter/X account you specify.
Data sent: the Bearer Token (sent via HTTP Authorization header) and @username you enter.
Terms of Service: https://twitter.com/en/tos
Privacy Policy: https://twitter.com/en/privacy

= Twitter / X oEmbed (publish.twitter.com) =
Used as a free fallback to retrieve embed markup for Twitter/X posts and testimonials when no Bearer Token is supplied or when API read credits are depleted.
Endpoint: https://publish.twitter.com/oembed
Data sent: Tweet ID and tweet URL.
Terms of Service: https://twitter.com/en/tos
Privacy Policy: https://twitter.com/en/privacy

= Pinterest =
Used to fetch pins from a Pinterest board you connect.
Data sent: the Access Token and Board ID you enter.
Terms of Service: https://policy.pinterest.com/en/terms-of-service
Privacy Policy: https://policy.pinterest.com/en/privacy-policy

= WordPress.org API & Package Downloads =
Used only within the administrative dashboard when an administrator explicitly initiates an action:
1. Version Rollback: queries https://api.wordpress.org to check available public releases, and downloads official release packages from https://downloads.wordpress.org.
2. Recommended Products: queries https://api.wordpress.org for plugin information and downloads selected plugin packages from https://downloads.wordpress.org upon an explicit admin click.
Data sent: Plugin slug and requested version number.
Terms of Service & Privacy: https://wordpress.org/about/privacy/

= Social Platform Share & Intent Links =
Card templates include interactive share and follow links that open the platform in a new browser window when clicked by a visitor:
* Twitter / X: https://x.com/intent/tweet, https://x.com/intent/follow
* Facebook: https://www.facebook.com/sharer/sharer.php
* Threads: https://www.threads.net/intent/post
* Pinterest: https://pinterest.com/pin/create/button/
Data sent: URL or caption of the post to share, only when a visitor clicks the link.

== Third-Party Libraries & Credits ==

Captain Social Feed bundles and incorporates the following open-source software:

* **GLightbox** (v3.3.1)
  License: MIT (https://opensource.org/licenses/MIT)
  Author: Biati Digital (https://biatidigital.com)
  Source: https://github.com/biati-digital/glightbox
  Bundled in `assets/js/glightbox.min.js` and `assets/css/glightbox.min.css`. Used for responsive lightbox popups.

* **React** (v18.3.1) & **React DOM** (v18.3.1)
  License: MIT (https://opensource.org/licenses/MIT)
  Copyright (c) Meta Platforms, Inc. and affiliates.
  Source: https://github.com/facebook/react
  Compiled into admin application bundle (`build/index.js`).

* **Redux Toolkit** (v2.12.0) & **React-Redux** (v9.2.0)
  License: MIT (https://opensource.org/licenses/MIT)
  Copyright (c) 2018 Mark Erikson
  Source: https://github.com/reduxjs/redux-toolkit
  Compiled into admin application bundle (`build/index.js`).

* **React Router** (v7.18.2)
  License: MIT (https://opensource.org/licenses/MIT)
  Copyright (c) Remix Software Inc.
  Source: https://github.com/remix-run/react-router
  Compiled into admin application bundle (`build/index.js`).

== Source Code ==

The JavaScript files located in the `build/` directory are minified production bundles compiled from unminified React source code in the `src/` directory.

* Source repository: https://github.com/devangvachheta/captain-social-feed
* Build instructions: Using Node.js (v18+) and npm, run:
  `npm install`
  `npm run build`

== Trademarks & Disclaimers ==

Instagram, Facebook, Meta, Twitter, X, Threads, and Pinterest, as well as their respective logos and marks, are trademarks or registered trademarks of their respective owners. Captain Social Feed is an independent plugin and is not affiliated with, endorsed by, or sponsored by Meta Platforms, Inc., X Corp., Pinterest, Inc., or any other third-party platform.

== Screenshots ==

1. Create a new feed by choosing a platform.
2. Connect your account with a Test Connection check.
3. Choose from multiple card layouts.
4. Configure display and load-behavior settings.
5. Copy the shortcode or use the Elementor/Gutenberg integration.

== Changelog ==

= 0.3.1 =
* Change: removed the White Label page, the Upgrade page, the Pro banners and all Pro-only code. The plugin is fully free and has no locked or limited features.
* Change: removed the disabled "Infinity Load" option from the pagination list.
* Fix: escaping and translator-comment cleanups, and the admin menu icon is now loaded from the plugin file URL.
* Update: GLightbox 3.3.1.

= 0.3.0 =
* Change: the feed editor now has a refined step-by-step layout - the Next / Save button sits next to Back at the top (Back goes to the previous step), Settings has its tabs in one row with Live Preview as the last tab, every section is a collapsible card with a summary badge ("3 Cols", "5 of 5 Active", ...), round number chips, a device picker for responsive values and (i) tips on the display toggles, and the Insert Code step has the Shortcode / PHP Snippet tabs, the Multi-Platform Embedding Hub (Block Editor, Elementor, PHP template) and the Feed Diagnostic & Cache Status card.
* Change: Simple Grid is listed right after the Social Post designs (above Classic Card).
* Change: Equal Card Height is off by default - cards keep their own height until you switch it on.
* Fix: on phones the plugin pages were pushed off-screen to the side below the Menu bar.

= 0.2.3 =
* New: Simple Grid redesign - hovering a picture shows its likes, comments and caption; a corner icon marks albums and videos (reels).
* New: post popup for Simple Grid - account picture, name and Follow link, the platform logo, every photo of an album as a slider (arrows, dots, swipe, arrow keys), videos with their player, likes / comments / share, the caption with linked hashtags and @mentions, the date, and previous / next post buttons. Esc closes it.
* New: albums now bring all their photos - Instagram and Threads carousels, Facebook multi-photo posts, Pinterest multi-image pins and X posts with several photos.
* Change: the Dashboard type badges use each platform's own colour, and the Last Modified info shows on hover.

= 0.2.2 =
* Docs: new Twitter / X guide - what every "What to Show" option needs, which ones are free and which need X API credits (with a cost example and tips to keep it low), how to get the Bearer Token in the X Developer Console, where to copy post links, the X settings, and every error message with its fix.

= 0.2.1 =
* New: X Testimonials work without X API credits (and without a Bearer Token) - when X refuses the API call, the posts are read from X's free public embed. They show the text, author and date; photos, profile pictures and counts still need API credits.

= 0.2.0 =
* New: Twitter / X "What to Show" in Step 1 - Profile Timeline, Tweets Grid, Hashtag Feed (last 7 days), Testimonials (pasted post links, shown with stars) and Sidebar Widget.
* New: two X designs - Profile Timeline (profile header with banner, picture, verified badge, Follow button and counts, then a scrolling list) and Tweets Grid (masonry cards). Older designs are no longer offered for X feeds; other platforms keep them.
* New: X cards show reposts with a "Reposted" label (original post and author), up to 4 photos as a collage, videos, reply / repost / like counts and a Share menu (Facebook, X).
* New: X Options - show or hide the profile header, reposts and replies.
* New: Section Title above any feed.

= 0.1.1 =
* Fix: X / Twitter feeds always failed with "HTTP 401" - saving cut the percent-encoded parts (%3D, %2B) out of the Bearer Token. Tokens are now kept exactly as pasted (all platforms). Paste the X Bearer Token again once after updating.
* Change: clear X error messages - a rejected token, a plan without post reads, or the rate limit now say what to do.

= 0.1.0 =
* New: Settings → Layout → Show Posts - list All posts, only Videos, only Photos or Text Only posts.
* New: MCP page - let AI assistants (Claude, Cursor, ...) list, create, update, duplicate, delete and diagnose feeds through the WordPress Abilities API (WordPress 6.9+). Everything is off until you switch it on; write and delete abilities need their own switch, and access tokens are never shared with the AI client.
* Change: the plugin menu has an updated layout - collapse button next to the title, General (MCP, Documentation) and Extra Options groups, and a collapsible sidebar.
* Fix: Equal Card Height - the images, captions and likes of the cards in a row now line up, and turning the option off really lets each card keep its own height.
* Fix: the Settings title overlapped its description since the Live Preview button was added.

= 0.0.9 =
* New: Live Preview - a button at the top of Settings saves your changes and shows the real feed inside your theme, with Desktop / Tablet / Mobile sizes.
* Fix: the Gutenberg block was not available in the block editor (it never registered). It now shows the feed with all its styles in the editor.
* Fix: Elementor and Gutenberg editors load every feed stylesheet, so the preview matches the live page (Social Post designs and sliders were unstyled).
* Fix: Dark Mode on the older designs - some cards stayed white with light text; the per-feed colors now always win.
* Fix: Threads video posts and carousels, Instagram carousels starting with a video, X/Twitter GIFs and Pinterest video / multi-image pins showed no picture (or tried to show a video file as an image).
* Fix: Pinterest pins with an empty title now show their description; X/Twitter captions no longer end with the t.co link of the attached photo.
* Fix: the feed editor scrolled sideways on phones (Settings → Styles).
* Change: saving a feed without any change keeps its cache (fewer API calls).
* Change: RTL - captions follow their own text direction and the duration badge sits on the correct side.
* Removed: unused legacy layout files.

= 0.0.8 =
* Change: the editor has 4 steps now - Connect, Select Layout, Settings, Insert Code. The separate "Layout Mode" step is gone; Light / Dark is the "Color Mode" option at the top of Settings → Styles.
* Fix: Settings → Styles and Behaviors panels were squeezed into half the width (the Background panel was cut off, the Image panel overflowed).
* Fix: "Play Inline on Page" on the Social Post designs - the stop (×) button fell below the video as a grey bar, because those designs never loaded the inline player styles. The player styles now live once in the shared stylesheet (seven copies removed) and use theme-proof selectors.
* Fix: theme styles for plain links and buttons can no longer restyle the Show More link, the inline player button or the Load More button.
* Fix: a caption ending in an emoji right at the Show More cut could show only "... Show More" (the emoji was cut in half).
* Change: Social Post designs - the image now sits right under the caption; with Equal Card Height the spare space of shorter cards goes to the bottom, so likes rows still line up.
* Change: the Load More button is a neutral dark color instead of red.

= 0.0.7 =
* Privacy (GDPR): no Google Fonts are loaded any more - the Classic Card uses the theme's font, and the unused font import was removed from the admin screens.
* Privacy (GDPR): video files in the popup play in the browser's own player; the popup library no longer loads its Plyr player from cdn.plyr.io.
* Fix: Columns had no effect on the Social Post, Social Post - Image First and Simple Grid designs (their card list was not a grid). The grid now lives in one shared stylesheet for every grid design.
* Fix: Classic Card / Professional / Dark Cinematic repeated the same caption as title and description - the title is now the caption's first line and the description the rest.
* Fix: the editor's Playlist preview could stop the page with an error.
* Fix: red accent backgrounds removed from the editor previews (Facebook logo sat on a red circle in Light Mode).
* New: account picture also on Classic Card, Professional, Dark Cinematic and Playlist (editor preview and live site), with the platform logo next to the name.
* Change: Social Post images keep their real shape (a 16:9 video thumbnail is no longer cropped into a square).
* Change: posts cached by an older version are refreshed automatically, so new details (picture, shares) appear without clearing the cache by hand.

= 0.0.6 =
* New: "Social Post" design - account header (profile picture, name, time, platform logo), caption, image, then likes / comments / shares.
* New: "Social Post - Image First" design - image on top, then caption, account row and likes / comments / shares.
* New: Caption setting for both designs: "Show More" (characters before the link, custom Show More / Show Less texts, link color and typography) or "Scroll" (box height, scrollbar width, radius, color and track color).
* New: profile pictures for Facebook, Instagram, Threads and Pinterest; Facebook reactions and share counts; X repost counts.
* New: Facebook videos play in the popup or inline (the direct file when Facebook provides it, otherwise Facebook's own video player); X and Pinterest videos without a file use their own embed player.
* Change: every design shows the feed's own platform logo, a neutral play icon only on video posts, and "Likes" instead of "Views".
* Fix: Facebook requests lost every "{...}" field expansion (the URL escaping stripped the braces), so post attachments, videos and the page name / picture were never received.
* Fix: YouTube / Vimeo videos shared on a Facebook Page now play in the popup or inline; Facebook's own player is only used for real Facebook video / reel URLs.
* Fix: the popup's video player (iframe) no longer collapses to a thin strip.
* Fix: "Test Connection" no longer shows &quot; instead of quotes.
* Fix: videos that cannot be played no longer open their still image in the popup - they open the original post.
* Fix: Playlist layout - photos open the original post instead of an empty player.
* Removed: unused card actions and preview elements.

= 0.0.5 =
* New: Slider Style 3 "Carousel" (counter and arrows above the cards, progress bar below) for Grid and Reel layouts.
* New: Step 4 is split into Layout, Behaviors and Styles tabs. The Styles tab is available to everyone: card background (solid or gradient), border, margin, padding, shadow and gaps; color and typography for title, description and stats; image border and shadow; dedicated panels for the Playlist layout. Every row has a reset icon.
* New: Behaviors tab with Equal Card Height, slider arrow offsets, Auto Slide, Infinite Loop and Load More settings.
* New: "Show Likes" and "Show Date" display toggles.
* New: Cache Storage setting (WordPress transients or the plugin's own database table) and a Fallback Cache that shows the last successful posts when a platform request fails.
* New: Docs page "Customize Your Feed".
* Improvement: sliders fetch every post up to Max Posts (Load More settings no longer cap them), pause on keyboard focus and respect "reduce motion".
* Accessibility: slider buttons have translated labels and are announced as a carousel; Click Action options and Settings tabs are keyboard and screen-reader friendly.
* RTL: sliders work on right-to-left sites.
* Fix: items beyond "Initial Posts" could be hidden when another feed on the same page used Load More.
* Removed: the "Video Order" and "Pagination" options, which had no effect on social feeds.

= 0.0.4 =
* Fix: "Create New Feed" returned the new feed ID in the wrong response field, so the button did nothing.
* Fix: the admin app bundle is rebuilt from source, and its script dependencies/version now come from the build (no more stale cached JS). Requires WordPress 6.6+.
* Fix: Step 2/3 live preview received the wrong data shape and never rendered.
* Fix: "Max results" is now honoured on X and Pinterest (their APIs return at least 5 posts).
* Fix: "Load More" button now only appears when there really are more posts; one shared cache entry per feed instead of one per click.
* Fix: relative times ("5 minutes ago") were shifted by the site's timezone offset; counts like 999,999 now show as "1M".
* Fix: lightbox / inline play are only used for direct video files and images; social-network permalinks open in a new tab instead of a blank frame.
* Fix: Pinterest cards link to the pin itself; X videos now get a playable MP4.
* Fix: editor auto-save and "clear cache" now clear only the edited feed's cache instead of every feed's.
* Fix: unknown admin AJAX requests no longer produce an undefined-variable warning / null response; add-ons can hook `capsf_dashboard_ajax_custom_type`.
* Security: visitors no longer see raw platform API error messages (admins still do); failed API calls are cached for 5 minutes and use an 8-second timeout.
* Security: public "Load More" endpoint is rate-limited per visitor.
* Security: access tokens are masked in the admin UI and sent to Instagram/Facebook/Threads in an Authorization header instead of the URL.
* Security: feed type/status are validated against an allowlist; raw database errors are no longer returned to the browser; rollback only offers versions published on WordPress.org.
* Security: video/iframe players only accept http(s) URLs and run sandboxed.
* New: Instagram/Threads tokens are refreshed automatically; an admin notice appears if a refresh fails.
* Update: Facebook Graph API moved from the expired v19.0 to v25.0 (filter `capsf_facebook_graph_version`); X requests use api.x.com.
* Update: database table is created/upgraded on demand (multisite-safe); uninstall cleans every site on multisite.

= 0.0.3 =
* Sidebar UX: the collapse/expand toggle now crossfades directly over the brand logo on hover (logo/title area), instead of floating separately - hover away and the brand logo shows again.

= 0.0.2 =
* Added real platform logos (Instagram, Facebook, Twitter/X, Threads, Pinterest) throughout the admin UI and a new plugin icon.
* Sidebar UX fix: collapse/expand toggle now only appears on hover over the logo/title, so the plugin name displays on one line.
* Removed unused code and files (dead code paths, unused React components) for a smaller, cleaner codebase.
* Fixed a bug where the Load More button could throw a fatal error, and a bug where Step 2/3 live preview never loaded for the new platforms.

= 0.0.1 =
* Initial release - Instagram, Facebook, Twitter (X), Threads, and Pinterest feed support with multiple card layouts, Load More/Pagination/Lazy Load, Elementor and Gutenberg integration, and built-in setup documentation.
