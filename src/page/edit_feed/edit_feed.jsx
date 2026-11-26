/**
 * edit_feed.jsx - Trustindex-style 5-step wizard
 *
 * Step 1: Connect Channel
 * Step 2: Layout
 * Step 3: Mode
 * Step 4: Settings
 * Step 5: Insert Code
 *
 * @package captain-social-feed
 */

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { __, sprintf } from '@wordpress/i18n'
import CardBackgroundStyle from './controls/controls/CardBackgroundStyle.jsx'
import CardTextStyle from './controls/controls/CardTextStyle.jsx'
import CardImageStyle from './controls/controls/CardImageStyle.jsx'
import CaptionScrollStyle from './controls/controls/CaptionScrollStyle.jsx'
import DeviceSelect from './controls/controls/DeviceSelect.jsx'
import { useGlobalTooltip } from '../../context/AttentionPingContext.jsx'
import LivePreview from './live_preview.jsx'
import './edit_feed.scss'

/* ─── Style Presets ──────────────────────────────────────────────────────── */
const STYLE_PRESETS = [
    {
        key:     'light',
        label:   __( 'Light Mode', 'captain-social-feed' ),
        popular: true,
        bg:      '#ffffff',
        accent:  '#111827',
        sub:     '#6b7280',
        preview: { bg: '#f8f9fa', card: '#ffffff', border: '#e5e7eb', title: '#111827', meta: '#6b7280', shadow: '0 2px 10px rgba(0,0,0,0.08)' },
        settings: {
            card:        { normal: { bg_color: '#ffffff', border: { width: 1, style: 'solid', color: '#e5e7eb', radius: 10, unit: 'px', radiusUnit: 'px' }, box_shadow: { x: 0, y: 2, blur: 8, spread: 0, color: '#0000001a', inset: false } } },
            title:       { normal: { color: '#111827' } },
            description: { normal: { color: '#4b5563' } },
            channelName: { normal: { color: '#6b7280' } },
        },
    },
    {
        key:     'dark',
        label:   __( 'Dark Mode', 'captain-social-feed' ),
        popular: false,
        bg:      '#0f172a',
        accent:  '#f1f5f9',
        sub:     '#94a3b8',
        preview: { bg: '#0f172a', card: '#1e293b', border: '#334155', title: '#f1f5f9', meta: '#94a3b8', shadow: '0 4px 20px rgba(0,0,0,0.4)' },
        settings: {
            card:        { normal: { bg_color: '#1e293b', border: { width: 1, style: 'solid', color: '#334155', radius: 10, unit: 'px', radiusUnit: 'px' }, box_shadow: { x: 0, y: 4, blur: 16, spread: 0, color: '#00000040', inset: false } } },
            title:       { normal: { color: '#f1f5f9' } },
            description: { normal: { color: '#cbd5e1' } },
            channelName: { normal: { color: '#94a3b8' } },
        },
    },
]

/* ─── Layout definitions ─────────────────────────────────────────────────── */
/*
 * v2.0.0 CHANGE: "Slider" (style-5) and "Centered Carousel" (style-7) used
 * to be their own standalone card designs, each with their own markup. As
 * of v2.0.0 they're no longer separate designs - Slider is now a *display
 * mode* ("Slider style 1" / "Slider style 2") that can be applied on top of
 * ANY of the 3 grid designs below (Classic Card / Professional / Dark
 * Cinematic). See `getValidSliderMode()` + the "Layout: Grid / Slider"
 * toggle in Step2Layout below.
 */
const LAYOUTS = [
    {
        value:      'social-2',
        label:      __( 'Social Post', 'captain-social-feed' ),
        desc:       __( 'Account header, caption, image, then likes / comments / shares - like the post on the platform', 'captain-social-feed' ),
        categories: [ 'grid', 'single' ],
        popular:    true,
    },
    {
        value:      'social-1',
        label:      __( 'Social Post - Image First', 'captain-social-feed' ),
        desc:       __( 'Image on top, caption and account below, then likes / comments / shares', 'captain-social-feed' ),
        categories: [ 'grid', 'single' ],
        popular:    false,
    },
    {
        value:      'style-8',
        label:      __( 'Simple Grid', 'captain-social-feed' ),
        desc:       __( 'Square pictures - likes, comments and caption on hover; opens the post in a popup', 'captain-social-feed' ),
        categories: [ 'grid' ],
        popular:    false,
    },
    {
        value:      'style-1',
        label:      __( 'Classic Card', 'captain-social-feed' ),
        desc:       __( 'Image on top, title, caption and account below', 'captain-social-feed' ),
        categories: [ 'grid', 'single' ],
        popular:    false,
    },
    {
        value:      'style-2',
        label:      __( 'Professional', 'captain-social-feed' ),
        desc:       __( 'Clean horizontal account badge with arrow CTA', 'captain-social-feed' ),
        categories: [ 'grid', 'single' ],
        popular:    false,
    },
    {
        value:      'style-3',
        label:      __( 'Dark Cinematic', 'captain-social-feed' ),
        desc:       __( 'Full overlay on thumbnail with gradient', 'captain-social-feed' ),
        categories: [ 'grid', 'single' ],
        popular:    false,
    },
    {
        value:      'style-6',
        label:      __( 'Playlist', 'captain-social-feed' ),
        desc:       __( 'Featured post on the left, scrollable list on the right', 'captain-social-feed' ),
        categories: [ 'playlist' ],
        popular:    false,
    },
    {
        value:      'reel-1',
        label:      __( 'Reel Card', 'captain-social-feed' ),
        desc:       __( 'Portrait image with caption and likes - Reels-style browse card', 'captain-social-feed' ),
        categories: [ 'reel' ],
        popular:    false,
    },
]

/*
 * Twitter / X - Step 1 "What to show" (x_source) and the two X designs
 * (Step 2). X feeds use only these designs; other platforms never do.
 * Keep in sync with Capsf_Api_Twitter::SOURCES / Capsf_Shortcode::X_STYLES.
 */
const X_SOURCES = [
    { value: 'profile_timeline', label: __( 'Profile Timeline', 'captain-social-feed' ), desc: __( 'Your profile header (picture, name, follower counts, Follow button) with your latest posts in a scrolling list.', 'captain-social-feed' ), field: 'username', design: 'x-timeline' },
    { value: 'tweets_grid',      label: __( 'Tweets Grid', 'captain-social-feed' ),      desc: __( 'Your latest posts as cards in a grid.', 'captain-social-feed' ), field: 'username', design: 'x-grid' },
    { value: 'hashtag',          label: __( 'Hashtag Feed', 'captain-social-feed' ),     desc: __( 'Recent posts (last 7 days) with a #hashtag or search words, from anyone.', 'captain-social-feed' ), field: 'x_query', design: 'x-grid' },
    { value: 'testimonials',     label: __( 'Testimonials', 'captain-social-feed' ),     desc: __( 'Hand-picked posts about you, shown with 5 stars - paste their links.', 'captain-social-feed' ), field: 'x_tweet_ids', design: 'x-grid' },
    { value: 'sidebar',          label: __( 'Sidebar Widget', 'captain-social-feed' ),   desc: __( 'A compact profile timeline that fits a sidebar.', 'captain-social-feed' ), field: 'username', design: 'x-timeline' },
]
const X_CARD_STYLES = [ 'x-timeline', 'x-grid' ]
const X_LAYOUTS = [
    {
        value:      'x-timeline',
        label:      __( 'Profile Timeline', 'captain-social-feed' ),
        desc:       __( 'Profile header with a scrolling list of posts', 'captain-social-feed' ),
        categories: [ 'x' ],
        popular:    false,
    },
    {
        value:      'x-grid',
        label:      __( 'Tweets Grid', 'captain-social-feed' ),
        desc:       __( 'Post cards in a masonry grid - photos, videos, likes and Share', 'captain-social-feed' ),
        categories: [ 'x' ],
        popular:    false,
    },
]
const getXSource = settings => X_SOURCES.find( src => src.value === settings.x_source ) || X_SOURCES[ 0 ]
// Second Step 1 field per X source (the Bearer Token is always the first).
const getXSecondField = settings => {
    const field = getXSource( settings ).field
    if ( field === 'x_query' ) return { key: 'x_query', label: __( 'Hashtag or Search Words', 'captain-social-feed' ), placeholder: __( 'e.g. #WordPress', 'captain-social-feed' ), hint: __( 'One word becomes a #hashtag. X only searches posts from the last 7 days.', 'captain-social-feed' ) }
    if ( field === 'x_tweet_ids' ) return { key: 'x_tweet_ids', label: __( 'Post Links', 'captain-social-feed' ), placeholder: 'https://x.com/name/status/1234567890', hint: __( 'One link per line. Open a post on X and copy its address.', 'captain-social-feed' ), multiline: true }
    return { key: 'username', label: __( '@Username', 'captain-social-feed' ), placeholder: 'e.g. wordpress' }
}
// Mirrors Capsf_Shortcode::resolve_card_style().
const resolveCardStyle = ( settings, platform ) => {
    if ( platform === 'twitter' ) {
        return X_CARD_STYLES.includes( settings.card_style ) ? settings.card_style : getXSource( settings ).design
    }
    return X_CARD_STYLES.includes( settings.card_style ) ? 'style-1' : getValidCardStyle( settings.card_style )
}
// Profile + source details for the X design previews.
const XPreviewContext = createContext( { profile: null, stars: false, sidebar: false } )

/**
 * v2.0.0: "Slider" is now a display mode on top of the 3 grid designs
 * (Classic Card / Professional / Dark Cinematic), not its own design.
 *
 *   ''         → plain grid (default)
 *   'slider-1' → full-width track, arrows at the far left/right edges
 *                (same mechanism the old standalone "Slider" / style-5 used)
 *   'slider-2' → active card enlarged in the center, side cards peeking,
 *                arrows next to the active card (same mechanism the old
 *                standalone "Centered Carousel" / style-7 used)
 *   'slider-3' → "Carousel": counter + arrows in a toolbar above the
 *                track, progress bar below (same track as slider-1)
 *
 * getValidSliderMode() also transparently upgrades a pre-2.0.0 feed that
 * had card_style saved as 'style-5' or 'style-7' - no user action needed,
 * it just keeps looking the same. See the matching PHP-side shim in
 * class-capsf-shortcode.php (search "REMOVE-BY-v2.7.0").
 *
 * @param {Object} settings
 * @returns {''|'slider-1'|'slider-2'|'slider-3'}
 */
const SLIDER_MODES = [ 'slider-1', 'slider-2', 'slider-3' ]
const getValidSliderMode = settings => {
    if ( settings.card_style === 'style-5' ) return 'slider-1'
    if ( settings.card_style === 'style-7' ) return 'slider-2'
    const mode = settings.grid_slider_style
    return SLIDER_MODES.includes( mode ) ? mode : ''
}

/*
 * Playlist-family card styles (one featured post + a list) get their own
 * Styles-tab panels. Keep in sync with the style-6 check in
 * class-capsf-shortcode.php (get_playlist_panel_css()).
 */
const PLAYLIST_CARD_STYLES = [ 'style-6' ]

/**
 * Resolve a saved `card_style` value to a style that still exists in
 * LAYOUTS. If a style is ever removed in the future (like "Popup Player"
 * / style-4 was), any feed that had it selected automatically falls back
 * to 'style-1' instead of showing nothing selected or breaking the preview.
 *
 * @param {string} cardStyle - settings.card_style, possibly stale/removed.
 * @returns {string} A valid LAYOUTS value.
 */
const getValidCardStyle = cardStyle => {
    if ( cardStyle && ( LAYOUTS.some( l => l.value === cardStyle ) || X_CARD_STYLES.includes( cardStyle ) ) ) return cardStyle
    return 'style-1'
}

const LAYOUT_CATEGORIES = [
    { key: 'grid',     label: __( 'Grid',     'captain-social-feed' ) },
    { key: 'playlist', label: __( 'Playlist', 'captain-social-feed' ) },
    { key: 'single',   label: __( 'Single',   'captain-social-feed' ) },
    { key: 'reel',     label: __( 'Reel',     'captain-social-feed' ) },
]

/**
 * Every supported platform (Instagram/Facebook/Twitter/Threads/Pinterest)
 * uses the same full set of layout categories/styles - there's no
 * per-platform restriction, so this always returns every category.
 *
 * @returns {string[]}
 */
const getAllowedCategories = () => LAYOUT_CATEGORIES.map( c => c.key )

const MAX_OPTIONS = ['6', '9', '12', '18', '24', '30', '50']
const LOAD_MORE_OPTIONS = ['1', '2', '3', '4', '6', '9', '12']
const COLUMNS     = ['1', '2', '3', '4']
const PAGINATION_OPTIONS = [
    { value: 'none', label: __( 'None', 'captain-social-feed' ) },
    { value: 'load_more', label: __( 'Load More', 'captain-social-feed' ) },
]

// Only "none" and "load_more" are rendered by the shortcode; any other saved
// value (e.g. an old "pagination") behaves - and is shown - as "none".
const getPaginationType = settings => {
    const type = settings.pagination_type || ( settings.show_load_more ? 'load_more' : 'none' )
    return type === 'load_more' ? 'load_more' : 'none'
}

// Grid designs that can show as a single centered card ("Single" category).
const GRID_CARD_STYLES = [ 'social-1', 'social-2', 'style-1', 'style-2', 'style-3', 'style-8' ]
// Social Post designs - caption with Show More / scroll, author row, stats row.
const SOCIAL_CARD_STYLES = [ 'social-1', 'social-2' ]
// Styles with text below the image, where Equal Card Height applies.
const EQUAL_HEIGHT_CARD_STYLES = [ 'social-1', 'social-2', 'style-1', 'style-2' ]
// Text elements each card style renders - drives which Styles-tab panels show.
// Keep in sync with $panel_selectors in class-capsf-style-css-generator.php.
const CARD_TEXT_ELEMENTS = {
    // Social Post: "title" = the account name.
    'social-1': [ 'title', 'description', 'stats' ],
    'social-2': [ 'title', 'description', 'stats' ],
    'style-1': [ 'title', 'description', 'stats' ],
    'style-2': [ 'title', 'stats' ],
    'style-3': [ 'title', 'description', 'stats' ],
    'style-8': [],
    'reel-1':  [ 'title', 'stats' ],
    'x-timeline': [ 'title', 'description', 'stats' ],
    'x-grid':     [ 'title', 'description', 'stats' ],
}

// Settings → Layout → Show Posts (filtered in Capsf_Shortcode::POST_FILTERS).
const POST_FILTER_OPTIONS = [
    { key: 'all',   label: __( 'All', 'captain-social-feed' ),       hint: __( 'Every post: photos, videos and text.', 'captain-social-feed' ) },
    { key: 'video', label: __( 'Videos', 'captain-social-feed' ),    hint: __( 'Only video posts and reels.', 'captain-social-feed' ) },
    { key: 'photo', label: __( 'Photos', 'captain-social-feed' ),    hint: __( 'Only posts with a photo (albums included).', 'captain-social-feed' ) },
    { key: 'text',  label: __( 'Text Only', 'captain-social-feed' ), hint: __( 'Only posts without a photo or video - just the caption.', 'captain-social-feed' ) },
]

// Step 4 → Click Action. Popup / inline only apply to posts with a real
// image or video file; anything else opens the original post (see
// get_play_attrs() in class-capsf-shortcode.php).
const PLAY_MODE_OPTIONS = [
    {
        value: 'platform',
        icon: <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' /><polyline points='15 3 21 3 21 9' /><line x1='10' y1='14' x2='21' y2='3' /></svg>,
        label: __( 'Open Original Post', 'captain-social-feed' ),
        desc:  __( 'Clicking opens the post on the original platform in a new tab.', 'captain-social-feed' ),
        badge: __( 'Open Post', 'captain-social-feed' ),
    },
    {
        value: 'lightbox',
        icon: <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='3' width='20' height='14' rx='2'/><circle cx='12' cy='10' r='3' fill='currentColor' stroke='none'/><polygon points='10.5,8.5 14.5,10 10.5,11.5' fill='var(--capsf-bg-secondary)' stroke='none'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>,
        label: __( 'Open in Popup', 'captain-social-feed' ),
        desc:  __( 'Photos and videos open in a popup lightbox. Other posts open the original post.', 'captain-social-feed' ),
        badge: __( 'Popup', 'captain-social-feed' ),
    },
    {
        value: 'inline',
        icon: <svg viewBox='0 0 24 24' width='22' height='22' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'/><polygon points='10,9 16,12 10,15' fill='currentColor' stroke='none'/></svg>,
        label: __( 'Play Inline on Page', 'captain-social-feed' ),
        desc:  __( 'Videos play right inside the card. Photos and other posts open the original post.', 'captain-social-feed' ),
        badge: __( 'Inline', 'captain-social-feed' ),
    },
]

/* ─── Progress Bar ───────────────────────────────────────────────────────── */
const STEPS = [
    __( 'Connect Channel', 'captain-social-feed' ),
    __( 'Select Layout',   'captain-social-feed' ),
    __( 'Settings',        'captain-social-feed' ),
    __( 'Insert Code',     'captain-social-feed' ),
]

const LAST_STEP = STEPS.length

// Renders its children into the Next slot in the progress bar (see
// WizardProgress) - each step keeps its own Next button logic, but the
// button sits next to Back at the top.
const NextPortal = ( { slot, children } ) => slot ? createPortal( children, slot ) : null

// Small "i" icon with an explanation on hover / focus (the app's shared tooltip bubble).
const InfoTip = ( { text } ) => {
    const tip = useGlobalTooltip( text )
    return (
        <span className='capsf-info-tip' tabIndex='0' role='img' aria-label={ text } { ...tip }>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13' aria-hidden='true'>
                <circle cx='12' cy='12' r='10' /><line x1='12' y1='16' x2='12' y2='12' /><line x1='12' y1='8' x2='12.01' y2='8' />
            </svg>
        </span>
    )
}


const WizardProgress = ( { current, onStepClick, maxReached, onBack, saving, onNextSlotMount, showNext = true } ) => (
    <div className='capsf-wiz-progress'>
        { STEPS.map( ( label, i ) => {
            const idx       = i + 1
            const done      = idx < current
            const active    = idx === current
            const clickable = idx <= maxReached
            return (
                <React.Fragment key={ idx }>
                    <button
                        className={ `capsf-wiz-step${ done ? ' done' : '' }${ active ? ' active' : '' }${ clickable ? ' clickable' : '' }` }
                        onClick={ () => clickable && onStepClick( idx ) }
                        disabled={ !clickable }
                        title={ label }
                    >
                        <span className='capsf-wiz-step-num'>
                            { done ? (
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' width='13' height='13'><polyline points='20 6 9 17 4 12'/></svg>
                            ) : idx }
                        </span>
                        <span className='capsf-wiz-step-label'>{ label }</span>
                    </button>
                    { i < STEPS.length - 1 && (
                        <svg className='capsf-wiz-arrow' viewBox='0 0 8 14' fill='none' xmlns='http://www.w3.org/2000/svg' width='8' height='14'>
                            <polyline points='1,1 7,7 1,13' stroke='#d1d5db' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'/>
                        </svg>
                    ) }
                </React.Fragment>
            )
        } ) }

        {/* Right side: saving + Back + the active step's Next (portaled in, see NextPortal). */}
        <div className='capsf-wiz-progress-end'>
            { saving && <span className='capsf-saving-indicator'>{ __( 'Saving…', 'captain-social-feed' ) }</span> }
            <button className='capsf-back-btn' onClick={ onBack }>
                { __( 'Back', 'captain-social-feed' ) }
            </button>
            { showNext && <div className='capsf-wiz-progress-next-slot' ref={ onNextSlotMount } /> }
        </div>
    </div>
)

/* ─── Thumbnail wrapper - reliable 16:9 box in WP admin ─────────────────── */
const ThumbBox = ( { children, dark = false, shorts = false, reel = false, square = false, thumb = '' } ) => (
    <div className={ `capsf-mc-thumbbox${ dark ? ' dark' : '' }${ shorts ? ' shorts' : '' }${ reel ? ' reel' : '' }${ square ? ' square' : '' }` }>
        { thumb && (
            <img
                src={ thumb }
                alt=''
                className='capsf-mc-real-thumb'
                loading='lazy'
                onError={ e => { e.target.style.display = 'none' } }
            />
        ) }
        <div className='capsf-mc-thumbbox-inner'>
            { children }
        </div>
    </div>
)

/* ─── Mock video data ────────────────────────────────────────────────────── */
const MOCK_VIDEOS = [
    { title: 'Behind the scenes of our new collection', channel: 'your_account', views_label: '1.2K', time_ago_label: '3 days ago', likes: '1.2K', comments: '84', shares: '12' },
    { title: 'Five tips for better photos on your phone', channel: 'your_account', views_label: '980', time_ago_label: '1 week ago', likes: '980', comments: '41', shares: '7' },
    { title: 'Thank you for 10K followers!', channel: 'your_account', views_label: '2.1K', time_ago_label: '2 days ago', likes: '2.1K', comments: '230', shares: '35' },
]

/* ─── Platform logo - same mask-based icon as the frontend
 * (assets/css/frontend.css, enqueued on this admin page). ─────────────── */
const PlatformIcon = ( { platform } ) => (
    platform ? <span className={ `capsf-platform-icon capsf-platform-icon--${ platform }` } aria-hidden='true' /> : null
)

/* Account picture, or the platform logo when there is none - same as
 * Capsf_Shortcode::avatar_or_icon() on the live site. */
const AvatarOrIcon = ( { v, size } ) => (
    v?.avatar
        ? <img className='capsf-avatar' src={ v.avatar } alt='' width={ size } height={ size } loading='lazy' referrerPolicy='no-referrer' />
        : <PlatformIcon platform={ v?.platform } />
)
/* Platform logo after the name - only when the picture took its place. */
const TrailingIcon = ( { v } ) => ( v?.avatar ? <PlatformIcon platform={ v.platform } /> : null )

/*
 * Caption settings (Layout tab → Caption) for the Social Post previews -
 * provided once by EditFeed so every mock in Step 2 / 3 follows them.
 */
const CaptionContext = createContext( { mode: 'show_more', limit: 120, more: '', less: '' } )

/* ─── Social Post caption - Show More / Show Less, or scroll box ─────────── */
const SocialCaption = ( { text } ) => {
    const { mode, limit, more, less } = useContext( CaptionContext )
    const [ open, setOpen ] = useState( false )
    if ( ! text ) return null
    if ( mode === 'scroll' ) {
        return (
            <div className='capsf-sc-caption capsf-sc-caption--scroll' tabIndex={ 0 } role='region' aria-label={ __( 'Post caption', 'captain-social-feed' ) }>
                <p className='capsf-sc-caption-text'><span className='capsf-sc-caption-full'>{ text }</span></p>
            </div>
        )
    }
    // Count / cut by characters, not UTF-16 units - text.slice() can split an
    // emoji in half (same rule as the PHP side, mb_substr()).
    const chars = Array.from( text )
    const long  = chars.length > limit
    const short = long ? chars.slice( 0, limit ).join( '' ).replace( /\s+\S*$/u, '' ) : text
    return (
        <div className='capsf-sc-caption'>
            <p className='capsf-sc-caption-text'>
                { long && ! open
                    ? <span className='capsf-sc-caption-short'>{ short }<span aria-hidden='true'> ...</span></span>
                    : <span className='capsf-sc-caption-full'>{ text }</span> }
                { long && <>{ ' ' }<button
                    type='button'
                    className='capsf-sc-more'
                    aria-expanded={ open }
                    onClick={ e => { e.stopPropagation(); setOpen( o => ! o ) } }
                >{ open ? ( less || __( 'Show Less', 'captain-social-feed' ) ) : ( more || __( 'Show More', 'captain-social-feed' ) ) }</button></> }
            </p>
        </div>
    )
}

/* ─── Social Post designs (social-1 / social-2) - real frontend markup ──── */
const SocialAuthor = ( { v } ) => (
    <div className='capsf-sc-author'>
        { v.avatar
            ? <img className='capsf-sc-avatar' src={ v.avatar } alt='' width='44' height='44' loading='lazy' referrerPolicy='no-referrer' />
            : <span className='capsf-sc-avatar capsf-sc-avatar--initial' aria-hidden='true'>{ ( v.channel || '?' ).charAt( 0 ).toUpperCase() }</span> }
        <div className='capsf-sc-author-meta'>
            <span className='capsf-sc-author-name'>{ v.channel }</span>
            { v.time_ago_label && <span className='capsf-sc-time'>{ v.time_ago_label }</span> }
        </div>
        <span className='capsf-sc-platform'><PlatformIcon platform={ v.platform } /></span>
    </div>
)

const SocialMedia = ( { v } ) => ( v.thumbnail ? (
    <span className={ `capsf-sc-media${ v.is_video ? ' capsf-sc-media--video' : '' }` }>
        <img className='capsf-sc-image' src={ v.thumbnail } alt='' loading='lazy' onError={ e => { e.target.style.display = 'none' } } />
        { v.is_video && <span className='capsf-sc-play'><PlayIcon /></span> }
    </span>
) : null )

const SocialStats = ( { v } ) => (
    <div className='capsf-sc-stats'>
        <span className='capsf-sc-stat'>
            { v.platform === 'facebook' ? (
                <span className='capsf-sc-reactions' aria-hidden='true'>
                    <svg className='capsf-sc-reaction capsf-sc-reaction--like' viewBox='0 0 24 24'><circle cx='12' cy='12' r='12'/><path d='M7 11h2v6H7zm3 6v-6l2.6-4.2c.4-.6 1.4-.3 1.4.4V10h3c.7 0 1.2.6 1 1.3l-1.2 4.8c-.1.5-.6.9-1.1.9z' fill='#fff'/></svg>
                    <svg className='capsf-sc-reaction capsf-sc-reaction--love' viewBox='0 0 24 24'><circle cx='12' cy='12' r='12'/><path d='M12 17.5s-5-3.1-5-6.6C7 9.2 8.2 8 9.7 8c1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.5 0 2.7 1.2 2.7 2.9 0 3.5-5 6.6-5 6.6z' fill='#fff'/></svg>
                </span>
            ) : (
                <svg className='capsf-sc-stat-icon' viewBox='0 0 24 24' aria-hidden='true'><path d='M12 20.3s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.4-7.5 10-7.5 10z' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round'/></svg>
            ) }
            { v.likes ?? '0' }
        </span>
        <span className='capsf-sc-stat'>
            <svg className='capsf-sc-stat-icon' viewBox='0 0 24 24' aria-hidden='true'><path d='M4 5h16v11H9l-5 4z' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round'/></svg>
            { v.comments ?? '0' }
        </span>
        <span className='capsf-sc-stat'>
            <svg className='capsf-sc-stat-icon' viewBox='0 0 24 24' aria-hidden='true'><path d='M14 5l6 6-6 6v-3.5c-4.5 0-7.5 1.2-10 4.5 1-4.8 4-8.6 10-9.5z' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinejoin='round'/></svg>
            { v.shares ?? '0' }
        </span>
    </div>
)

const makeSocialMock = ( headerTop ) => ( { videos } ) => (
    <div className='capsf-feed capsf-mc-social'>
        <div className='capsf-mc-grid3'>
            { ( videos || [] ).map( ( v, i ) => (
                <article key={ i } className={ `capsf-sc-card ${ headerTop ? 'capsf-sc-card--header-top' : 'capsf-sc-card--media-top' }` }>
                    { headerTop ? (
                        <>
                            <header className='capsf-sc-head'><SocialAuthor v={ v } /></header>
                            <div className='capsf-sc-body'>
                                <SocialCaption text={ v.caption || v.description || v.title } />
                                <SocialMedia v={ v } />
                            </div>
                        </>
                    ) : (
                        <>
                            <SocialMedia v={ v } />
                            <div className='capsf-sc-body'>
                                <SocialCaption text={ v.caption || v.description || v.title } />
                                <SocialAuthor v={ v } />
                            </div>
                        </>
                    ) }
                    <SocialStats v={ v } />
                </article>
            ) ) }
        </div>
    </div>
)
const MockCardSocial1 = makeSocialMock( false )
const MockCardSocial2 = makeSocialMock( true )

/* ─── Play icon ──────────────────────────────────────────────────────────── */
const PlayIcon = () => (
    <div className='capsf-mc-play-icon'>
        <svg width='16' height='16' viewBox='0 0 24 24' fill='white'><polygon points='6,3 20,12 6,21'/></svg>
    </div>
)

/* ─── Style-1: Classic Card - exact frontend match ───────────────────────── */
const MockCardS1 = ( { videos } ) => {
    const data = videos || []
    return (
        <div className='capsf-mc-grid3'>
            { data.map( ( v, i ) => (
                <div key={ i } className='capsf-mc-s1-card'>
                    {/* Thumbnail */}
                    <div className='capsf-mc-s1-thumb-wrap'>
                        <ThumbBox thumb={ v.thumbnail || '' }>
                            { v.is_video && <div className='capsf-mc-s1-play'><PlayIcon /></div> }
                            { v.duration_label && <span className='capsf-mc-dur'>{ v.duration_label }</span> }
                        </ThumbBox>
                    </div>
                    {/* Card content */}
                    <div className='capsf-mc-s1-content'>
                        <div className='capsf-mc-s1-title'>{ v.title }</div>
                        { v.description && (
                            <div className='capsf-mc-s1-desc'>{ v.description }</div>
                        ) }
                        { ( v.views_label || v.time_ago_label ) && (
                            <div className='capsf-mc-stats'>
                                { [ v.views_label && `${ v.views_label } ${ __( 'Likes', 'captain-social-feed' ) }`, v.time_ago_label ].filter( Boolean ).join( ' • ' ) }
                            </div>
                        ) }
                        <div className='capsf-mc-s1-channel'>
                            <div className='capsf-mc-s1-dot'>
                                <AvatarOrIcon v={ v } size={ 20 } />
                            </div>
                            <span className='capsf-mc-s1-chname'>{ v.channel }</span>
                            <span className='capsf-mc-s1-platform'><TrailingIcon v={ v } /></span>
                        </div>
                    </div>
                </div>
            ) ) }
        </div>
    )
}

/* ─── Style-2: Professional - exact frontend match ───────────────────────── */
const MockCardS2 = ( { videos } ) => {
    const data = videos || []
    return (
    <div className='capsf-mc-grid3'>
        { data.map( ( v, i ) => (
            <div key={ i } className='capsf-mc-s2-wrap'>
                { /* Thumbnail */ }
                <div className='capsf-mc-s2-thumb'>
                    <div className='capsf-mc-s2-thumbbox'>
                        { v.thumbnail && <img src={ v.thumbnail } alt='' className='capsf-mc-real-thumb' loading='lazy' onError={ e => { e.target.style.display = 'none' } } /> }
                    </div>
                    { v.is_video && <div className='capsf-mc-s2-play'><PlayIcon /></div> }
                    { v.duration_label && <span className='capsf-mc-dur'>{ v.duration_label }</span> }
                </div>

                { /* Card body */ }
                <div className='capsf-mc-s2-body'>
                    { /* Account badge - platform logo + name */ }
                    <span className='capsf-mc-s2-badge'>
                        <AvatarOrIcon v={ v } size={ 16 } />
                        { v.channel }
                        <TrailingIcon v={ v } />
                    </span>

                    { /* Title */ }
                    <h3 className='capsf-mc-s2-title'>{ v.title }</h3>

                    { v.description && (
                        <p className='capsf-mc-s2-desc'>{ v.description }</p>
                    ) }

                    { ( v.views_label || v.time_ago_label ) && (
                        <div className='capsf-mc-stats'>
                            { [ v.views_label && `${ v.views_label } ${ __( 'Likes', 'captain-social-feed' ) }`, v.time_ago_label ].filter( Boolean ).join( ' • ' ) }
                        </div>
                    ) }

                    { /* Footer */ }
                    <div className='capsf-mc-s2-footer'>
                        <span className='capsf-mc-s2-chname'>{ v.channel }</span>
                        <div className='capsf-mc-s2-arrow'>
                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='14' height='14'>
                                <line x1='5' y1='12' x2='19' y2='12'/>
                                <polyline points='12 5 19 12 12 19'/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        ) ) }
    </div>
    )
}

/* ─── Style-3: Dark Cinematic ────────────────────────────────────────────── */
const MockCardS3 = ( { videos } ) => {
    const data = videos || []
    return (
    <div className='capsf-mc-grid3'>
        { data.map( ( v, i ) => (
            <div key={ i } className='capsf-mc-card-wrap s3'>
                <ThumbBox dark thumb={ v.thumbnail || '' }>
                    { v.is_video && <PlayIcon /> }
                    { v.duration_label && <span className='capsf-mc-dur'>{ v.duration_label }</span> }
                    <div className='capsf-mc-s3-overlay'>
                        <div className='capsf-mc-s3-top'>
                            {/* Same white logo as the live badge (frontend.css). */}
                            <span className='capsf-s3-channel-badge'><AvatarOrIcon v={ v } size={ 16 } /></span>
                            <span className='capsf-mc-s3-ch'>{ v.channel }</span>
                            <span className='capsf-s3-channel-badge'><TrailingIcon v={ v } /></span>
                        </div>
                        <div>
                            <div className='capsf-mc-ttl white'>{ v.title }</div>
                            { ( v.views_label || v.time_ago_label ) && (
                                <div className='capsf-mc-stats capsf-mc-stats--white'>
                                    { [ v.views_label && `${ v.views_label } ${ __( 'Likes', 'captain-social-feed' ) }`, v.time_ago_label ].filter( Boolean ).join( ' • ' ) }
                                </div>
                            ) }
                        </div>
                    </div>
                </ThumbBox>
            </div>
        ) ) }
    </div>
    )
}

/* ─── Style-8: Simple Grid - exact frontend match ────────────────────────── */
const MockCardS8 = ( { videos } ) => {
    const data = videos || []
    return (
        <div className='capsf-mc-grid3'>
            { data.map( ( v, i ) => (
                <div key={ i } className='capsf-mc-card-wrap capsf-mc-s8-wrap'>
                    <ThumbBox square thumb={ v.thumbnail || '' }>
                        { ( v.is_album || v.is_video ) && (
                            <span className='capsf-mc-s8-badge' aria-hidden='true'>
                                { v.is_album
                                    ? <svg viewBox='0 0 24 24' width='18' height='18'><path d='M8 2h11a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z' fill='#fff'/><path d='M2 8v11a3 3 0 0 0 3 3h11' fill='none' stroke='#fff' strokeWidth='2' strokeLinecap='round'/></svg>
                                    : <svg viewBox='0 0 24 24' width='18' height='18'><rect x='2' y='2' width='20' height='20' rx='5' fill='#fff'/><path d='M10 8.5v7l6-3.5z' fill='#000'/></svg> }
                            </span>
                        ) }
                        <div className='capsf-mc-s8-overlay'>
                            <span className='capsf-mc-s8-stats'>♡ { v.likes } &nbsp; 💬 { v.comments }</span>
                            { v.caption && <span className='capsf-mc-s8-caption'>{ v.caption }</span> }
                        </div>
                    </ThumbBox>
                </div>
            ) ) }
        </div>
    )
}

/**
 * v2.0.0: "Slider" is now a display mode, not its own design - this wraps
 * ANY of the 3 grid mock previews (Classic Card / Professional / Dark
 * Cinematic) with the same arrow + dots frame Style-5/Style-7's standalone
 * mocks used to have.
 *
 * `variant='slider-1'` (Equal Cards): plain arrows around the 3 cards,
 * all equal size - matches the old Style-5 mock.
 * `variant='slider-2'` (Spotlight): the middle card is enlarged/highlighted
 * and the side cards are scaled down and faded, via the `capsf-mc-
 * spotlight` CSS below - matches the old Style-7 (Centered Carousel) mock.
 * This is pure CSS on top of the SAME underlying design markup (no
 * separate per-style-2 component needed), so it automatically works
 * whichever of the 3 grid designs is currently selected.
 * `variant='slider-3'` (Carousel): counter + prev/next buttons in a
 * toolbar ABOVE the cards, progress bar below instead of dots - matches
 * the frontend's `capsf-s5-wrapper--carousel` markup.
 */
const SliderPreviewFrame = ( { children, variant = 'slider-1' } ) => variant === 'slider-3' ? (
    <div className='capsf-mc-s5-wrap capsf-mc-s5-wrap--carousel'>
        <div className='capsf-mc-s5-toolbar' aria-hidden='true'>
            <span className='capsf-mc-s5-counter'>{ '01 / 03' }</span>
            <span className='capsf-mc-s5-tbtn'>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='14' height='14'><polyline points='15 18 9 12 15 6'/></svg>
            </span>
            <span className='capsf-mc-s5-tbtn'>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='14' height='14'><polyline points='9 18 15 12 9 6'/></svg>
            </span>
        </div>
        { children }
        <div className='capsf-mc-s5-progress' aria-hidden='true'><div className='capsf-mc-s5-progress-bar' /></div>
    </div>
) : (
    <div className={ `capsf-mc-s5-wrap${ variant === 'slider-2' ? ' capsf-mc-spotlight' : '' }` }>
        <div className='capsf-mc-s5-arrow capsf-mc-s5-arrow--left'>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='16' height='16'><polyline points='15 18 9 12 15 6'/></svg>
        </div>
        <div className='capsf-mc-s5-arrow capsf-mc-s5-arrow--right'>
            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='16' height='16'><polyline points='9 18 15 12 9 6'/></svg>
        </div>
        { children }
        <div className='capsf-mc-s5-dots'>
            { [0,1,2].map( i => <div key={i} className={ `capsf-mc-s5-dot${ i === 1 ? ' active' : '' }` } /> ) }
        </div>
    </div>
)

/* ─── Reel Card mock ──────────────────────────────────────────────────────── */
const MockCardReel = ( { videos } ) => {
    const data = ( videos && videos.length ) ? videos : MOCK_VIDEOS
    return (
    <div className='capsf-mc-reel-grid'>
        { data.map( ( v, i ) => (
            <div key={ i } className='capsf-mc-reel-card'>
                <ThumbBox reel thumb={ v.thumbnail || '' }>
                    { v.is_video && <PlayIcon /> }
                    { v.duration_label && <span className='capsf-mc-dur'>{ v.duration_label }</span> }
                </ThumbBox>
                <div className='capsf-mc-reel-content'>
                    <div className='capsf-mc-reel-title'>{ v.title }</div>
                    <PlatformIcon platform={ v.platform } />
                </div>
                { v.views_label ? (
                    <div className='capsf-mc-reel-views'>{ `${ v.views_label } ${ __( 'likes', 'captain-social-feed' ) }` }</div>
                ) : null }
            </div>
        ) ) }
    </div>
    )
}

/* ─── Style-6: Playlist mock ─────────────────────────────────────────────── */
const MockCardS6 = ( { videos } ) => {
    const data = ( videos && videos.length ) ? videos : MOCK_VIDEOS
    const featured = data[0]
    const list     = data.slice( 1 )
    return (
        <div className='capsf-mc-s6-wrap'>
            {/* Featured left */}
            <div className='capsf-mc-s6-featured'>
                <ThumbBox thumb={ featured?.thumbnail || '' }>
                    { featured?.is_video && <div className='capsf-mc-s1-play'><PlayIcon /></div> }
                    { featured?.duration_label && <span className='capsf-mc-dur'>{ featured.duration_label }</span> }
                </ThumbBox>
                <div className='capsf-mc-s6-feat-info'>
                    <div className='capsf-mc-s6-feat-title'>{ featured?.title }</div>
                    { ( featured?.views_label || featured?.time_ago_label ) && (
                        <div className='capsf-mc-stats'>
                            { [ featured.views_label && `${ featured.views_label } ${ __( 'Likes', 'captain-social-feed' ) }`, featured.time_ago_label ].filter( Boolean ).join( ' • ' ) }
                        </div>
                    ) }
                    <div className='capsf-mc-s6-feat-ch'>
                        <AvatarOrIcon v={ featured } size={ 18 } />
                        { featured?.channel }
                        <TrailingIcon v={ featured } />
                    </div>
                </div>
            </div>
            {/* List right */}
            <div className='capsf-mc-s6-list'>
                { list.map( ( v, i ) => (
                    <div key={ i } className='capsf-mc-s6-item'>
                        <div className='capsf-mc-s6-thumb'>
                            <ThumbBox thumb={ v.thumbnail || '' }>
                                <svg viewBox='0 0 24 24' fill='white' width='14' height='14'><polygon points='5,3 19,12 5,21'/></svg>
                                { v.duration_label && <span className='capsf-mc-dur capsf-mc-dur--sm'>{ v.duration_label }</span> }
                            </ThumbBox>
                        </div>
                        <div className='capsf-mc-s6-info'>
                            <div className='capsf-mc-s6-title'>{ v.title }</div>
                            <div className='capsf-mc-s6-ch'>
                                { [ v.channel, v.views_label && `${ v.views_label } ${ __( 'Likes', 'captain-social-feed' ) }`, v.time_ago_label ].filter( Boolean ).join( ' · ' ) }
                            </div>
                        </div>
                    </div>
                ) ) }
            </div>
        </div>
    )
}



const RealPreviewEmpty = ( { videoStatus } ) => (
    <div className='capsf-mc-empty'>
        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' width='34' height='34'>
            <rect x='3' y='5' width='18' height='14' rx='2'/>
            <polygon points='10,9 16,12 10,15'/>
        </svg>
        <span>
            { videoStatus === 'error'
                ? __( 'Real preview data could not be loaded. Check the credentials in Step 1.', 'captain-social-feed' )
                : __( 'No posts found for this feed yet.', 'captain-social-feed' ) }
        </span>
    </div>
)

/* ─── X designs (Step 2 previews) ────────────────────────────────────────── */
const XVerified = () => <svg className='capsf-x-verified' viewBox='0 0 24 24' aria-hidden='true'><path d='M22.5 12.5c0-1.58-.88-2.95-2.18-3.65.15-.44.23-.91.23-1.4 0-2.21-1.71-4-3.83-4-.47 0-.92.08-1.34.25C14.77 2.38 13.48 1.5 12 1.5s-2.77.88-3.38 2.19c-.42-.17-.87-.25-1.34-.25-2.12 0-3.83 1.79-3.83 4 0 .49.08.96.23 1.4C2.38 9.55 1.5 10.92 1.5 12.5c0 1.5.79 2.8 1.98 3.52-.04.24-.06.49-.06.73 0 2.21 1.71 4 3.83 4 .47 0 .92-.09 1.34-.25.61 1.31 1.9 2.19 3.38 2.19 1.49 0 2.78-.88 3.38-2.19.42.16.87.25 1.34.25 2.12 0 3.83-1.79 3.83-4 0-.24-.02-.49-.06-.73 1.19-.72 1.98-2.02 1.98-3.52zm-6.13-3.6-5.12 7.13-3.3-3.3 1.06-1.06 2.06 2.06 4.08-5.68z'/></svg>

const XTweetMock = ( { v, stars } ) => {
    const images = v.images?.length ? v.images.slice( 0, 4 ) : ( v.thumbnail ? [ v.thumbnail ] : [] )
    return (
        <article className='capsf-x-card'>
            { v.reposted_by && <p className='capsf-x-repost'>{ sprintf( __( '%s Reposted', 'captain-social-feed' ), v.reposted_by ) }</p> }
            <header className='capsf-x-head'>
                { v.avatar
                    ? <img className='capsf-x-avatar' src={ v.avatar } alt='' width='40' height='40' referrerPolicy='no-referrer' />
                    : <span className='capsf-x-avatar capsf-x-avatar--initial' aria-hidden='true'>{ ( v.channel || '?' ).charAt( 0 ).toUpperCase() }</span> }
                <div className='capsf-x-names'>
                    <span className='capsf-x-name'>{ v.channel }{ v.verified && <XVerified /> }</span>
                    <span className='capsf-x-meta'>
                        { v.username && <span className='capsf-x-handle'>@{ v.username }</span> }
                        { v.time_ago_label && <span className='capsf-x-time'>{ v.time_ago_label }</span> }
                    </span>
                </div>
                <span className='capsf-x-logo'><span className='capsf-platform-icon capsf-platform-icon--twitter' aria-hidden='true' /></span>
            </header>
            { stars && <div className='capsf-x-stars' aria-hidden='true'>{ [ 0, 1, 2, 3, 4 ].map( i => <svg key={ i } viewBox='0 0 24 24'><path d='M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.5L12 17.3l-5.9 3.2 1.3-6.5L2.5 9.4l6.6-.8z'/></svg> ) }</div> }
            { v.caption && <p className='capsf-x-text'>{ v.caption }</p> }
            { v.is_video && v.thumbnail ? (
                <div className='capsf-x-media capsf-x-media--video'>
                    <img src={ v.thumbnail } alt='' />
                    <span className='capsf-x-play'><svg className='capsf-play-icon' viewBox='0 0 48 48' aria-hidden='true'><circle cx='24' cy='24' r='24' fill='rgba(0,0,0,.55)'/><path d='M19 15l15 9-15 9z' fill='#fff'/></svg></span>
                </div>
            ) : images.length > 0 && (
                <div className={ `capsf-x-media capsf-x-media--${ images.length }` }>
                    { images.map( src => <a key={ src } href='#' onClick={ e => e.preventDefault() } tabIndex={ -1 }><img src={ src } alt='' /></a> ) }
                </div>
            ) }
            <footer className='capsf-x-actions'>
                <span className='capsf-x-action'>💬 { v.replies || v.comments }</span>
                <span className='capsf-x-action'>⟳ { v.shares }</span>
                <span className='capsf-x-action'>♡ { v.likes }</span>
                <span className='capsf-x-action' style={ { marginInlineStart: 'auto' } }>{ __( 'Share', 'captain-social-feed' ) }</span>
            </footer>
        </article>
    )
}

const MockCardXGrid = ( { videos = [] } ) => {
    const { stars } = useContext( XPreviewContext )
    return (
        <div className='capsf-feed capsf-x-preview'>
            <div className='capsf-x-grid'>
                { videos.slice( 0, 3 ).map( ( v, i ) => <XTweetMock key={ i } v={ v } stars={ stars } /> ) }
            </div>
        </div>
    )
}

const MockCardXTimeline = ( { videos = [] } ) => {
    const { profile, sidebar } = useContext( XPreviewContext )
    return (
        <div className='capsf-feed capsf-x-preview'>
            <div className={ `capsf-x-timeline${ sidebar ? ' capsf-x-timeline--sidebar' : '' }` }>
                { profile && (
                    <header className='capsf-x-profile'>
                        <div className='capsf-x-banner' style={ profile.banner ? { backgroundImage: `url(${ profile.banner })` } : undefined } />
                        <div className='capsf-x-profile-row'>
                            { profile.avatar && <img className='capsf-x-profile-avatar' src={ profile.avatar } alt='' width='80' height='80' referrerPolicy='no-referrer' /> }
                            <div className='capsf-x-profile-names'>
                                <span className='capsf-x-profile-name'>{ profile.name }{ profile.verified && <XVerified /> }</span>
                                <span className='capsf-x-profile-handle'>@{ profile.username }</span>
                            </div>
                            <span className='capsf-x-follow'><span className='capsf-platform-icon capsf-platform-icon--twitter' aria-hidden='true' />{ __( 'Follow', 'captain-social-feed' ) }</span>
                        </div>
                        <dl className='capsf-x-profile-stats'>
                            <div><dt>{ __( 'Posts', 'captain-social-feed' ) }</dt><dd>{ profile.posts_label }</dd></div>
                            <div><dt>{ __( 'Following', 'captain-social-feed' ) }</dt><dd>{ profile.following_label }</dd></div>
                            <div><dt>{ __( 'Followers', 'captain-social-feed' ) }</dt><dd>{ profile.followers_label }</dd></div>
                        </dl>
                    </header>
                ) }
                <div className='capsf-x-list' style={ { maxHeight: 420 } }>
                    { videos.slice( 0, 3 ).map( ( v, i ) => <XTweetMock key={ i } v={ v } /> ) }
                </div>
            </div>
        </div>
    )
}

/* ─── Mock card map ──────────────────────────────────────────────────────── */
const MOCK_CARD_MAP = {
    'social-1': MockCardSocial1,
    'social-2': MockCardSocial2,
    'style-1':  MockCardS1,
    'style-2':  MockCardS2,
    'style-3':  MockCardS3,
    'style-6':  MockCardS6,
    'style-8':  MockCardS8,
    'reel-1':   MockCardReel,
    'x-timeline': MockCardXTimeline,
    'x-grid':     MockCardXGrid,
}

/* ─── Full-row layout entry ──────────────────────────────────────────────── */
const LayoutRow = ( { layout, selected, onSelect, videos, videoStatus, sliderMode = '', singleCardPreview = false } ) => {
    const MockComponent = MOCK_CARD_MAP[ layout.value ] || MockCardS1
    const hasVideos     = Array.isArray( videos ) && videos.length > 0
    // v2.0.0: for a grid design (Classic Card/Professional/Dark Cinematic)
    // with "Slider" mode chosen, show the same design with the slider's
    // arrow/dots frame around it - same look the old standalone Slider /
    // Centered Carousel designs had, now available for any of the 3 designs.
    const showSliderFrame = !!sliderMode && ( layout.categories.includes( 'grid' ) || layout.categories.includes( 'reel' ) )
    // v2.0.0: under the "Single" category, a Single Videos feed with just 1
    // video shows as a single centered card on the live site (see
    // $capsf_single_as_centered in class-capsf-shortcode.php) - so the
    // Step 2 preview shows just 1 card too, instead of the usual 3, to
    // actually match what the feed will look like.
    const previewVideos = singleCardPreview ? videos?.slice( 0, 1 ) : videos
    return (
        <div className={ `capsf-layout-row${ selected ? ' selected' : '' }` } onClick={ onSelect }>
            <div className='capsf-layout-row-header'>
                <div className='capsf-layout-row-meta'>
                    <span className='capsf-layout-row-label'>
                        { __( 'Layout:', 'captain-social-feed' ) } <strong>{ layout.label }</strong>
                    </span>
                    { layout.popular && (
                        <span className='capsf-layout-popular-badge'>
                            { __( 'MOST POPULAR', 'captain-social-feed' ) } ✦
                        </span>
                    ) }
                    <span className='capsf-layout-row-desc'>{ layout.desc }</span>
                </div>
                <button
                    className={ `capsf-layout-select-btn${ selected ? ' selected' : '' }` }
                    onClick={ e => { e.stopPropagation(); onSelect() } }
                >
                    { selected ? __( '✓ Selected', 'captain-social-feed' ) : __( 'Select', 'captain-social-feed' ) }
                </button>
            </div>
            <div className={ `capsf-layout-row-preview${ singleCardPreview ? ' single-card-preview' : '' }` }>
                { videoStatus === 'loading' ? (
                    <div className='capsf-mc-loading'>
                        <svg viewBox='0 0 24 24' className='capsf-mc-spinner'><circle cx='12' cy='12' r='10' stroke='#2271b1' strokeWidth='3' fill='none' strokeDasharray='60' strokeDashoffset='20'/></svg>
                        <span>{ __( 'Loading your posts…', 'captain-social-feed' ) }</span>
                    </div>
                ) : !hasVideos ? (
                    <RealPreviewEmpty videoStatus={ videoStatus } />
                ) : showSliderFrame ? (
                    <SliderPreviewFrame variant={ sliderMode }><MockComponent videos={ videos } /></SliderPreviewFrame>
                ) : (
                    <MockComponent videos={ previewVideos } />
                ) }
            </div>
        </div>
    )
}

/* ─── Style Preset Card ──────────────────────────────────────────────────── */
/* ─── Device Tabs for columns ────────────────────────────────────────────── */
const DesktopIcon = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='2' y='3' width='20' height='14' rx='2'/><line x1='8' y1='21' x2='16' y2='21'/><line x1='12' y1='17' x2='12' y2='21'/></svg>
const TabletIcon  = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='4' y='2' width='16' height='20' rx='2'/><line x1='12' y1='18' x2='12.01' y2='18'/></svg>
const MobileIcon  = () => <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' width='14' height='14'><rect x='5' y='2' width='14' height='20' rx='2'/><line x1='12' y1='18' x2='12.01' y2='18'/></svg>

/* ─── Step 2 - Layout ────────────────────────────────────────────── */
const Step2Layout = ( { settings, feedType, feedId, updateSetting, autoSave, prevStep, nextStep, videos, videoStatus, nextSlotEl, navPending } ) => {
    // Single source of truth for "which styles can this feed type use" -
    // see FEED_TYPE_ALLOWED_CATEGORIES above.
    const allowedCategories     = getAllowedCategories( feedType )
    const onlyOneCategoryAllowed = allowedCategories.length === 1
    // v2.0.0: "Slider" is a separate toggle next to the category pills (not
    // a pill itself) - it becomes available whenever the active category is
    // "Grid" or "Reel" (both support being shown as a slider on top of the
    // same design), and shows a "Style" dropdown (1/2) when switched on.
    // See getValidSliderMode() for how a saved mode is read back.
    const savedSliderMode = getValidSliderMode( settings )
    // Which category was last active for this feed - persisted in settings
    // (layout_category) so it survives navigating away and back (Step 2
    // fully unmounts when you go to Step 3, so plain component state alone
    // would forget it and fall back to a hardcoded default - this was
    // causing "I picked Single, went to Step 3 and back, and it shows Grid
    // selected instead"). Only trusted if it's still valid for this feed
    // type (e.g. the feed type could have been changed since).
    const savedCategory = settings.layout_category && allowedCategories.includes( settings.layout_category )
        ? settings.layout_category
        : null
    // Default to "Grid" (the most common case) whenever it's an option for
    // this feed type; otherwise restore the last active category if one was
    // saved, otherwise fall back to whichever single category the feed type
    // actually allows (Shorts, Single Video Player, Channel Profile).
    const [activeCategory, setActiveCategory] = useState(
        savedCategory || ( allowedCategories.includes( 'grid' ) ? 'grid' : allowedCategories[ 0 ] )
    )

    // Build available categories - only ones this feed type can actually use.
    const availableCategories = LAYOUT_CATEGORIES.filter( cat => allowedCategories.includes( cat.key ) )

    const isX      = feedType === 'twitter'
    const filtered = isX ? X_LAYOUTS : LAYOUTS.filter( l => l.categories.some( c => allowedCategories.includes( c ) ) && l.categories.includes( activeCategory ) )
    // When a feed type only has one possible layout (Shorts, Single Video
    // Player, Channel Profile), pre-select it so it shows as "✓ Selected"
    // rather than requiring a redundant click on the only option available.
    const defaultLayout  = ( onlyOneCategoryAllowed && filtered.length === 1 ) ? filtered[ 0 ].value : 'social-2'
    const selectedLayout = isX ? resolveCardStyle( settings, 'twitter' ) : ( settings.card_style ? resolveCardStyle( settings, feedType ) : defaultLayout )

    // The Slider toggle only makes sense on top of Grid designs (Classic
    // Card/Professional/Dark Cinematic) or the Reel Card design.
    const sliderToggleAvailable = activeCategory === 'grid' || activeCategory === 'reel'
    const sliderOn      = sliderToggleAvailable && !!savedSliderMode
    const sliderMode    = sliderOn ? savedSliderMode : ''
    // videos & videoStatus come from parent EditFeed - fetched once, shared across steps


    return (
        <div className='capsf-wiz-step-body capsf-step2-body'>
            {/* Title row */}
            <div className='capsf-step2-title-row'>
                <h2 className='capsf-wiz-step-title'>{ __( 'Select Layout', 'captain-social-feed' ) }</h2>
                <p className='capsf-step2-desc'>{ __( 'Choose how your posts will be displayed on your website.', 'captain-social-feed' ) }</p>
            </div>

            {/* Category filter bar - "Slider" is a separate toggle (not a
                pill) that appears next to the pills whenever Grid or Reel
                is active; its "Style" dropdown appears on the right,
                separated by a divider - only while the toggle is on. */}
            { !isX && <div className='capsf-layout-filter-bar capsf-layout-filter-bar--spread'>
                <div className='capsf-layout-filter-chips'>
                    <span className='capsf-layout-filter-label'>{ __( 'Layout:', 'captain-social-feed' ) }</span>
                    { availableCategories.map( cat => (
                        <label key={ cat.key } className={ `capsf-layout-filter-chip${ activeCategory === cat.key ? ' active' : '' }` }>
                            <input type='radio' name='layout_category' value={ cat.key }
                                checked={ activeCategory === cat.key }
                                onChange={ () => {
                                    setActiveCategory( cat.key )
                                    updateSetting( 'layout_category', cat.key )
                                    // Slider only applies on top of Grid/Reel - leaving
                                    // for any other category clears a stale Slider mode
                                    // so it can't wrongly resurrect on a later reload.
                                    if ( cat.key !== 'grid' && cat.key !== 'reel' && savedSliderMode ) {
                                        updateSetting( 'grid_slider_style', '' )
                                    }
                                } }
                            />
                            { cat.label }
                        </label>
                    ) ) }

                    { sliderToggleAvailable && (
                        <>
                            <span className='capsf-layout-filter-divider' />
                            <label className={ `capsf-layout-filter-chip capsf-layout-slider-toggle${ sliderOn ? ' active' : '' }` }>
                                <input type='checkbox'
                                    checked={ sliderOn }
                                    onChange={ () => updateSetting( 'grid_slider_style', sliderOn ? '' : ( savedSliderMode || 'slider-1' ) ) }
                                />
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='15' height='15'>
                                    <rect x='2' y='6' width='8' height='12' rx='1.5'/><rect x='14' y='6' width='8' height='12' rx='1.5'/>
                                </svg>
                                { __( 'Slider', 'captain-social-feed' ) }
                            </label>
                        </>
                    ) }
                </div>

                { sliderOn && (
                    <div className='capsf-layout-slider-style-group'>
                        <span className='capsf-layout-filter-label'>{ __( 'Style', 'captain-social-feed' ) }</span>
                        <select
                            className='capsf-layout-slider-style-select'
                            aria-label={ __( 'Slider style', 'captain-social-feed' ) }
                            value={ sliderMode }
                            onChange={ e => updateSetting( 'grid_slider_style', e.target.value ) }
                        >
                            <option value='slider-1'>{ __( 'Style 1 - Equal Cards', 'captain-social-feed' ) }</option>
                            <option value='slider-2'>{ __( 'Style 2 - Spotlight', 'captain-social-feed' ) }</option>
                            <option value='slider-3'>{ __( 'Style 3 - Carousel', 'captain-social-feed' ) }</option>
                        </select>
                    </div>
                ) }
            </div> }

            {/* Layout rows */}
            <div className='capsf-layout-rows'>
                { filtered.map( layout => (
                    <LayoutRow
                        key={ layout.value }
                        layout={ layout }
                        selected={ selectedLayout === layout.value }
                        onSelect={ async () => {
                            // Wait for the save to actually land before advancing -
                            // previously this used a blind 350ms setTimeout, which
                            // could fire before the (400ms-debounced) autosave had
                            // actually finished, risking the selection getting lost
                            // if the user closed the tab right after. Awaiting the
                            // real save guarantees it's persisted first.
                            await updateSetting( 'card_style', layout.value )
                            nextStep()
                        } }
                        videos={ videos }
                        videoStatus={ videoStatus }
                        sliderMode={ !isX && sliderOn ? sliderMode : '' }
                        singleCardPreview={ !isX && activeCategory === 'single' }
                    />
                ) ) }
            </div>

            <NextPortal slot={ nextSlotEl }>
                <button className='capsf-wiz-btn-primary' disabled={ navPending } onClick={ async () => {
                    // `selectedLayout` can be showing a *fallback* default
                    // (see defaultLayout above) that was never actually
                    // written into `settings.card_style` - e.g. arriving on
                    // Step 2 and clicking "Next" here directly, without ever
                    // clicking a design row. Previously this just called
                    // autoSave(settings) as-is, silently saving WITHOUT
                    // card_style if that was the case - the row shown as
                    // "✓ Selected" was never actually persisted. Explicitly
                    // writing selectedLayout in first guarantees whatever the
                    // user sees as selected is what actually gets saved.
                    await updateSetting( 'card_style', selectedLayout )
                    nextStep()
                } }>
                    { navPending ? <><span className='capsf-btn-spinner' />{ __( 'Saving...', 'captain-social-feed' ) }</> : __( 'Next: Settings', 'captain-social-feed' ) }
                </button>
            </NextPortal>
        </div>
    )
}

/* ════════════════════════════════════════════════════════════════════════
   Main Edit Feed Wizard
   ════════════════════════════════════════════════════════════════════════ */
const EditFeed = () => {
    const navigate        = useNavigate()
    const [params, setParams] = useSearchParams()
    const feedId          = params.get( 'id' )

    const [feedData,   setFeedData]   = useState( null )
    const [settings,   setSettings]   = useState( {} )
    const [loading,    setLoading]    = useState( true )
    const [saving,     setSaving]     = useState( false )
    const [step,       setStep]       = useState( 1 )
    const [maxReached, setMaxReached] = useState( 1 )
    const [copiedShortcode, setCopiedShortcode] = useState( false )
    const [copiedPhpSnippet, setCopiedPhpSnippet] = useState( false )
    const [embedTab, setEmbedTab] = useState( 'shortcode' ) // Step 4 - 'shortcode' | 'php'
    const [gutenbergInsertState, setGutenbergInsertState] = useState( 'idle' ) // idle | copied
    const embedCardRef = useRef( null ) // Step 4 - "View PHP Function" scrolls the Embed Code card into view
    const [colDevice,  setColDevice]  = useState( 'desktop' )
    const [initialVideosDevice, setInitialVideosDevice] = useState( 'desktop' )
    const [loadMoreDevice,      setLoadMoreDevice]      = useState( 'desktop' )
    const [settingsTab, setSettingsTab] = useState( 'layout' ) // 'layout' | 'behaviors' | 'styles' - Step 4 side tabs
    const [feedCacheStatus,  setFeedCacheStatus]  = useState( 'idle' ) // idle | loading | success | error
    const [feedCacheMessage, setFeedCacheMessage] = useState( '' )

    // Shared preview videos - fetched ONCE, reused by Step 2 and Step 3.
    const [previewVideos,  setPreviewVideos]  = useState( [] )
    const [previewProfile, setPreviewProfile] = useState( null )
    const [previewStatus,  setPreviewStatus]  = useState( 'idle' ) // idle|loading|done|error
    const [tokenTestStatus, setTokenTestStatus] = useState( 'idle' ) // idle | testing | success | error
    const [showApiKey, setShowApiKey] = useState( false )
    const [tokenTestMessage, setTokenTestMessage] = useState( '' )


    /* ── Fetch feed ──────────────────────────────────────────────────── */
    useEffect( () => {
        if ( !feedId || typeof capsf_data === 'undefined' ) { setLoading( false ); return }

        const fd = new FormData()
        fd.append( 'action',  'capsf_dashboard_ajax_call' )
        fd.append( 'nonce',   capsf_data.capsf_nonce )
        fd.append( 'type',    'get_feed_data' )
        fd.append( 'feed_id', feedId )

        fetch( capsf_data.ajax_url, { method: 'POST', body: fd } )
            .then( r => r.json() )
            .then( result => {
                if ( result.success && result.data?.feed_data ) {
                    const row = result.data.feed_data
                    const s   = ( typeof row.settings === 'object' && row.settings !== null ) ? row.settings : {}
                    setFeedData( { ...row, settings: s } )
                    setSettings( s )
                    // Second credential field per platform (see PLATFORM_FIELDS in
                    // the Connect step) - used below to detect "already connected".
                    const secondFieldByPlatform = { instagram: 'account_id', facebook: 'page_id', twitter: 'username', threads: 'account_id', pinterest: 'board_id' }
                    const plat       = ( row.feed_type || s.platform || 'instagram' ).toLowerCase()
                    const authField  = plat === 'twitter' ? 'bearer_token' : 'access_token'
                    const hasCreds   = !!( s[ authField ] && s[ secondFieldByPlatform[ plat ] || 'account_id' ] )
                    // If already connected → start at step 2, else step 1
                    const defaultStep  = hasCreds ? 2 : 1
                    const reachedStep  = s.card_style ? LAST_STEP : ( hasCreds ? 2 : 1 )

                    // A reload should land back on the step the user was on -
                    // restore it from the URL (?step=N) as long as it's a step
                    // they'd actually unlocked, so a stale/tampered URL can't
                    // skip ahead of what this feed's data actually supports.
                    const urlStep = parseInt( params.get( 'step' ), 10 )
                    const startStep = ( urlStep >= 1 && urlStep <= LAST_STEP && urlStep <= reachedStep ) ? urlStep : defaultStep

                    setStep( startStep )
                    setMaxReached( reachedStep )
                }
            } )
            .catch( e => console.error( '[capsf]', e ) )
            .finally( () => setLoading( false ) )
    }, [feedId] )

    /* ── Reset preview when the platform's credential fields change so a
     * corrected value retries ── */
    const prevCredsRef = useRef( null )
    useEffect( () => {
        const cur = ( settings.access_token || '' ) + '|' + ( settings.bearer_token || '' ) + '|' + ( settings.account_id || settings.page_id || settings.board_id || settings.username || '' )
        if ( prevCredsRef.current !== null && prevCredsRef.current !== cur ) {
            setPreviewStatus( 'idle' )
            setPreviewVideos( [] )
        }
        prevCredsRef.current = cur
    }, [settings.access_token, settings.bearer_token, settings.account_id, settings.page_id, settings.board_id, settings.username] )

    /* ── Shared preview videos - fetched once a channel/token is connected,
     * reused by Step 2 & 3.
     *
     * Gated on BOTH settings.yt_token AND settings.yt_channel (not just
     * feedId, and not just the token alone) - Step 1's token field updates
     * `settings.yt_token` on every keystroke, and if we fired on that alone
     * the very first character typed would trigger this fetch while
     * yt_channel is still empty. The backend then fails with "Channel ID
     * missing", previewStatus locks into 'error', and - because of the
     * `previewStatus !== 'idle'` guard below - it never retries even after
     * the user finishes filling in the channel and reaches Step 2. That's
     * why it only ever worked after a full page reload (fresh state, both
     * fields already saved). Also wait for `step >= 2` so this never fires
     * mid-typing on Step 1 at all, only once the user has actually moved on. */
    useEffect( () => {
        if ( !feedId || typeof capsf_data === 'undefined' ) return
        if ( step < 2 ) return                                  // still on Connect step
        const plat = ( settings.platform || feedData?.feed_type || 'instagram' ).toLowerCase()
        const authField = plat === 'twitter' ? 'bearer_token' : 'access_token'
        const secondFieldByPlatform = { instagram: 'account_id', facebook: 'page_id', twitter: 'username', threads: 'account_id', pinterest: 'board_id' }
        const secondField = plat === 'twitter' ? getXSecondField( settings ).key : ( secondFieldByPlatform[ plat ] || 'account_id' )
        const authOptional = plat === 'twitter' && getXSource( settings ).value === 'testimonials'
        if ( ( !authOptional && !settings[ authField ] ) || !settings[ secondField ] ) return  // both credential fields required
        if ( previewStatus !== 'idle' ) return                  // already fetching or done
        setPreviewStatus( 'loading' )
        const fd = new FormData()
        fd.append( 'action',  'capsf_dashboard_ajax_call' )
        fd.append( 'nonce',   capsf_data.capsf_nonce )
        fd.append( 'type',    'get_preview_posts' )
        fd.append( 'feed_id', feedId )
        fetch( capsf_data.ajax_url, { method: 'POST', body: fd } )
            .then( r => r.json() )
            .then( res => {
                if ( res.success && res.data?.videos?.length ) {
                    setPreviewVideos( res.data.videos.slice( 0, 3 ) )
                    setPreviewProfile( res.data.profile || null )
                    setPreviewStatus( 'done' )
                } else {
                    setPreviewStatus( 'error' )
                }
            } )
            .catch( () => setPreviewStatus( 'error' ) )
    }, [feedId, step, previewStatus, settings.access_token, settings.bearer_token, settings.account_id, settings.page_id, settings.board_id, settings.username, settings.x_source, settings.x_query, settings.x_tweet_ids] )   // re-runs once both credential fields are connected and Step 1 is done

    /* ── Auto-save ───────────────────────────────────────────────────── */
    /* ── AutoSave: debounced + serialized ──────────────────────────────
     * Previously this fired one full AJAX request per call with zero
     * debounce - e.g. dragging the native color picker (<input type=color>)
     * fires `onChange` dozens of times a second, spamming the server with
     * that many parallel save requests. Since nothing guaranteed those
     * requests would *complete* in the order they were *sent*, a slower
     * in-flight request could land after a newer one and silently overwrite
     * fresher data with stale data.
     *
     * Fix: rapid calls within DEBOUNCE_MS are coalesced into a single
     * request carrying the latest settings snapshot. Only one save is ever
     * in flight; if newer settings arrive while a save is in progress, they
     * are queued in `latestSettingsRef` and flushed immediately once the
     * current request finishes - so the final persisted state always
     * matches the final local state, in order.
     *
     * The returned Promise still only resolves once that snapshot (or a
     * newer one) has actually been persisted, so `await autoSave(settings)`
     * call sites (e.g. Step 1 → Step 2, which relies on the DB write landing
     * before the preview-videos fetch reads it back) keep working exactly
     * as before - just deduplicated. */
    const DEBOUNCE_MS = 400
    const latestSettingsRef = useRef( null )
    const saveInFlightRef   = useRef( false )
    const debounceTimerRef  = useRef( null )
    const saveWaitersRef    = useRef( [] )

    const flushSave = useCallback( async () => {
        if ( saveInFlightRef.current ) return   // a flush is already running; it will re-check latest when done
        const toSend = latestSettingsRef.current
        if ( !toSend || !feedId || typeof capsf_data === 'undefined' ) return

        saveInFlightRef.current = true
        setSaving( true )
        const fd = new FormData()
        fd.append( 'action',   'capsf_dashboard_ajax_call' )
        fd.append( 'nonce',    capsf_data.capsf_nonce )
        fd.append( 'type',     'auto_save_settings' )
        fd.append( 'feed_id',  feedId )
        fd.append( 'settings', JSON.stringify( toSend ) )
        try { await fetch( capsf_data.ajax_url, { method: 'POST', body: fd } ) }
        catch ( e ) { console.error( '[capsf] save error', e ) }
        finally {
            saveInFlightRef.current = false
            setSaving( false )
            if ( latestSettingsRef.current === toSend ) {
                // Nothing newer queued while we were saving - resolve everyone waiting.
                const waiters = saveWaitersRef.current
                saveWaitersRef.current = []
                waiters.forEach( resolve => resolve() )
            } else {
                // Newer settings arrived mid-save - flush again immediately to catch up.
                flushSave()
            }
        }
    }, [feedId] )

    const autoSave = useCallback( ( newSettings ) => {
        latestSettingsRef.current = newSettings
        if ( debounceTimerRef.current ) clearTimeout( debounceTimerRef.current )
        return new Promise( ( resolve ) => {
            saveWaitersRef.current.push( resolve )
            debounceTimerRef.current = setTimeout( () => {
                debounceTimerRef.current = null
                flushSave()
            }, DEBOUNCE_MS )
        } )
    }, [flushSave] )

    // Always track latest settings in a ref - reads/writes to a ref are
    // synchronous (unlike React state, which batches and can lag a render
    // behind). updateSetting/updateSettings merge from this ref (not the
    // `settings` closure variable) and update it immediately, so two rapid
    // calls in a row (e.g. click a category chip, then immediately click
    // "Select" on a design) each build on the OTHER's change instead of one
    // silently overwriting the other - this was causing "select Grid, click
    // a design, and layout_category doesn't actually save as Grid".
    const settingsRef = useRef( settings )
    useEffect( () => { settingsRef.current = settings }, [settings] )

    /* ── Live Preview modal: save anything pending first, then (re)load the
     * iframe so it always shows the saved feed. */
    const [ livePreviewKey, setLivePreviewKey ] = useState( 0 )
    const openLivePreview = useCallback( async () => {
        await autoSave( settingsRef.current )
        setLivePreviewKey( Date.now() )
    }, [autoSave] )
    const closeLivePreview = useCallback( () => setLivePreviewKey( 0 ), [] )

    const updateSetting = ( key, value ) => {
        const next = { ...settingsRef.current, [key]: value }
        settingsRef.current = next
        setSettings( next )
        return autoSave( next )
    }

    /* ── Test whether the current API key is actually working right now ──
     * Calls Google live (cheapest possible request) instead of guessing -
     * a key can stop working at any time (quota reset, revoked, etc.). */
    /* ── Test whether the current platform credentials are actually working
     * right now. Calls that platform's own API live (via Capsf_Api_Factory
     * on the backend) instead of guessing - a token can stop working at any
     * time (expired, revoked, permissions changed). */
    const testToken = useCallback( async () => {
        if ( typeof capsf_data === 'undefined' ) return
        const platform = ( feedData?.feed_type || settingsRef.current?.platform || '' ).toLowerCase()
        setTokenTestStatus( 'testing' )
        setTokenTestMessage( '' )
        const fd = new FormData()
        fd.append( 'action',   'capsf_dashboard_ajax_call' )
        fd.append( 'nonce',    capsf_data.capsf_nonce )
        fd.append( 'type',     'test_platform_connection' )
        fd.append( 'platform', platform )
        fd.append( 'settings', JSON.stringify( settingsRef.current || {} ) )
        try {
            const res = await fetch( capsf_data.ajax_url, { method: 'POST', body: fd } ).then( r => r.json() )
            setTokenTestStatus( res.success ? 'success' : 'error' )
            setTokenTestMessage( res.message || '' )
        } catch ( e ) {
            setTokenTestStatus( 'error' )
            setTokenTestMessage( __( 'Could not reach the server. Please try again.', 'captain-social-feed' ) )
        }
    }, [feedData] )

    const updateSettings = values => {
        const next = { ...settingsRef.current, ...values }
        settingsRef.current = next
        setSettings( next )
        return autoSave( next )
    }

    /* ── Navigation helpers ──────────────────────────────────────────── */
    const goStep = ( n ) => {
        setStep( n )
        if ( n > maxReached ) setMaxReached( n )
        // Keep the URL in sync so a reload lands back on this same step.
        // `replace: true` avoids pushing a new history entry per step click.
        const next = new URLSearchParams( params )
        next.set( 'step', String( n ) )
        setParams( next, { replace: true } )
    }

    // Channel Profile now goes through the full 5-step wizard like every
    // other feed type - Layout only ever offers the one Channel Profile
    // design (see FEED_TYPE_ALLOWED_CATEGORIES), Mode picks Light/Dark, and
    // Settings (Step 4) shows its own Display Options panel instead of the
    // columns/pagination/etc. controls that don't apply to a single card.
    const nextStep = () => goStep( Math.min( step + 1, LAST_STEP ) )
    const prevStep = () => goStep( Math.max( step - 1, 1 ) )

    // Next buttons (in the progress bar): wait for the pending save, show a
    // spinner meanwhile, and ignore double clicks.
    const [ nextSlotEl, setNextSlotEl ] = useState( null )
    const [ navPending, setNavPending ] = useState( false )
    const navLockRef = useRef( false )
    const goNextSafely = ( beforeNext ) => async () => {
        if ( navLockRef.current ) return
        navLockRef.current = true
        setNavPending( true )
        try {
            if ( beforeNext ) await beforeNext()
            nextStep()
        } finally {
            setNavPending( false )
            setTimeout( () => { navLockRef.current = false }, 400 )
        }
    }

    /* ── Apply style preset ──────────────────────────────────────────── */
    const applyPreset = ( preset ) => {
        const currentSS = settingsRef.current.style_settings || {}
        const merged    = { ...currentSS }
        Object.entries( preset.settings ).forEach( ( [ el, states ] ) => {
            merged[ el ] = {
                normal: { ...( merged[ el ]?.normal || {} ), ...( states.normal || {} ) },
                hover:  { ...( merged[ el ]?.hover  || {} ), ...( states.hover  || {} ) },
            }
        } )
        const next = { ...settingsRef.current, style_settings: merged, style_preset: preset.key }
        settingsRef.current = next
        setSettings( next )
        return autoSave( next )
    }

    /* ── Column helpers ──────────────────────────────────────────────── */
    const getColKey = () => colDevice === 'tablet' ? 'columns_tablet' : colDevice === 'mobile' ? 'columns_mobile' : 'columns'
    const getColVal = () => {
        if ( colDevice === 'tablet' ) return String( settings.columns_tablet ?? 2 )
        if ( colDevice === 'mobile' ) return String( settings.columns_mobile ?? 1 )
        return String( settings.columns ?? 3 )
    }

    /* ── Initial Videos / Videos Per Click responsive helpers ───── */
    const getInitialVideosKey = device => device === 'tablet' ? 'initial_videos_tablet' : device === 'mobile' ? 'initial_videos_mobile' : 'initial_videos'
    const getInitialVideosVal = device => {
        if ( device === 'tablet' ) return String( settings.initial_videos_tablet ?? settings.initial_videos ?? 6 )
        if ( device === 'mobile' ) return String( settings.initial_videos_mobile ?? settings.initial_videos ?? 6 )
        return String( settings.initial_videos ?? 6 )
    }
    const getLoadMoreKey = device => device === 'tablet' ? 'load_more_count_tablet' : device === 'mobile' ? 'load_more_count_mobile' : 'load_more_count'
    const getLoadMoreVal = device => {
        if ( device === 'tablet' ) return String( settings.load_more_count_tablet ?? settings.load_more_count ?? 3 )
        if ( device === 'mobile' ) return String( settings.load_more_count_mobile ?? settings.load_more_count ?? 3 )
        return String( settings.load_more_count ?? 3 )
    }

    // Shared Desktop/Tablet/Mobile tab row for responsive fields
    // (Initial Videos, Videos Per Click).
    const renderResponsiveDeviceTabs = ( device, setDevice ) => (
        <div className='capsf-col-device-tabs'>
            { [
                { key: 'desktop', Icon: DesktopIcon, tip: __( 'Desktop', 'captain-social-feed' ) },
                { key: 'tablet',  Icon: TabletIcon,  tip: __( 'Tablet ≤1024px', 'captain-social-feed' ) },
                { key: 'mobile',  Icon: MobileIcon,  tip: __( 'Mobile ≤640px', 'captain-social-feed' ) },
            ].map( ( { key, Icon, tip } ) => (
                <button
                    key={ key }
                    type='button'
                    title={ tip }
                    className={ `capsf-col-device-btn${ device === key ? ' active' : '' }` }
                    onClick={ () => setDevice( key ) }
                >
                    <Icon />
                </button>
            ) ) }
        </div>
    )

    /* ── Copy shortcode ──────────────────────────────────────────────── */
    const shortcode = feedId ? `[captain-social-feed id="${ feedId }"]` : ''
    const handleCopy = () => {
        navigator.clipboard.writeText( shortcode )
        setCopiedShortcode( true )
        setTimeout( () => setCopiedShortcode( false ), 2000 )
    }

    /* ── Clear this feed's cache (Step 5 → Feed Details) ────────────── */
    /* ── PHP function (Step 4) - for a child theme's functions.php instead of
     * the Shortcode block. Unique per feed, guarded by function_exists(). */
    const phpFunctionName = `capsf_display_feed_${ feedId || 0 }`
    const phpSnippet = feedId ? `<?php
/**
 * Displays the "${ ( feedData?.feed_name || 'Untitled Feed' ).replace( /\*\//g, '' ) }" feed (Feed ID: ${ feedId }).
 * Paste this into your child theme's functions.php, then call
 * ${ phpFunctionName }(); anywhere in your theme's template files -
 * e.g. inside page.php, single.php, or a template part.
 */
if ( ! function_exists( '${ phpFunctionName }' ) ) {
    function ${ phpFunctionName }() {
        echo do_shortcode( '${ shortcode }' );
    }
}` : ''
    const handleCopyPhp = () => {
        navigator.clipboard.writeText( phpSnippet )
        setCopiedPhpSnippet( true )
        setTimeout( () => setCopiedPhpSnippet( false ), 2000 )
    }

    /* ── Gutenberg card: copy the shortcode, open "Add New Page" in a new tab. */
    const handleGutenbergAutoInsert = () => {
        if ( ! shortcode || typeof capsf_data === 'undefined' ) return
        navigator.clipboard.writeText( shortcode )
        setGutenbergInsertState( 'copied' )
        setTimeout( () => setGutenbergInsertState( 'idle' ), 3000 )
        window.open( `${ capsf_data.ajax_url.replace( 'admin-ajax.php', '' ) }post-new.php?post_type=page`, '_blank', 'noopener' )
    }

    /* ── Elementor card: a new page opened straight in Elementor (a normal new page without it). */
    const elementorNewPageUrl = typeof capsf_data !== 'undefined' ? `${ capsf_data.ajax_url.replace( 'admin-ajax.php', '' ) }post-new.php?post_type=page&action=elementor` : '#'

    /* ── Diagnostic card: the real global cache duration (capsf_data.cache_duration, seconds). */
    const formatCacheDuration = seconds => {
        seconds = Number( seconds ) || 0
        if ( ! seconds ) return __( 'Default (1 Hour)', 'captain-social-feed' )
        if ( seconds % 3600 === 0 ) {
            const hours = seconds / 3600
            return hours === 1 ? __( 'Active (1 Hour)', 'captain-social-feed' ) : sprintf( __( 'Active (%d Hours)', 'captain-social-feed' ), hours )
        }
        return sprintf( __( 'Active (%d Minutes)', 'captain-social-feed' ), Math.round( seconds / 60 ) )
    }
    const feedPlatformLabel = { instagram: 'Instagram', facebook: 'Facebook', twitter: 'X', threads: 'Threads', pinterest: 'Pinterest' }[ ( feedData?.feed_type || '' ).toLowerCase() ] || __( 'platform', 'captain-social-feed' )

    const handleClearFeedCache = async () => {
        if ( feedCacheStatus === 'loading' || !feedId ) return
        setFeedCacheStatus( 'loading' )
        setFeedCacheMessage( '' )

        const fd = new FormData()
        fd.append( 'action', 'capsf_dashboard_ajax_call' )
        fd.append( 'nonce',  capsf_data.capsf_nonce )
        fd.append( 'type',   'clear_feed_cache' )
        fd.append( 'feed_id', feedId )

        try {
            const res = await fetch( capsf_data.ajax_url, { method: 'POST', body: fd } ).then( r => r.json() )
            setFeedCacheStatus( res.success ? 'success' : 'error' )
            setFeedCacheMessage( res.success
                ? ( res.message || __( 'This feed\'s cache was cleared.', 'captain-social-feed' ) )
                : ( res.message || __( 'Something went wrong. Please try again.', 'captain-social-feed' ) )
            )
        } catch ( e ) {
            setFeedCacheStatus( 'error' )
            setFeedCacheMessage( __( 'Something went wrong. Please try again.', 'captain-social-feed' ) )
        }

        setTimeout( () => { setFeedCacheStatus( 'idle' ); setFeedCacheMessage( '' ) }, 4000 )
    }

    /* ── Loading / not found ─────────────────────────────────────────── */
    if ( loading ) return (
        <div className='capsf-wiz-loading'>
            <svg viewBox='0 0 24 24' className='capsf-edit-spinner'><circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='3' fill='none' strokeDasharray='60' strokeDashoffset='20'/></svg>
            { __( 'Loading feed…', 'captain-social-feed' ) }
        </div>
    )
    if ( !feedData ) return (
        <div className='capsf-wiz-loading'>
            <p>{ __( 'Feed not found.', 'captain-social-feed' ) }</p>
            <button className='capsf-wiz-btn-primary' onClick={ () => navigate( '/' ) }>{ __( '← Dashboard', 'captain-social-feed' ) }</button>
        </div>
    )

    // Which Step 4 controls apply - mirrors render_feed_shortcode() in
    // class-capsf-shortcode.php so nothing is offered that the live feed ignores.
    const feedPlatform     = ( feedData?.feed_type || settings.platform || '' ).toLowerCase()
    const isXFeed          = feedPlatform === 'twitter'
    const cardStyle        = resolveCardStyle( settings, feedPlatform )
    const isXTimeline      = cardStyle === 'x-timeline'
    const isPlaylistLayout = PLAYLIST_CARD_STYLES.includes( cardStyle )
    // "Single" category on a grid design → one centered card, no slider/pagination.
    const isSingleLayout   = settings.layout_category === 'single' && GRID_CARD_STYLES.includes( cardStyle )
    const isSocialLayout   = SOCIAL_CARD_STYLES.includes( cardStyle )
    const captionMode      = settings.caption_mode === 'scroll' ? 'scroll' : 'show_more'
    const postFilter       = POST_FILTER_OPTIONS.some( opt => opt.key === settings.post_filter ) ? settings.post_filter : 'all'
    // Slider has no concept of rows or pagination - it's one continuously
    // scrollable row of whatever was already fetched (see LAYOUTS' `category`,
    // the single source of truth for which style belongs to which family).
    // v2.0.0: "Slider" is a display mode (grid_slider_style), not its own
    // card_style value anymore - see getValidSliderMode().
    const sliderMode = isSingleLayout || isPlaylistLayout ? '' : getValidSliderMode( settings )
    const isSlider   = !!sliderMode

    const showEqualHeight  = !isSlider && !isSingleLayout && EQUAL_HEIGHT_CARD_STYLES.includes( cardStyle )
    const showLoadBehavior = !isSlider && !isSingleLayout
    const hasBehaviors     = showEqualHeight || isSlider || showLoadBehavior
    // Falls back to Layout if the Behaviors tab was open and stops applying.
    const activeSettingsTab = settingsTab === 'behaviors' && !hasBehaviors ? 'layout' : settingsTab
    const cardHas    = element => ( CARD_TEXT_ELEMENTS[ cardStyle ] || [] ).includes( element )
    const styleProps = { settings, updateSetting, updateSettings }

    // Load More only shows while there is something left to load.
    const maxPostsNum              = Number( settings.max_results ?? 6 )
    const largestInitialPosts      = Math.max( ...[ 'desktop', 'tablet', 'mobile' ].map( d => Number( getInitialVideosVal( d ) ) || 0 ) )
    const loadMoreHasNothingToLoad = largestInitialPosts >= maxPostsNum

    // One labelled on/off row (Card Display Options, Behaviors tab).
    // Columns don't apply to one centered card, the Playlist or the X timeline.
    const showColumns = !isSingleLayout && !isPlaylistLayout && !isXTimeline
    // Card Display Options (badge counts the ones switched on).
    const displayToggles = [
        { key: 'show_channel_name', label: __( 'Show Account Name', 'captain-social-feed' ), tip: __( 'Display the account name on each card.', 'captain-social-feed' ) },
        ...( !isSocialLayout && !isXFeed && cardStyle !== 'style-8' ? [ { key: 'show_title', label: __( 'Show Title', 'captain-social-feed' ), tip: __( 'Display the post caption (shortened) as the card title.', 'captain-social-feed' ) } ] : [] ),
        { key: 'show_description', label: __( 'Show Description', 'captain-social-feed' ), tip: __( 'Display the full caption on card styles that support it.', 'captain-social-feed' ) },
        { key: 'show_view_count', label: __( 'Show Likes', 'captain-social-feed' ), tip: __( 'Display the like count when the platform provides it.', 'captain-social-feed' ) },
        { key: 'show_date', label: __( 'Show Date', 'captain-social-feed' ), tip: __( 'Display how long ago each post was published.', 'captain-social-feed' ) },
    ]
    // On/off row with an (i) tooltip instead of a description line.
    const renderTipToggle = ( key, label, tip, fallback = true ) => (
        <div className='capsf-slider-toggle-row' key={ key }>
            <div>
                <strong id={ `capsf-toggle-${ key }` }>
                    { label }
                    <InfoTip text={ tip } />
                </strong>
            </div>
            <label className='capsf-toggle'>
                <input type='checkbox' aria-labelledby={ `capsf-toggle-${ key }` } checked={ !!( settings[ key ] ?? fallback ) } onChange={ e => updateSetting( key, e.target.checked ) } />
                <span className='capsf-toggle-slider' />
            </label>
        </div>
    )

    const renderToggle = ( key, label, desc, fallback = true ) => (
        <div className='capsf-slider-toggle-row' key={ key }>
            <div>
                <strong id={ `capsf-toggle-${ key }` }>{ label }</strong>
                <p>{ desc }</p>
            </div>
            <label className='capsf-toggle'>
                <input type='checkbox' aria-labelledby={ `capsf-toggle-${ key }` } checked={ !!( settings[ key ] ?? fallback ) } onChange={ e => updateSetting( key, e.target.checked ) } />
                <span className='capsf-toggle-slider' />
            </label>
        </div>
    )

    /* ══════════════════════════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════════════════════════ */
    return (
        <CaptionContext.Provider value={ {
            mode:  settings.caption_mode === 'scroll' ? 'scroll' : 'show_more',
            limit: Math.max( 20, Number( settings.caption_length ) || 120 ),
            more:  settings.show_more_text || '',
            less:  settings.show_less_text || '',
        } }>
        <XPreviewContext.Provider value={ { profile: previewProfile, stars: isXFeed && getXSource( settings ).value === 'testimonials', sidebar: isXFeed && getXSource( settings ).value === 'sidebar' } }>
        <div className='capsf-wiz-wrapper'>

            {/* ── Progress Bar (includes Back button) ──────────────── */}
            <WizardProgress
                current={ step }
                onStepClick={ goStep }
                maxReached={ maxReached }
                onBack={ () => ( step === 1 ? navigate( '/' ) : prevStep() ) }
                onNextSlotMount={ setNextSlotEl }
                showNext={ step < LAST_STEP }
                saving={ saving }
            />

            {/* ── Step Body ───────────────────────────────────────────── */}
            <div className='capsf-wiz-body'>

                {/* ════ STEP 1: Connect Account ════ */}
                { step === 1 && ( () => {
                    const platform = ( feedData.feed_type || settings.platform || 'instagram' ).toLowerCase()

                    // Same per-platform credential field definitions as the
                    // Create Feed wizard (create_page.jsx) - kept in sync
                    // manually since each is a small, static, self-contained map.
                    const PLATFORM_FIELDS = {
                        instagram: { label: __( 'Instagram', 'captain-social-feed' ), one: { key: 'access_token', label: __( 'Access Token', 'captain-social-feed' ), placeholder: __( 'Enter your long-lived Access Token', 'captain-social-feed' ) }, two: { key: 'account_id', label: __( 'Instagram Business Account ID', 'captain-social-feed' ), placeholder: 'e.g. 17841400000000000' }, doc: 'instagram-access-token' },
                        facebook:  { label: __( 'Facebook', 'captain-social-feed' ), one: { key: 'access_token', label: __( 'Page Access Token', 'captain-social-feed' ), placeholder: __( 'Enter your Page Access Token', 'captain-social-feed' ) }, two: { key: 'page_id', label: __( 'Facebook Page ID', 'captain-social-feed' ), placeholder: 'e.g. 100000000000000' }, doc: 'facebook-access-token' },
                        twitter:   { label: __( 'Twitter / X', 'captain-social-feed' ), one: { key: 'bearer_token', label: __( 'Bearer Token', 'captain-social-feed' ), placeholder: __( 'Enter your API v2 Bearer Token', 'captain-social-feed' ) }, two: { key: 'username', label: __( '@Username', 'captain-social-feed' ), placeholder: 'e.g. wordpress' }, doc: 'twitter-bearer-token' },
                        threads:   { label: __( 'Threads', 'captain-social-feed' ), one: { key: 'access_token', label: __( 'Access Token', 'captain-social-feed' ), placeholder: __( 'Enter your long-lived Access Token', 'captain-social-feed' ) }, two: { key: 'account_id', label: __( 'Threads User ID', 'captain-social-feed' ), placeholder: 'e.g. 17841400000000000' }, doc: 'threads-access-token' },
                        pinterest: { label: __( 'Pinterest', 'captain-social-feed' ), one: { key: 'access_token', label: __( 'Access Token', 'captain-social-feed' ), placeholder: __( 'Enter your Access Token', 'captain-social-feed' ) }, two: { key: 'board_id', label: __( 'Board ID', 'captain-social-feed' ), placeholder: 'e.g. 549755885175' }, doc: 'pinterest-access-token' },
                    }
                    const fields = { ...( PLATFORM_FIELDS[ platform ] || PLATFORM_FIELDS.instagram ) }
                    if ( platform === 'twitter' ) fields.two = getXSecondField( settings )
                    const xSource = getXSource( settings )
                    const fieldOneVal = settings[ fields.one.key ] || ''
                    const fieldTwoVal = settings[ fields.two.key ] || ''
                    // X Testimonials work without a token (X's free embed - text only).
                    const tokenOptional = platform === 'twitter' && xSource.value === 'testimonials'
                    const canNext = ( tokenOptional || !!fieldOneVal.trim() ) && !!fieldTwoVal.trim()

                    return (
                    <div className='capsf-wiz-step-body'>
                        <h2 className='capsf-wiz-step-title'>{ sprintf( __( 'Connect Your %s Account', 'captain-social-feed' ), fields.label ) }</h2>
                        <p className='capsf-wiz-step-desc'>{ __( 'Enter your credentials to fetch posts for this feed.', 'captain-social-feed' ) }</p>

                        <div className='capsf-wiz-form'>

                            <div className='capsf-wiz-field-row'>
                                <div className='capsf-wiz-field'>
                                    <label className='capsf-wiz-label'>{ __( 'Feed Name', 'captain-social-feed' ) }</label>
                                    <input
                                        className='capsf-wiz-input'
                                        type='text'
                                        placeholder={ __( 'My Social Feed', 'captain-social-feed' ) }
                                        value={ feedData.feed_name || '' }
                                        onChange={ e => {
                                            const newName = e.target.value
                                            setFeedData( prev => ( { ...prev, feed_name: newName } ) )
                                            const fd = new FormData()
                                            fd.append( 'action',    'capsf_dashboard_ajax_call' )
                                            fd.append( 'nonce',     capsf_data.capsf_nonce )
                                            fd.append( 'type',      'update_feed_name' )
                                            fd.append( 'feed_id',   feedId )
                                            fd.append( 'feed_name', newName )
                                            fetch( capsf_data.ajax_url, { method: 'POST', body: fd } ).catch( () => {} )
                                        } }
                                    />
                                </div>
                                <div className='capsf-wiz-field'>
                                    <label className='capsf-wiz-label'>{ __( 'Platform', 'captain-social-feed' ) }</label>
                                    <div className='capsf-wiz-platform-readonly'>
                                        <img src={ ( typeof capsf_data !== 'undefined' ? capsf_data.plugin_url : '' ) + 'assets/svg/social/' + platform + '.svg' } alt='' width='18' height='18' />
                                        <input className='capsf-wiz-input' type='text' value={ fields.label } disabled readOnly />
                                    </div>
                                </div>
                            </div>

                            {/* X: what the feed shows - picks the fields below and the default design. */}
                            { platform === 'twitter' && (
                                <div className='capsf-wiz-field'>
                                    <label className='capsf-wiz-label' htmlFor='capsf-x-source'>{ __( 'What to Show', 'captain-social-feed' ) }</label>
                                    <select
                                        id='capsf-x-source'
                                        className='capsf-wiz-select'
                                        value={ xSource.value }
                                        onChange={ e => {
                                            const next = X_SOURCES.find( src => src.value === e.target.value ) || X_SOURCES[ 0 ]
                                            const values = { x_source: next.value, card_style: next.design }
                                            if ( next.value === 'testimonials' && !settings.feed_title ) values.feed_title = __( 'What our clients tweet about us', 'captain-social-feed' )
                                            updateSettings( values )
                                            setTokenTestStatus( 'idle' )
                                            setTokenTestMessage( '' )
                                        } }
                                    >
                                        { X_SOURCES.map( src => <option key={ src.value } value={ src.value }>{ src.label }</option> ) }
                                    </select>
                                    <p className='capsf-wiz-field-hint'>{ xSource.desc }</p>
                                </div>
                            ) }

                            {/* Credential field one - Access/Bearer Token */}
                            <div className='capsf-wiz-field'>
                                <label className='capsf-wiz-label'>
                                    { fields.one.label }
                                    { tokenOptional
                                        ? <span className='capsf-wiz-optional'>{ __( '(optional)', 'captain-social-feed' ) }</span>
                                        : <span className='capsf-wiz-required'>*</span> }
                                    <a href={ `#/docs/${ fields.doc }` } target='_blank' rel='noopener noreferrer' className='capsf-wiz-field-link'>
                                        { __( 'How to get this? →', 'captain-social-feed' ) }
                                    </a>
                                </label>
                                <div className='capsf-token-test-row'>
                                    <div className='capsf-token-input-wrap'>
                                        <input
                                            className={ `capsf-wiz-input${ !fieldOneVal && settings[ fields.one.key ] !== undefined ? ' capsf-wiz-input--warn' : '' }` }
                                            type={ showApiKey ? 'text' : 'password' }
                                            autoComplete='off'
                                            placeholder={ fields.one.placeholder }
                                            value={ fieldOneVal }
                                            onChange={ e => {
                                                updateSetting( fields.one.key, e.target.value )
                                                setTokenTestStatus( 'idle' )
                                                setTokenTestMessage( '' )
                                            } }
                                        />
                                        <button
                                            type='button'
                                            className='capsf-token-eye-btn'
                                            onClick={ () => setShowApiKey( v => !v ) }
                                            title={ showApiKey ? __( 'Hide', 'captain-social-feed' ) : __( 'Show', 'captain-social-feed' ) }
                                            aria-label={ showApiKey ? __( 'Hide', 'captain-social-feed' ) : __( 'Show', 'captain-social-feed' ) }
                                        >
                                            { showApiKey ? (
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='17' height='17'>
                                                    <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z'/>
                                                    <circle cx='12' cy='12' r='3'/>
                                                </svg>
                                            ) : (
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='17' height='17'>
                                                    <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 7 10 7a17.1 17.1 0 0 1-3.16 4.33M6.61 6.61A17.24 17.24 0 0 0 2 11s3.5 7 10 7a9.24 9.24 0 0 0 4.6-1.2M14.12 14.12a3 3 0 1 1-4.24-4.24'/>
                                                    <line x1='2' y1='2' x2='22' y2='22'/>
                                                </svg>
                                            ) }
                                        </button>
                                    </div>
                                    <button
                                        type='button'
                                        className='capsf-token-test-btn'
                                        disabled={ tokenTestStatus === 'testing' || ( !tokenOptional && !fieldOneVal.trim() ) || !fieldTwoVal.trim() }
                                        onClick={ testToken }
                                    >
                                        { tokenTestStatus === 'testing' ? __( 'Testing…', 'captain-social-feed' ) : __( 'Test Connection', 'captain-social-feed' ) }
                                    </button>
                                </div>
                                { ( tokenTestStatus === 'success' || tokenTestStatus === 'error' ) && (
                                    <div className={ `capsf-token-test-result capsf-token-test-result--${ tokenTestStatus }` }>
                                        { tokenTestMessage }
                                    </div>
                                ) }
                            </div>

                            {/* Credential field two - account/page/board ID or @username */}
                            <div className='capsf-wiz-field'>
                                <label className='capsf-wiz-label' htmlFor='capsf-field-two'>{ fields.two.label }<span className='capsf-wiz-required'>*</span></label>
                                { fields.two.multiline ? (
                                    <textarea
                                        id='capsf-field-two'
                                        className={ `capsf-wiz-input capsf-wiz-textarea${ !fieldTwoVal && settings[ fields.two.key ] !== undefined ? ' capsf-wiz-input--warn' : '' }` }
                                        rows='5'
                                        placeholder={ fields.two.placeholder }
                                        value={ fieldTwoVal }
                                        onChange={ e => updateSetting( fields.two.key, e.target.value ) }
                                    />
                                ) : (
                                    <input
                                        id='capsf-field-two'
                                        className={ `capsf-wiz-input${ !fieldTwoVal && settings[ fields.two.key ] !== undefined ? ' capsf-wiz-input--warn' : '' }` }
                                        type='text'
                                        placeholder={ fields.two.placeholder }
                                        value={ fieldTwoVal }
                                        onChange={ e => updateSetting( fields.two.key, e.target.value ) }
                                    />
                                ) }
                                { fields.two.hint && <p className='capsf-wiz-field-hint'>{ fields.two.hint }</p> }
                            </div>

                        </div>

                        <NextPortal slot={ nextSlotEl }>
                            <button
                                className='capsf-wiz-btn-primary'
                                disabled={ !canNext || navPending }
                                onClick={ () => { if ( canNext ) goNextSafely( () => autoSave( settingsRef.current ) )() } }
                                title={ !canNext ? __( 'Fill in both fields to continue', 'captain-social-feed' ) : '' }
                            >
                                { navPending ? <><span className='capsf-btn-spinner' />{ __( 'Saving...', 'captain-social-feed' ) }</> : __( 'Next: Select Layout', 'captain-social-feed' ) }
                            </button>
                        </NextPortal>
                    </div>
                    )
                } )() }

                {/* ════ STEP 2: Layout ════ */}
                { step === 2 && (
                    <Step2Layout
                        settings={ settings }
                        feedType={ ( feedData?.feed_type || 'instagram' ).toLowerCase() }
                        feedId={ feedId }
                        updateSetting={ updateSetting }
                        autoSave={ autoSave }
                        prevStep={ prevStep }
                        nextStep={ nextStep }
                        videos={ previewVideos }
                        videoStatus={ previewStatus }
                        nextSlotEl={ nextSlotEl }
                        navPending={ navPending }
                    />
                ) }

                {/* ════ STEP 3: Settings ════ */}
                { step === 3 && (
                    <div className='capsf-wiz-step-body'>
                        { livePreviewKey > 0 && (
                            <LivePreview
                                feedId={ feedId }
                                reloadKey={ livePreviewKey }
                                onRefresh={ openLivePreview }
                                onClose={ closeLivePreview }
                                icons={ { desktop: DesktopIcon, tablet: TabletIcon, mobile: MobileIcon } }
                            />
                        ) }

                        <div className='capsf-settings-layout'>

                            <div className='capsf-settings-tabs' role='tablist'>
                                <button
                                    type='button'
                                    role='tab'
                                    aria-selected={ activeSettingsTab === 'layout' }
                                    className={ `capsf-settings-tab${ activeSettingsTab === 'layout' ? ' active' : '' }` }
                                    onClick={ () => setSettingsTab( 'layout' ) }
                                >
                                    <svg className='capsf-settings-tab-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect x='3' y='3' width='7' height='9' rx='1.5'/><rect x='14' y='3' width='7' height='5' rx='1.5'/><rect x='14' y='12' width='7' height='9' rx='1.5'/><rect x='3' y='16' width='7' height='5' rx='1.5'/></svg>
                                    { __( 'Layout', 'captain-social-feed' ) }
                                </button>
                                { hasBehaviors && (
                                    <button
                                        type='button'
                                        role='tab'
                                        aria-selected={ activeSettingsTab === 'behaviors' }
                                        className={ `capsf-settings-tab${ activeSettingsTab === 'behaviors' ? ' active' : '' }` }
                                        onClick={ () => setSettingsTab( 'behaviors' ) }
                                    >
                                        <svg className='capsf-settings-tab-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/></svg>
                                        { __( 'Behaviors', 'captain-social-feed' ) }
                                    </button>
                                ) }
                                <button
                                    type='button'
                                    role='tab'
                                    aria-selected={ activeSettingsTab === 'styles' }
                                    className={ `capsf-settings-tab${ activeSettingsTab === 'styles' ? ' active' : '' }` }
                                    onClick={ () => setSettingsTab( 'styles' ) }
                                >
                                    <svg className='capsf-settings-tab-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><circle cx='13.5' cy='6.5' r='.5'/><path d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10a10 10 0 0 0 10-10c0-.26 0-.52-.02-.78a3.5 3.5 0 0 1-3.16-1.54 3.5 3.5 0 0 1-4.32-4.32A3.5 3.5 0 0 1 12.78 2.02c-.26-.02-.52-.02-.78-.02Z'/></svg>
                                    { __( 'Styles', 'captain-social-feed' ) }
                                </button>
                                {/* Not a tab - opens the Live Preview modal (saves first). */}
                                <button
                                    type='button'
                                    className='capsf-settings-tab capsf-settings-tab--preview'
                                    onClick={ openLivePreview }
                                >
                                    <svg className='capsf-settings-tab-icon' aria-hidden='true' focusable='false' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>
                                    { __( 'Live Preview', 'captain-social-feed' ) }
                                </button>
                            </div>

                            <div className='capsf-settings-tab-content' role='tabpanel'>

                            {/* ── Layout tab ───────────────────────────────────── */}
                            { activeSettingsTab === 'layout' && (
                                <div className='capsf-setup-grid'>
                                <div className='capsf-accordion-group'>
                                <div className='capsf-accordion-col'>

                                    {/* Layout & Display - Columns + Max Posts. */}
                                    { !isSingleLayout && (
                                        <details className='capsf-setup-section' open>
                                            <summary className='capsf-setup-section-head'>
                                                <span className='capsf-setup-section-title'>{ __( 'Layout & Display', 'captain-social-feed' ) }</span>
                                                { showColumns && (
                                                    <span className='capsf-setup-section-badge'>{ sprintf( __( '%s Cols', 'captain-social-feed' ), getColVal() ) }</span>
                                                ) }
                                            </summary>
                                            <div className='capsf-field-card-grid'>
                                                { showColumns && (
                                                    <div className='capsf-field-card capsf-field-card--full'>
                                                        <div className='capsf-field-card-head'>
                                                            <span className='capsf-field-card-label'>{ isSlider ? __( 'Visible Slides', 'captain-social-feed' ) : __( 'Columns', 'captain-social-feed' ) }</span>
                                                            <DeviceSelect value={ colDevice } onChange={ setColDevice } />
                                                        </div>
                                                        <div className='capsf-col-chips'>
                                                            { COLUMNS.map( c => (
                                                                <label key={ c } className={ `capsf-col-chip capsf-col-chip--round${ getColVal() === c ? ' active' : '' }` }>
                                                                    <input type='radio' name={ `col_${ colDevice }` } value={ c } checked={ getColVal() === c } onChange={ () => updateSetting( getColKey(), c ) } />
                                                                    { c }
                                                                </label>
                                                            ) ) }
                                                            <span className='capsf-col-breakpoint'>
                                                                { colDevice === 'desktop' && __( 'All screens', 'captain-social-feed' ) }
                                                                { colDevice === 'tablet'  && __( '≤ 1024px',    'captain-social-feed' ) }
                                                                { colDevice === 'mobile'  && __( '≤ 640px',      'captain-social-feed' ) }
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) }

                                                <div className='capsf-field-card capsf-field-card--full'>
                                                    <div className='capsf-field-card-head'>
                                                        <span className='capsf-field-card-label'>{ __( 'Max Posts', 'captain-social-feed' ) }</span>
                                                    </div>
                                                    <div className='capsf-col-chips capsf-col-chips--wrap'>
                                                        { MAX_OPTIONS.map( n => (
                                                            <label key={ n } className={ `capsf-col-chip capsf-col-chip--round${ String( settings.max_results ?? 6 ) === n ? ' active' : '' }` }>
                                                                <input type='radio' name='max_results' value={ n } checked={ String( settings.max_results ?? 6 ) === n } onChange={ () => updateSetting( 'max_results', n ) } />
                                                                { n }
                                                            </label>
                                                        ) ) }
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    ) }

                                    {/* Card Display Options */}
                                    <details className='capsf-setup-section' open>
                                        <summary className='capsf-setup-section-head'>
                                            <span className='capsf-setup-section-title'>{ __( 'Card Display Options', 'captain-social-feed' ) }</span>
                                            <span className='capsf-setup-section-badge'>
                                                { sprintf( __( '%1$d of %2$d Active', 'captain-social-feed' ), displayToggles.filter( t => !!( settings[ t.key ] ?? true ) ).length, displayToggles.length ) }
                                            </span>
                                        </summary>
                                        <div className='capsf-toggle-grid'>
                                            { displayToggles.map( t => renderTipToggle( t.key, t.label, t.tip ) ) }
                                        </div>
                                    </details>

                                    {/* Caption - Social Post designs: "Show More" toggle or a scroll box. */}
                                    { isSocialLayout && (
                                        <details className='capsf-setup-section' open>
                                            <summary className='capsf-setup-section-head'>
                                                <span className='capsf-setup-section-title'>{ __( 'Caption', 'captain-social-feed' ) }</span>
                                                <span className='capsf-setup-section-badge'>{ captionMode === 'scroll' ? __( 'Scroll', 'captain-social-feed' ) : __( 'Show More', 'captain-social-feed' ) }</span>
                                            </summary>
                                            <div className='capsf-col-chips' role='radiogroup' aria-label={ __( 'Caption', 'captain-social-feed' ) }>
                                                { [
                                                    { key: 'show_more', label: __( 'Show More', 'captain-social-feed' ) },
                                                    { key: 'scroll',    label: __( 'Scroll', 'captain-social-feed' ) },
                                                ].map( opt => (
                                                    <label key={ opt.key } className={ `capsf-col-chip capsf-col-chip--text${ captionMode === opt.key ? ' active' : '' }` }>
                                                        <input type='radio' name='caption_mode' value={ opt.key } checked={ captionMode === opt.key } onChange={ () => updateSetting( 'caption_mode', opt.key ) } />
                                                        { opt.label }
                                                    </label>
                                                ) ) }
                                                <span className='capsf-col-breakpoint'>
                                                    { captionMode === 'scroll'
                                                        ? __( 'Fixed-height box with a scrollbar - style it in the Styles tab.', 'captain-social-feed' )
                                                        : __( 'Long captions are cut with a Show More / Show Less link.', 'captain-social-feed' ) }
                                                </span>
                                            </div>
                                            { captionMode === 'show_more' && (
                                                <div className='capsf-caption-fields'>
                                                    <label className='capsf-caption-field'>
                                                        <span>{ __( 'Characters before Show More', 'captain-social-feed' ) }</span>
                                                        <input type='number' className='capsf-wiz-input' min='20' max='1000' placeholder='120' value={ settings.caption_length ?? '' } onChange={ e => updateSetting( 'caption_length', e.target.value ) } />
                                                    </label>
                                                    <label className='capsf-caption-field'>
                                                        <span>{ __( '"Show More" Text', 'captain-social-feed' ) }</span>
                                                        <input type='text' className='capsf-wiz-input' maxLength='40' placeholder={ __( 'Show More', 'captain-social-feed' ) } value={ settings.show_more_text ?? '' } onChange={ e => updateSetting( 'show_more_text', e.target.value ) } />
                                                    </label>
                                                    <label className='capsf-caption-field'>
                                                        <span>{ __( '"Show Less" Text', 'captain-social-feed' ) }</span>
                                                        <input type='text' className='capsf-wiz-input' maxLength='40' placeholder={ __( 'Show Less', 'captain-social-feed' ) } value={ settings.show_less_text ?? '' } onChange={ e => updateSetting( 'show_less_text', e.target.value ) } />
                                                    </label>
                                                </div>
                                            ) }
                                        </details>
                                    ) }

                                </div>
                                <div className='capsf-accordion-col'>

                                    {/* Click Action - what happens when a visitor clicks a post. */}
                                    <details className='capsf-setup-section' open>
                                        <summary className='capsf-setup-section-head'>
                                            <span className='capsf-setup-section-title'>{ __( 'Click Action', 'captain-social-feed' ) }</span>
                                            <span className='capsf-setup-section-badge'>
                                                { cardStyle === 'style-8' ? __( 'Popup', 'captain-social-feed' ) : ( PLAY_MODE_OPTIONS.find( opt => opt.value === ( ( ! settings.video_play_mode || settings.video_play_mode === 'youtube' ) ? 'platform' : settings.video_play_mode ) ) || PLAY_MODE_OPTIONS[ 0 ] ).badge }
                                            </span>
                                        </summary>
                                        { cardStyle === 'style-8' ? (
                                            <p className='capsf-wiz-field-hint'>{ __( 'Simple Grid always opens the post in a popup: the photo (or every photo of an album, as a slider), the video, likes, comments, caption and date, with a link to the original post.', 'captain-social-feed' ) }</p>
                                        ) : (
                                            <div className='capsf-play-mode-options' role='radiogroup' aria-label={ __( 'Click Action', 'captain-social-feed' ) }>
                                                { PLAY_MODE_OPTIONS.map( opt => {
                                                    const currentMode = ( ! settings.video_play_mode || settings.video_play_mode === 'youtube' ) ? 'platform' : settings.video_play_mode
                                                    const active = currentMode === opt.value
                                                    const select = () => updateSetting( 'video_play_mode', opt.value )
                                                    return (
                                                        <div
                                                            key={ opt.value }
                                                            role='radio'
                                                            aria-checked={ active }
                                                            tabIndex={ 0 }
                                                            className={ `capsf-play-mode-card${ active ? ' active' : '' }` }
                                                            onClick={ select }
                                                            onKeyDown={ e => { if ( e.key === 'Enter' || e.key === ' ' ) { e.preventDefault(); select() } } }
                                                        >
                                                            <div className='capsf-play-mode-icon' aria-hidden='true'>{ opt.icon }</div>
                                                            <div className='capsf-play-mode-text'>
                                                                <span className='capsf-play-mode-label'>{ opt.label }</span>
                                                                <span className='capsf-play-mode-desc'>{ opt.desc }</span>
                                                            </div>
                                                            <div className={ `capsf-play-mode-radio${ active ? ' active' : '' }` } aria-hidden='true'>
                                                                { active && <div className='capsf-play-mode-radio-dot' /> }
                                                            </div>
                                                        </div>
                                                    )
                                                } ) }
                                            </div>
                                        ) }
                                    </details>

                                    {/* Show Posts - which kind of posts the feed lists. */}
                                    <details className='capsf-setup-section' open>
                                        <summary className='capsf-setup-section-head'>
                                            <span className='capsf-setup-section-title'>{ __( 'Show Posts', 'captain-social-feed' ) }</span>
                                            <span className='capsf-setup-section-badge'>{ POST_FILTER_OPTIONS.find( opt => opt.key === postFilter )?.label }</span>
                                        </summary>
                                        <div className='capsf-col-chips' role='radiogroup' aria-label={ __( 'Show Posts', 'captain-social-feed' ) }>
                                            { POST_FILTER_OPTIONS.map( opt => (
                                                <label key={ opt.key } className={ `capsf-col-chip capsf-col-chip--text${ postFilter === opt.key ? ' active' : '' }` }>
                                                    <input type='radio' name='post_filter' value={ opt.key } checked={ postFilter === opt.key } onChange={ () => updateSetting( 'post_filter', opt.key ).then( () => setPreviewStatus( 'idle' ) ) } />
                                                    { opt.label }
                                                </label>
                                            ) ) }
                                        </div>
                                        <p className='capsf-wiz-field-hint'>{ POST_FILTER_OPTIONS.find( opt => opt.key === postFilter )?.hint }</p>
                                    </details>

                                    {/* X: profile header, reposts, replies. */}
                                    { isXFeed && (
                                        <details className='capsf-setup-section' open>
                                            <summary className='capsf-setup-section-head'>
                                                <span className='capsf-setup-section-title'>{ __( 'X Options', 'captain-social-feed' ) }</span>
                                            </summary>
                                            <div className='capsf-toggle-grid'>
                                                { isXTimeline && renderTipToggle( 'x_show_header', __( 'Show Profile Header', 'captain-social-feed' ), __( 'Banner, picture, name, Follow button and post / follower counts above the posts.', 'captain-social-feed' ) ) }
                                                { getXSource( settings ).value !== 'testimonials' && renderTipToggle( 'x_show_reposts', __( 'Show Reposts', 'captain-social-feed' ), __( 'Include posts reposted by the account, with a "Reposted" label.', 'captain-social-feed' ), false ) }
                                                { getXSource( settings ).value !== 'testimonials' && renderTipToggle( 'x_show_replies', __( 'Show Replies', 'captain-social-feed' ), __( 'Include replies to other posts.', 'captain-social-feed' ), false ) }
                                            </div>
                                        </details>
                                    ) }

                                    {/* Section title above the feed (any platform). */}
                                    <details className='capsf-setup-section' open>
                                        <summary className='capsf-setup-section-head'>
                                            <span className='capsf-setup-section-title'>{ __( 'Section Title', 'captain-social-feed' ) }</span>
                                            <span className='capsf-setup-section-badge'>{ settings.feed_title ? __( 'On', 'captain-social-feed' ) : __( 'Off', 'captain-social-feed' ) }</span>
                                        </summary>
                                        <div className='capsf-wiz-field'>
                                            <label className='capsf-wiz-label' htmlFor='capsf-feed-title'>{ __( 'Heading', 'captain-social-feed' ) }</label>
                                            <input
                                                id='capsf-feed-title'
                                                className='capsf-wiz-input'
                                                type='text'
                                                maxLength='120'
                                                placeholder={ __( 'e.g. What our clients tweet about us', 'captain-social-feed' ) }
                                                value={ settings.feed_title ?? '' }
                                                onChange={ e => updateSetting( 'feed_title', e.target.value ) }
                                            />
                                            <p className='capsf-wiz-field-hint'>{ __( 'Optional heading shown above the feed. Leave empty for none.', 'captain-social-feed' ) }</p>
                                        </div>
                                    </details>

                                </div>
                                </div>
                                </div>
                            ) }

                            {/* ── Behaviors tab ────────────────────────────────── */}
                            { activeSettingsTab === 'behaviors' && (
                                <div className='capsf-setup-grid'>
                                    <div className='capsf-accordion-group'>
                                        <div className='capsf-accordion-col'>
                                            {/* Equal Card Height - off by default. */}
                                            { showEqualHeight && (
                                                <details className='capsf-setup-section' open>
                                                    <summary className='capsf-setup-section-head'>
                                                        <span className='capsf-setup-section-title'>{ __( 'Card Alignment', 'captain-social-feed' ) }</span>
                                                    </summary>
                                                    { renderToggle( 'equal_height', __( 'Equal Card Height', 'captain-social-feed' ), __( 'Keep every card in a row the same height, even when some captions take two lines and others only one.', 'captain-social-feed' ), false ) }
                                                </details>
                                            ) }

                                            {/* Slider Options */}
                                            { isSlider && (
                                                <details className='capsf-setup-section' open>
                                                    <summary className='capsf-setup-section-head'>
                                                        <span className='capsf-setup-section-title'>{ __( 'Slider Options', 'captain-social-feed' ) }</span>
                                                    </summary>
                                                    <div className='capsf-toggle-grid'>
                                                        { renderToggle( 'auto_slide', __( 'Auto Slide', 'captain-social-feed' ), __( 'Automatically advance to the next slide every few seconds. Paused on hover, on keyboard focus and for visitors who prefer reduced motion.', 'captain-social-feed' ) ) }
                                                        { renderToggle( 'infinite_loop', __( 'Infinite Loop', 'captain-social-feed' ), __( 'Loop back to the first slide after the last one (and vice versa).', 'captain-social-feed' ) ) }
                                                    </div>
                                                    { sliderMode !== 'slider-3' && (
                                                        <div className='capsf-toggle-grid' style={ { marginTop: '14px' } }>
                                                            { [
                                                                { key: 'slider_arrow_offset_y', label: __( 'Arrow Vertical Offset', 'captain-social-feed' ), desc: __( 'Positive moves the arrows down, negative moves them up.', 'captain-social-feed' ) },
                                                                { key: 'slider_arrow_offset_x', label: __( 'Arrow Horizontal Offset', 'captain-social-feed' ), desc: __( 'Positive moves the arrows outward, negative moves them inward.', 'captain-social-feed' ) },
                                                            ].map( field => (
                                                                <div className='capsf-slider-toggle-row capsf-offset-field' key={ field.key }>
                                                                    <div className='capsf-offset-field-head'>
                                                                        <strong id={ `capsf-${ field.key }` }>{ field.label }</strong>
                                                                        <span className='capsf-offset-field-unit'>px</span>
                                                                    </div>
                                                                    <p>{ field.desc }</p>
                                                                    <div className='capsf-gap-control'>
                                                                        <input type='range' className='capsf-gap-slider' min={ -100 } max={ 100 } aria-labelledby={ `capsf-${ field.key }` } value={ Number( settings[ field.key ] ) || 0 } onChange={ e => updateSetting( field.key, e.target.value ) } />
                                                                        <input type='number' className='capsf-gap-number' min={ -100 } max={ 100 } placeholder='0' aria-labelledby={ `capsf-${ field.key }` } value={ settings[ field.key ] ?? '' } onChange={ e => updateSetting( field.key, e.target.value ) } />
                                                                    </div>
                                                                </div>
                                                            ) ) }
                                                        </div>
                                                    ) }
                                                </details>
                                            ) }
                                        </div>

                                        <div className='capsf-accordion-col'>
                                            {/* Load Behavior - Pagination Type, Initial Posts, Posts Per Click */}
                                            { showLoadBehavior && (
                                                <details className='capsf-setup-section capsf-setup-section--full' open>
                                                    <summary className='capsf-setup-section-head'>
                                                        <span className='capsf-setup-section-title'>{ __( 'Load Behavior', 'captain-social-feed' ) }</span>
                                                        <span className='capsf-setup-section-badge'>{ PAGINATION_OPTIONS.find( o => o.value === getPaginationType( settings ) )?.label }</span>
                                                    </summary>
                                                    <div className='capsf-field-card-grid'>
                                                        <div className={ `capsf-field-card${ getPaginationType( settings ) === 'load_more' ? '' : ' capsf-field-card--full' }` }>
                                                            <div className='capsf-field-card-head'>
                                                                <label className='capsf-field-card-label' htmlFor='capsf-pagination-type'>{ __( 'Pagination Type', 'captain-social-feed' ) }</label>
                                                            </div>
                                                            <select
                                                                id='capsf-pagination-type'
                                                                className='capsf-setup-select'
                                                                value={ getPaginationType( settings ) }
                                                                onChange={ e => updateSettings( { pagination_type: e.target.value, show_load_more: e.target.value === 'load_more' } ) }
                                                            >
                                                                { PAGINATION_OPTIONS.map( opt => (
                                                                    <option key={ opt.value } value={ opt.value } disabled={ !!opt.disabled }>{ opt.label }</option>
                                                                ) ) }
                                                            </select>
                                                        </div>

                                                        { getPaginationType( settings ) === 'load_more' && ( <>
                                                            <div className='capsf-field-card'>
                                                                <div className='capsf-field-card-head'>
                                                                    <span className='capsf-field-card-label'>{ __( 'Initial Posts', 'captain-social-feed' ) }</span>
                                                                    { renderResponsiveDeviceTabs( initialVideosDevice, setInitialVideosDevice ) }
                                                                </div>
                                                                <div className='capsf-col-chips capsf-col-chips--wrap'>
                                                                    { MAX_OPTIONS.map( n => (
                                                                        <label key={ n } className={ `capsf-col-chip capsf-col-chip--round${ getInitialVideosVal( initialVideosDevice ) === n ? ' active' : '' }` }>
                                                                            <input type='radio' name={ `initial_videos_${ initialVideosDevice }` } value={ n } checked={ getInitialVideosVal( initialVideosDevice ) === n } onChange={ () => updateSetting( getInitialVideosKey( initialVideosDevice ), n ) } />
                                                                            { n }
                                                                        </label>
                                                                    ) ) }
                                                                </div>
                                                            </div>

                                                            <div className='capsf-field-card'>
                                                                <div className='capsf-field-card-head'>
                                                                    <span className='capsf-field-card-label'>{ __( 'Posts Per Click', 'captain-social-feed' ) }</span>
                                                                    { renderResponsiveDeviceTabs( loadMoreDevice, setLoadMoreDevice ) }
                                                                </div>
                                                                <div className='capsf-col-chips capsf-col-chips--wrap'>
                                                                    { LOAD_MORE_OPTIONS.map( n => (
                                                                        <label key={ n } className={ `capsf-col-chip capsf-col-chip--round${ getLoadMoreVal( loadMoreDevice ) === n ? ' active' : '' }` }>
                                                                            <input type='radio' name={ `load_more_count_${ loadMoreDevice }` } value={ n } checked={ getLoadMoreVal( loadMoreDevice ) === n } onChange={ () => updateSetting( getLoadMoreKey( loadMoreDevice ), n ) } />
                                                                            { n }
                                                                        </label>
                                                                    ) ) }
                                                                </div>
                                                            </div>
                                                            { loadMoreHasNothingToLoad && (
                                                                <p className='capsf-wiz-field-hint capsf-wiz-field-hint--warning' role='alert'>
                                                                    { sprintf(
                                                                        /* translators: 1: Initial Posts count, 2: Max Posts count. */
                                                                        __( 'The Load More button will not show: Initial Posts (%1$d) is not lower than Max Posts (%2$d), so there is nothing left to load.', 'captain-social-feed' ),
                                                                        largestInitialPosts,
                                                                        maxPostsNum
                                                                    ) }
                                                                </p>
                                                            ) }
                                                        </> ) }
                                                    </div>
                                                </details>
                                            ) }
                                        </div>
                                    </div>
                                </div>
                            ) }

                            {/* ── Styles tab ───────────────────────────────────── */}
                            { activeSettingsTab === 'styles' && (
                                <>
                                    {/* Color Mode - a starting palette; every panel below fine-tunes it. */}
                                    <details className='capsf-setup-section capsf-setup-section--full capsf-color-mode' open>
                                        <summary className='capsf-setup-section-head'>
                                            <span className='capsf-setup-section-title'>{ __( 'Color Mode', 'captain-social-feed' ) }</span>
                                            <span className='capsf-setup-section-badge'>{ ( STYLE_PRESETS.find( p => p.key === ( settings.style_preset || 'light' ) ) || STYLE_PRESETS[ 0 ] ).label }</span>
                                        </summary>
                                        <div className='capsf-mode-options' role='radiogroup' aria-label={ __( 'Color Mode', 'captain-social-feed' ) }>
                                            { STYLE_PRESETS.map( preset => {
                                                const active = ( settings.style_preset || 'light' ) === preset.key
                                                return (
                                                    <label key={ preset.key } className={ `capsf-mode-option${ active ? ' active' : '' }` }>
                                                        <input type='radio' name='style_preset' value={ preset.key } checked={ active } onChange={ () => applyPreset( preset ) } />
                                                        <span className='capsf-mode-swatch' aria-hidden='true' style={ { background: preset.preview.bg, borderColor: preset.preview.border } }>
                                                            <span style={ { background: preset.preview.card, borderColor: preset.preview.border } } />
                                                        </span>
                                                        <span className='capsf-mode-label'>{ preset.label }</span>
                                                    </label>
                                                )
                                            } ) }
                                        </div>
                                        <p className='capsf-wiz-field-hint'>{ __( 'Sets the card, text and border colors. The panels below fine-tune them.', 'captain-social-feed' ) }</p>
                                    </details>

                                    { isPlaylistLayout ? (
                                        <>
                                            <div className='capsf-accordion-group'>
                                                <div className='capsf-accordion-col'>
                                                    <CardTextStyle prefix='playlist_featured_title' title={ __( 'Featured Title', 'captain-social-feed' ) } colorLabel={ __( 'Title Color', 'captain-social-feed' ) } { ...styleProps } />
                                                </div>
                                                <div className='capsf-accordion-col'>
                                                    <CardImageStyle layout='single' prefix='playlist_featured_thumb' title={ __( 'Featured Image', 'captain-social-feed' ) } { ...styleProps } />
                                                </div>
                                            </div>
                                            <div className='capsf-accordion-group'>
                                                <div className='capsf-accordion-col'>
                                                    <CardTextStyle prefix='playlist_item_title' title={ __( 'List Item Title', 'captain-social-feed' ) } colorLabel={ __( 'Title Color', 'captain-social-feed' ) } { ...styleProps } />
                                                    <CardTextStyle prefix='playlist_item_stats' title={ __( 'List Item Stats', 'captain-social-feed' ) } colorLabel={ __( 'Stats Color', 'captain-social-feed' ) } defaultColor='#6b7280' { ...styleProps } />
                                                </div>
                                                <div className='capsf-accordion-col'>
                                                    <CardImageStyle layout='single' prefix='playlist_item_thumb' title={ __( 'List Item Image', 'captain-social-feed' ) } { ...styleProps } />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <CardBackgroundStyle showGap={ !isSlider && !isSingleLayout } { ...styleProps } />
                                            <div className='capsf-accordion-group'>
                                                <div className='capsf-accordion-col'>
                                                    { cardHas( 'title' ) && (
                                                        <CardTextStyle
                                                            prefix='title'
                                                            title={ isSocialLayout ? __( 'Account Name', 'captain-social-feed' ) : __( 'Card Title', 'captain-social-feed' ) }
                                                            colorLabel={ isSocialLayout ? __( 'Name Color', 'captain-social-feed' ) : __( 'Title Color', 'captain-social-feed' ) }
                                                            { ...styleProps }
                                                        />
                                                    ) }
                                                    { cardHas( 'stats' ) && (
                                                        <CardTextStyle prefix='stats' title={ __( 'Stats', 'captain-social-feed' ) } colorLabel={ __( 'Stats Color', 'captain-social-feed' ) } defaultColor='#6b7280' { ...styleProps } />
                                                    ) }
                                                </div>
                                                <div className='capsf-accordion-col'>
                                                    { cardHas( 'description' ) && (
                                                        <CardTextStyle
                                                            prefix='description'
                                                            title={ isSocialLayout ? __( 'Caption', 'captain-social-feed' ) : __( 'Description', 'captain-social-feed' ) }
                                                            colorLabel={ isSocialLayout ? __( 'Caption Color', 'captain-social-feed' ) : __( 'Description Color', 'captain-social-feed' ) }
                                                            defaultColor='#4b5563'
                                                            { ...styleProps }
                                                        />
                                                    ) }
                                                    { isSocialLayout && captionMode === 'show_more' && (
                                                        <CardTextStyle prefix='show_more' title={ __( 'Show More / Less Link', 'captain-social-feed' ) } colorLabel={ __( 'Link Color', 'captain-social-feed' ) } defaultColor='#111827' { ...styleProps } />
                                                    ) }
                                                    { isSocialLayout && captionMode === 'scroll' && (
                                                        <CaptionScrollStyle { ...styleProps } />
                                                    ) }
                                                </div>
                                            </div>
                                            <CardImageStyle layout='single' { ...styleProps } />
                                        </>
                                    ) }
                                </>
                            ) }

                            </div>
                        </div>

                        <NextPortal slot={ nextSlotEl }>
                            <button className='capsf-wiz-btn-primary' disabled={ navPending } onClick={ goNextSafely( () => autoSave( settingsRef.current ) ) }>
                                { navPending ? <><span className='capsf-btn-spinner' />{ __( 'Saving...', 'captain-social-feed' ) }</> : __( 'Save and get code', 'captain-social-feed' ) }
                            </button>
                        </NextPortal>
                    </div>
                ) }

                {/* ════ STEP 4: Insert Code ════ */}
                { step === 4 && (
                    <div className='capsf-step5-wrap'>

                        {/* Hero success banner */}
                        <div className='capsf-step5-hero'>
                            <div className='capsf-step5-hero-left'>
                                <div className='capsf-step5-hero-icon'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='26' height='26'><circle cx='12' cy='12' r='10'/><polyline points='16 9 10.5 15 8 12.5'/></svg>
                                </div>
                                <div>
                                    <div className='capsf-step5-hero-title-row'>
                                        <h2 className='capsf-step5-hero-title'>{ sprintf( __( 'Feed #%s Generated Successfully', 'captain-social-feed' ), feedId ) }</h2>
                                        <span className='capsf-step5-active-badge'><span className='dot' />{ __( 'Active', 'captain-social-feed' ) }</span>
                                    </div>
                                    <p className='capsf-step5-hero-sub'>{ __( 'Your social feed is ready to be added to your WordPress site.', 'captain-social-feed' ) }</p>
                                </div>
                            </div>
                            <span className='capsf-step5-id-chip'>{ sprintf( __( 'ID: feed_%s', 'captain-social-feed' ), feedId ) }</span>
                        </div>

                        {/* Embed Code - tabbed Shortcode / PHP Snippet */}
                        <div className='capsf-step5-embed-card' ref={ embedCardRef }>
                            <div className='capsf-step5-embed-head'>
                                <div className='capsf-step5-embed-head-left'>
                                    <span className='capsf-step5-embed-label'>{ __( 'Embed Code', 'captain-social-feed' ) }</span>
                                    <div className='capsf-step5-tabs' role='tablist'>
                                        <button type='button' role='tab' className={ `capsf-step5-tab${ embedTab === 'shortcode' ? ' active' : '' }` } onClick={ () => setEmbedTab( 'shortcode' ) }>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/></svg>
                                            { __( 'Shortcode', 'captain-social-feed' ) }
                                        </button>
                                        <button type='button' role='tab' className={ `capsf-step5-tab${ embedTab === 'php' ? ' active' : '' }` } onClick={ () => setEmbedTab( 'php' ) }>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><polyline points='4 17 10 11 4 5'/><line x1='12' y1='19' x2='20' y2='19'/></svg>
                                            { __( 'PHP Snippet', 'captain-social-feed' ) }
                                        </button>
                                    </div>
                                </div>
                                <span className={ `capsf-step5-ready-badge${ embedTab === 'php' ? ' is-php' : '' }` }>
                                    { embedTab === 'shortcode' ? (
                                        <><svg viewBox='0 0 24 24' fill='currentColor' width='11' height='11'><path d='M13 2L3 14h7l-1 8 10-12h-7l1-8z'/></svg>{ __( '1-Click Ready', 'captain-social-feed' ) }</>
                                    ) : (
                                        <><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='11' height='11'><path d='M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1'/></svg>{ __( 'Direct Template', 'captain-social-feed' ) }</>
                                    ) }
                                </span>
                            </div>

                            { embedTab === 'shortcode' ? (
                                <div className='capsf-step5-embed-panel'>
                                    <div className='capsf-step5-code-box'>
                                        <div className='capsf-step5-code-text'>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/></svg>
                                            <span>{ shortcode }</span>
                                        </div>
                                        <button className={ `capsf-step5-copy-btn${ copiedShortcode ? ' copied' : '' }` } onClick={ handleCopy }>
                                            { copiedShortcode ? (
                                                <>
                                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' width='15' height='15'><polyline points='20 6 9 17 4 12'/></svg>
                                                    { __( 'Copied to Clipboard!', 'captain-social-feed' ) }
                                                </>
                                            ) : (
                                                <>
                                                    <svg viewBox='0 0 24 24' fill='currentColor' width='14' height='14'><path d='M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/></svg>
                                                    { __( 'Copy Shortcode', 'captain-social-feed' ) }
                                                </>
                                            ) }
                                        </button>
                                    </div>
                                    <div className='capsf-step5-embed-foot'>
                                        <span>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/></svg>
                                            { __( 'Standard WordPress embed shortcode for pages, widgets, and posts.', 'captain-social-feed' ) }
                                        </span>
                                        <span className='capsf-step5-validated'>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><path d='M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z'/><polyline points='9 12 11 14 15 10'/></svg>
                                            { __( 'Syntax Validated', 'captain-social-feed' ) }
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className='capsf-step5-embed-panel'>
                                    <div className='capsf-step5-php-codeblock'>
                                        <div className='capsf-step5-php-codeblock-head'>
                                            <span>
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><polyline points='4 17 10 11 4 5'/><line x1='12' y1='19' x2='20' y2='19'/></svg>
                                                { __( 'functions.php', 'captain-social-feed' ) }
                                            </span>
                                            <button className={ `capsf-step5-php-codeblock-copy${ copiedPhpSnippet ? ' copied' : '' }` } onClick={ handleCopyPhp }>
                                                { copiedPhpSnippet ? (
                                                    <>
                                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' width='12' height='12'><polyline points='20 6 9 17 4 12'/></svg>
                                                        { __( 'Copied PHP Code!', 'captain-social-feed' ) }
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg viewBox='0 0 24 24' fill='currentColor' width='11' height='11'><path d='M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/></svg>
                                                        { __( 'Copy PHP Code', 'captain-social-feed' ) }
                                                    </>
                                                ) }
                                            </button>
                                        </div>
                                        <pre className='capsf-step5-php-codeblock-code'><code>{ phpSnippet }</code></pre>
                                    </div>
                                    <div className='capsf-step5-embed-foot'>
                                        <span>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><circle cx='12' cy='12' r='10'/><line x1='12' y1='16' x2='12' y2='12'/><line x1='12' y1='8' x2='12.01' y2='8'/></svg>
                                            { __( 'Paste into your child theme\'s functions.php, then call', 'captain-social-feed' ) }
                                            { ' ' }<code className='capsf-step5-inline-code'>{ `${ phpFunctionName }();` }</code>{ ' ' }
                                            { __( 'from any template file.', 'captain-social-feed' ) }
                                        </span>
                                        <span className='capsf-step5-validated capsf-step5-validated--php'>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><path d='M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z'/><polyline points='9 12 11 14 15 10'/></svg>
                                            { __( 'PHP 7.4 - 8.3 Ready', 'captain-social-feed' ) }
                                        </span>
                                    </div>
                                </div>
                            ) }
                        </div>

                        {/* Multi-Platform Embedding Hub */}
                        <div className='capsf-step5-hub'>
                            <div className='capsf-step5-hub-head'>
                                <div>
                                    <h3>{ __( 'Multi-Platform Embedding Hub', 'captain-social-feed' ) }</h3>
                                    <p>{ __( 'Select how you want to embed this feed into your WordPress setup', 'captain-social-feed' ) }</p>
                                </div>
                                <span className='capsf-step5-hub-count'>{ __( '3 Integration Methods', 'captain-social-feed' ) }</span>
                            </div>

                            <div className='capsf-step5-hub-grid'>

                                {/* Card 1: Gutenberg */}
                                <div className='capsf-step5-hub-card'>
                                    <div>
                                        <div className='capsf-step5-hub-card-top'>
                                            <div className='capsf-step5-hub-icon capsf-step5-hub-icon--blue'>
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='18' height='18'><rect x='3' y='3' width='7' height='7' rx='1'/><rect x='14' y='3' width='7' height='7' rx='1'/><rect x='3' y='14' width='7' height='7' rx='1'/><rect x='14' y='14' width='7' height='7' rx='1'/></svg>
                                            </div>
                                            <span className='capsf-step5-hub-tag'>{ __( 'Default', 'captain-social-feed' ) }</span>
                                        </div>
                                        <h4>{ __( 'WordPress Block Editor', 'captain-social-feed' ) }</h4>
                                        <p className='capsf-step5-hub-sub'>{ __( 'Gutenberg Native', 'captain-social-feed' ) }</p>
                                        <p className='capsf-step5-hub-desc'>
                                            { __( 'Add a', 'captain-social-feed' ) } <strong>{ __( 'Shortcode', 'captain-social-feed' ) }</strong> { __( 'or', 'captain-social-feed' ) } <strong>{ __( 'Captain Social Feed', 'captain-social-feed' ) }</strong> { __( 'block anywhere in your block editor and publish.', 'captain-social-feed' ) }
                                        </p>
                                    </div>
                                    <button type='button' className='capsf-step5-hub-btn capsf-step5-hub-btn--brand' onClick={ handleGutenbergAutoInsert }>
                                        { gutenbergInsertState === 'copied' ? (
                                            <><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='12' height='12'><polyline points='20 6 9 17 4 12'/></svg>{ __( 'Copied - opening new page…', 'captain-social-feed' ) }</>
                                        ) : (
                                            <><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='12' height='12'><line x1='12' y1='5' x2='12' y2='19'/><line x1='5' y1='12' x2='19' y2='12'/></svg>{ __( 'Copy & Create New Page', 'captain-social-feed' ) }</>
                                        ) }
                                    </button>
                                </div>

                                {/* Card 2: Elementor */}
                                <div className='capsf-step5-hub-card'>
                                    <div>
                                        <div className='capsf-step5-hub-card-top'>
                                            <div className='capsf-step5-hub-icon capsf-step5-hub-icon--rose'>
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='18' height='18'><path d='M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l1.3-1.3a4 4 0 11-4.3 4.3l-1.3 1.3a1 1 0 000 1.4l1.6 1.6a1 1 0 010 1.4l-1.4 1.4a1 1 0 01-1.4 0L3 10.1a1 1 0 010-1.4l1.4-1.4a1 1 0 011.4 0l1.6 1.6a1 1 0 001.4 0l1.3-1.3a4 4 0 015.6-5.6z'/></svg>
                                            </div>
                                            <span className='capsf-step5-hub-tag capsf-step5-hub-tag--rose'>{ __( 'Builder', 'captain-social-feed' ) }</span>
                                        </div>
                                        <h4>{ __( 'Elementor Page Builder', 'captain-social-feed' ) }</h4>
                                        <p className='capsf-step5-hub-sub'>{ __( 'Drag & Drop Widget', 'captain-social-feed' ) }</p>
                                        <p className='capsf-step5-hub-desc'>
                                            { __( 'Search for', 'captain-social-feed' ) } <strong>{ __( '"Captain Social Feed"', 'captain-social-feed' ) }</strong> { __( 'or', 'captain-social-feed' ) } <strong>{ __( 'Shortcode', 'captain-social-feed' ) }</strong> { __( 'widget in Elementor panel and drag into layout.', 'captain-social-feed' ) }
                                        </p>
                                    </div>
                                    <a className='capsf-step5-hub-btn' href={ elementorNewPageUrl } target='_blank' rel='noopener noreferrer'>
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><path d='M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6'/><polyline points='15 3 21 3 21 9'/><line x1='10' y1='14' x2='21' y2='3'/></svg>
                                        { __( 'Open in Elementor', 'captain-social-feed' ) }
                                    </a>
                                </div>

                                {/* Card 3: PHP / Theme Template */}
                                <div className='capsf-step5-hub-card'>
                                    <div>
                                        <div className='capsf-step5-hub-card-top'>
                                            <div className='capsf-step5-hub-icon capsf-step5-hub-icon--indigo'>
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='18' height='18'><polyline points='4 17 10 11 4 5'/><line x1='12' y1='19' x2='20' y2='19'/></svg>
                                            </div>
                                            <span className='capsf-step5-hub-tag capsf-step5-hub-tag--indigo'>{ __( 'Developer', 'captain-social-feed' ) }</span>
                                        </div>
                                        <h4>{ __( 'PHP / Theme Template', 'captain-social-feed' ) }</h4>
                                        <p className='capsf-step5-hub-sub'>{ __( 'Direct Template Code', 'captain-social-feed' ) }</p>
                                        <p className='capsf-step5-hub-desc'>
                                            { __( 'Insert feed directly into PHP template files like', 'captain-social-feed' ) } <code>single.php</code> { __( 'or', 'captain-social-feed' ) } <code>footer.php</code>.
                                        </p>
                                    </div>
                                    <div className='capsf-step5-hub-toggle-wrap'>
                                        <button
                                            type='button'
                                            className='capsf-step5-hub-toggle'
                                            onClick={ () => {
                                                // Jumps back up to the Embed Code card's own PHP
                                                // Snippet tab instead of repeating the same code
                                                // block down here a second time.
                                                setEmbedTab( 'php' )
                                                embedCardRef.current?.scrollIntoView( { behavior: 'smooth', block: 'start' } )
                                            } }
                                        >
                                            <span>
                                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><polyline points='16 18 22 12 16 6'/><polyline points='8 6 2 12 8 18'/></svg>
                                                { __( 'View PHP Function', 'captain-social-feed' ) }
                                            </span>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' width='10' height='10'><polyline points='7 17 17 7'/><polyline points='7 7 17 7 17 17'/></svg>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Feed Diagnostic & Cache Status */}
                        <div className='capsf-step5-diag'>
                            <div className='capsf-step5-diag-head'>
                                <div className='capsf-step5-diag-head-left'>
                                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='15' height='15'><polyline points='3 17 9 11 13 15 21 5'/><polyline points='16 5 21 5 21 10'/></svg>
                                    <span>{ __( 'Feed Diagnostic & Cache Status', 'captain-social-feed' ) }</span>
                                </div>
                                <span className='capsf-step5-diag-hint'>{ sprintf( __( 'Auto-sync active with the %s API', 'captain-social-feed' ), feedPlatformLabel ) }</span>
                            </div>

                            <div className='capsf-step5-diag-grid'>
                                <div className='capsf-step5-diag-stat'>
                                    <span className='capsf-step5-diag-stat-label'>{ __( 'Health Status', 'captain-social-feed' ) }</span>
                                    { previewStatus === 'error' ? (
                                        <div className='capsf-step5-diag-stat-value is-error'>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg>
                                            { __( 'Connection Issue', 'captain-social-feed' ) }
                                        </div>
                                    ) : previewStatus === 'loading' ? (
                                        <div className='capsf-step5-diag-stat-value'>
                                            <span className='capsf-btn-spinner' />
                                            { __( 'Checking…', 'captain-social-feed' ) }
                                        </div>
                                    ) : (
                                        <div className='capsf-step5-diag-stat-value is-ok'>
                                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><circle cx='12' cy='12' r='10'/><polyline points='16 9 10.5 15 8 12.5'/></svg>
                                            { __( 'OK (Connected)', 'captain-social-feed' ) }
                                        </div>
                                    ) }
                                </div>
                                <div className='capsf-step5-diag-stat'>
                                    <span className='capsf-step5-diag-stat-label'>{ __( 'Max Posts', 'captain-social-feed' ) }</span>
                                    <div className='capsf-step5-diag-stat-value'>
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><rect x='2' y='7' width='15' height='10' rx='2'/><polygon points='22 7 17 12 22 17'/></svg>
                                        { sprintf( __( '%d posts configured', 'captain-social-feed' ), Number( settings.max_results ) || 6 ) }
                                    </div>
                                </div>
                                <div className='capsf-step5-diag-stat'>
                                    <span className='capsf-step5-diag-stat-label'>{ __( 'Cache Lifetime', 'captain-social-feed' ) }</span>
                                    <div className='capsf-step5-diag-stat-value'>
                                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>
                                        { formatCacheDuration( ( typeof capsf_data !== 'undefined' ? capsf_data.cache_duration : 0 ) ) }
                                    </div>
                                </div>
                                <div className='capsf-step5-diag-stat'>
                                    <span className='capsf-step5-diag-stat-label'>{ __( 'Last Synchronized', 'captain-social-feed' ) }</span>
                                    <div className='capsf-step5-diag-stat-value capsf-step5-diag-stat-value--mono'>
                                        { feedData?.last_modified || '-' }
                                    </div>
                                </div>
                            </div>

                            <div className='capsf-step5-diag-foot'>
                                <div className='capsf-step5-diag-foot-left'>
                                    <button
                                        type='button'
                                        className={ `capsf-step5-diag-purge-btn${ feedCacheStatus === 'loading' ? ' is-loading' : '' }` }
                                        disabled={ feedCacheStatus === 'loading' }
                                        onClick={ handleClearFeedCache }
                                    >
                                        <svg className={ feedCacheStatus === 'loading' ? 'capsf-spin' : '' } viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' width='13' height='13'><polyline points='23 4 23 10 17 10'/><polyline points='1 20 1 14 7 14'/><path d='M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15'/></svg>
                                        { feedCacheStatus === 'loading' ? __( 'Clearing…', 'captain-social-feed' ) : __( 'Purge Feed Cache', 'captain-social-feed' ) }
                                    </button>
                                    { feedCacheMessage && (
                                        <span className={ `capsf-step5-diag-purge-msg${ feedCacheStatus === 'error' ? ' is-error' : ' is-success' }` }>
                                            { feedCacheStatus !== 'error' && <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' width='11' height='11'><polyline points='20 6 9 17 4 12'/></svg> }
                                            { feedCacheMessage }
                                        </span>
                                    ) }
                                </div>
                                <span className='capsf-step5-diag-foot-hint'>{ __( 'Clearing cache forces a fresh pull for the latest posts', 'captain-social-feed' ) }</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='capsf-step5-footer-actions'>
                            <button className='capsf-step5-footer-btn' onClick={ prevStep }>
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><line x1='19' y1='12' x2='5' y2='12'/><polyline points='12 19 5 12 12 5'/></svg>
                                { __( 'Back to Feed Customizer', 'captain-social-feed' ) }
                            </button>
                            <button className='capsf-step5-footer-btn capsf-step5-footer-btn--primary' onClick={ () => navigate( '/' ) }>
                                { __( 'Finish & Go to Dashboard', 'captain-social-feed' ) }
                                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' width='12' height='12'><line x1='5' y1='12' x2='19' y2='12'/><polyline points='12 5 19 12 12 19'/></svg>
                            </button>
                        </div>
                    </div>
                ) }

            </div>{/* end .capsf-wiz-body */}
        </div>
        </XPreviewContext.Provider>
        </CaptionContext.Provider>
    )
}

export default EditFeed
