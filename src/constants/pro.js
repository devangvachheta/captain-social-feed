// Single source of truth for the Captain Social Feed Pro purchase link.
// Update this one value and every "Upgrade to Pro" / "Upgrade Now" button
// across the dashboard (White Label upsell, Upgrade Now page, sidebar CTA)
// picks up the change automatically.
export const CAPSF_PRO_URL = 'https://devangvachheta.gumroad.com/l/captain-social-feed-pro';

// Same purchase link, tagged per placement so Devang can tell which surface
// is actually driving clicks in Gumroad's analytics. Add a new one here
// (rather than hardcoding a UTM string at the call site) any time a new
// "Upgrade Now" surface needs its own tag.
export const CAPSF_PRO_URL_BANNER =
    CAPSF_PRO_URL + '?utm_campaign=captain_feed_pro&utm_content=banner_cta&utm_medium=banner&utm_source=banner&utm_term=top_banner';

export const CAPSF_PRO_URL_PRICING_TABLE =
    CAPSF_PRO_URL + '?utm_campaign=captain_feed_pro&utm_content=pricing_table_cta&utm_medium=pricing&utm_source=pricing&utm_term=pricing_table';

export const CAPSF_PRO_URL_WHITE_LABEL =
    CAPSF_PRO_URL + '?utm_campaign=captain_feed_pro&utm_content=white_label_cta&utm_medium=white_label&utm_source=whitelabel-page&utm_term=white_label_page';

// Optional style link if needed.
export const CAPSF_PRO_URL_STYLE_OPTION =
    CAPSF_PRO_URL + '?utm_source=style_option&utm_medium=styles&utm_campaign=captain_feed_pro&utm_term=style_option&utm_content=style_ctc';
