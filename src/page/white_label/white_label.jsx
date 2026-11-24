import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import MultiSelect from '../../components/multi_select/multi_select.jsx';
import { CAPSF_PRO_URL_WHITE_LABEL } from '../../constants/pro.js';
import './white_label.scss';

const isPro = typeof capsf_data !== 'undefined' && !! capsf_data?.capsfpro_active;

const HIDEABLE_ITEMS = [
    { key: 'create',       label: __( 'Create Feed', 'captain-social-feed' ) },
    { key: 'docs',         label: __( 'Documentation', 'captain-social-feed' ) },
    { key: 'settings',     label: __( 'Settings', 'captain-social-feed' ) },
    { key: 'help',         label: __( 'Help', 'captain-social-feed' ) },
    { key: 'rollback',     label: __( 'Roll Back', 'captain-social-feed' ) },
    { key: 'our-products', label: __( 'Our Products', 'captain-social-feed' ) },
    { key: 'white-label',  label: __( 'White Label', 'captain-social-feed' ) },
];

const DEFAULTS = {
    plugin_name:    '',
    menu_icon_light: '',
    menu_icon_dark:  '',
    hide_items:      [],
    hide_plugin:     false,
};

const IconTag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.17L4 3a1 1 0 0 0-1 1l.17 5.59a2 2 0 0 0 .66 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"/>
        <circle cx="7.5" cy="7.5" r="1.5"/>
    </svg>
);
const IconEyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
);

const WhiteLabel = () => {
    const [pluginName,     setPluginName]     = useState('');
    const [menuIconLight,  setMenuIconLight]  = useState('');
    const [menuIconDark,   setMenuIconDark]   = useState('');
    const [hideItems,      setHideItems]      = useState([]);
    const [hidePlugin,     setHidePlugin]     = useState(false);
    const [loading,        setLoading]        = useState(isPro);
    const [status,         setStatus]         = useState('idle'); // idle | saving | success | error | clearing
    const [message,        setMessage]        = useState('');

    // ── Load saved white label settings (Pro only) ───────────────────
    useEffect(() => {
        if (!isPro) return;

        const formData = new FormData();
        formData.append('action', 'capsfpro_dashboard_ajax_call');
        formData.append('nonce',  capsf_data.capsf_nonce);
        formData.append('type',   'get_white_label');

        fetch(capsf_data.ajax_url, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(result => {
                if (result.success && result.data) {
                    setPluginName(result.data.plugin_name || '');
                    setMenuIconLight(result.data.menu_icon_light || '');
                    setMenuIconDark(result.data.menu_icon_dark || '');
                    setHideItems(Array.isArray(result.data.hide_items) ? result.data.hide_items : []);
                    setHidePlugin(!!result.data.hide_plugin);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const flashMessage = (nextStatus, text) => {
        setStatus(nextStatus);
        setMessage(text);
        setTimeout(() => { setStatus('idle'); setMessage(''); }, 4500);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setStatus('saving');
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('action',           'capsfpro_dashboard_ajax_call');
            formData.append('nonce',            capsf_data.capsf_nonce);
            formData.append('type',             'save_white_label');
            formData.append('plugin_name',      pluginName);
            formData.append('menu_icon_light',  menuIconLight);
            formData.append('menu_icon_dark',   menuIconDark);
            formData.append('hide_plugin',      hidePlugin ? '1' : '0');
            hideItems.forEach((key) => formData.append('hide_items[]', key));

            const response = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData });
            const result   = await response.json();

            if (result.success) {
                flashMessage('success', __('White label settings saved.', 'captain-social-feed'));
            } else {
                flashMessage('error', result.message || __('Something went wrong. Please try again.', 'captain-social-feed'));
            }
        } catch {
            flashMessage('error', __('Something went wrong. Please try again.', 'captain-social-feed'));
        }
    };

    const handleClear = async () => {
        if (status === 'clearing') return;
        setStatus('clearing');
        setMessage('');

        try {
            const formData = new FormData();
            formData.append('action', 'capsfpro_dashboard_ajax_call');
            formData.append('nonce',  capsf_data.capsf_nonce);
            formData.append('type',   'reset_white_label');

            const response = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData });
            const result   = await response.json();

            if (result.success) {
                setPluginName(DEFAULTS.plugin_name);
                setMenuIconLight(DEFAULTS.menu_icon_light);
                setMenuIconDark(DEFAULTS.menu_icon_dark);
                setHideItems(DEFAULTS.hide_items);
                setHidePlugin(DEFAULTS.hide_plugin);
                flashMessage('success', __('White label settings cleared.', 'captain-social-feed'));
            } else {
                flashMessage('error', result.message || __('Something went wrong. Please try again.', 'captain-social-feed'));
            }
        } catch {
            flashMessage('error', __('Something went wrong. Please try again.', 'captain-social-feed'));
        }
    };

    // ── Free users: upsell card ───────────────────────────────────────
    if (!isPro) {
        return (
            <div className="capsf-wl-wrapper">
                <div className="capsf-wl-header">
                    <h1 className="capsf-wl-title">{__('White Label', 'captain-social-feed')}</h1>
                    <p className="capsf-wl-subtitle">
                        {__('Rename the plugin, set custom menu icons, and control what\u2019s visible.', 'captain-social-feed')}
                    </p>
                </div>

                <div className="capsf-wl-upsell">
                    <span className="capsf-wl-upsell-badge">{__('PRO', 'captain-social-feed')}</span>
                    <h2>{__('White Label is a Pro feature', 'captain-social-feed')}</h2>
                    <p>
                        {__('Upgrade to Captain Social Feed Pro to replace the plugin name and menu icons with your own branding, hide the menu items your clients shouldn\u2019t see, and even hide the plugin from the Plugins list.', 'captain-social-feed')}
                    </p>
                    <a
                        className="capsf-wl-upsell-btn"
                        href={ CAPSF_PRO_URL_WHITE_LABEL }
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {__('Upgrade to Pro', 'captain-social-feed')}
                    </a>
                </div>
            </div>
        );
    }

    // ── Pro users: real form ──────────────────────────────────────────
    return (
        <div className="capsf-wl-wrapper">
            <div className="capsf-wl-header">
                <h1 className="capsf-wl-title">{__('White Label', 'captain-social-feed')}</h1>
                <p className="capsf-wl-subtitle">
                    {__('Rename the plugin, set custom menu icons, and control what\u2019s visible.', 'captain-social-feed')}
                </p>
            </div>

            <form className="capsf-wl-sections" onSubmit={handleSave}>

                {/* ── Branding section ── */}
                <div className="capsf-wl-section">
                    <div className="capsf-wl-section-header">
                        <div className="capsf-wl-section-icon"><IconTag /></div>
                        <div>
                            <h2>{__('Branding', 'captain-social-feed')}</h2>
                            <p>{__('Change how the plugin appears in your WordPress admin.', 'captain-social-feed')}</p>
                        </div>
                    </div>

                    <div className="capsf-wl-section-body">
                        <div className="capsf-wl-field">
                            <label htmlFor="capsf-wl-plugin-name">{__('Plugin Display Name', 'captain-social-feed')}</label>
                            <input
                                id="capsf-wl-plugin-name"
                                type="text"
                                value={pluginName}
                                placeholder={__('Captain Social Feed', 'captain-social-feed')}
                                onChange={(e) => setPluginName(e.target.value)}
                                disabled={loading}
                            />
                            <p className="capsf-wl-hint">
                                {__('Replaces the plugin name shown throughout the admin menu.', 'captain-social-feed')}
                            </p>
                        </div>

                        <div className="capsf-wl-field-row">
                            <div className="capsf-wl-field">
                                <label htmlFor="capsf-wl-menu-icon-light">{__('Menu Icon URL ( Light Mode )', 'captain-social-feed')}</label>
                                <input
                                    id="capsf-wl-menu-icon-light"
                                    type="url"
                                    value={menuIconLight}
                                    placeholder="https://example.com/icon-light.svg"
                                    onChange={(e) => setMenuIconLight(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="capsf-wl-hint">
                                    {__('Used when the dashboard is in light mode.', 'captain-social-feed')}
                                </p>
                            </div>

                            <div className="capsf-wl-field">
                                <label htmlFor="capsf-wl-menu-icon-dark">{__('Menu Icon URL ( Dark Mode )', 'captain-social-feed')}</label>
                                <input
                                    id="capsf-wl-menu-icon-dark"
                                    type="url"
                                    value={menuIconDark}
                                    placeholder="https://example.com/icon-dark.svg"
                                    onChange={(e) => setMenuIconDark(e.target.value)}
                                    disabled={loading}
                                />
                                <p className="capsf-wl-hint">
                                    {__('Used when the dashboard is in dark mode. Leave either blank to fall back to the default mark.', 'captain-social-feed')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Menu visibility section ── */}
                <div className="capsf-wl-section">
                    <div className="capsf-wl-section-header">
                        <div className="capsf-wl-section-icon"><IconEyeOff /></div>
                        <div>
                            <h2>{__('Menu Visibility', 'captain-social-feed')}</h2>
                            <p>{__('Choose which menu items to hide from the dashboard sidebar.', 'captain-social-feed')}</p>
                        </div>
                    </div>

                    <div className="capsf-wl-section-body">
                        <MultiSelect
                            options={HIDEABLE_ITEMS.map((item) => ({ key: item.key, label: item.label }))}
                            value={hideItems}
                            onChange={setHideItems}
                            placeholder={__('Select menu items to hide…', 'captain-social-feed')}
                            disabled={loading}
                        />
                        <p className="capsf-wl-hint">
                            {__('Hidden items can still be accessed directly. They are just hidden from the sidebar.', 'captain-social-feed')}
                        </p>

                        <div className="capsf-wl-divider" />

                        <label className={`capsf-wl-checkbox capsf-wl-checkbox--wide${hidePlugin ? ' capsf-wl-checkbox--checked' : ''}`}>
                            <input
                                type="checkbox"
                                checked={hidePlugin}
                                onChange={(e) => setHidePlugin(e.target.checked)}
                                disabled={loading}
                            />
                            <span>{__('Hide plugin from the Plugins list ( Plugins \u2192 Installed Plugins )', 'captain-social-feed')}</span>
                        </label>
                        <p className="capsf-wl-hint">
                            {__('Hides both the free and Pro versions of this plugin from the WordPress Plugins screen.', 'captain-social-feed')}
                        </p>
                    </div>
                </div>

                <div className="capsf-wl-actions">
                    <button type="submit" className="capsf-wl-save-btn" disabled={status === 'saving' || loading}>
                        {status === 'saving' ? __('Saving…', 'captain-social-feed') : __('Save Changes', 'captain-social-feed')}
                    </button>
                    <button
                        type="button"
                        className="capsf-wl-clear-btn"
                        onClick={handleClear}
                        disabled={status === 'clearing' || loading}
                    >
                        {status === 'clearing' ? __('Clearing…', 'captain-social-feed') : __('Clear', 'captain-social-feed')}
                    </button>
                    {message && (
                        <span className={`capsf-wl-status capsf-wl-status--${status}`}>{message}</span>
                    )}
                </div>
            </form>
        </div>
    );
};

export default WhiteLabel;
