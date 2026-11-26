import React, { useState, useEffect } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import './settings.scss';

const CACHE_DURATION_OPTIONS = [
    { value: '1800',  label: __( 'Every 30 minutes', 'captain-social-feed' ) },
    { value: '3600',  label: __( 'Every 1 hour', 'captain-social-feed' ) },
    { value: '21600', label: __( 'Every 6 hours', 'captain-social-feed' ) },
    { value: '43200', label: __( 'Every 12 hours', 'captain-social-feed' ) },
    { value: '86400', label: __( 'Every 24 hours', 'captain-social-feed' ) },
];

const CACHE_STORAGE_OPTIONS = [
    { value: 'transient', label: __( 'WordPress transients (default)', 'captain-social-feed' ) },
    { value: 'table',     label: __( 'Plugin database table', 'captain-social-feed' ) },
];

const Settings = () => {
    // ── Cache clear ────────────────────────────────────────────────────
    const [cacheStatus,  setCacheStatus]  = useState('idle');
    const [cacheMessage, setCacheMessage] = useState('');

    // ── API cache duration ─────────────────────────────────────────────
    const [cacheDuration,        setCacheDuration]        = useState('3600');
    const [cacheDurationStatus,  setCacheDurationStatus]  = useState('idle');
    const [cacheDurationMessage, setCacheDurationMessage] = useState('');

    // ── Cache storage + fallback ───────────────────────────────────────
    const [cacheStorage,         setCacheStorage]         = useState('transient');
    const [cacheStorageStatus,   setCacheStorageStatus]   = useState('idle');
    const [cacheStorageMessage,  setCacheStorageMessage]  = useState('');
    const [fallbackEnabled,      setFallbackEnabled]      = useState(true);
    const [fallbackStatus,       setFallbackStatus]       = useState('idle');
    const [cacheStats,           setCacheStats]           = useState(null); // { item_count, size_formatted }

    // ── Preserve settings on remove ────────────────────────────────────
    const [preserveSettings,       setPreserveSettings]       = useState(false);
    const [preserveStatus,         setPreserveStatus]         = useState('idle');

    // ── Clear data on uninstall (new) ─────────────────────────────────
    const [clearOnUninstall,       setClearOnUninstall]       = useState(false);
    const [clearOnUninstallStatus, setClearOnUninstallStatus] = useState('idle');

    // ── Load saved settings on mount ───────────────────────────────────
    useEffect(() => {
        const formData = new FormData();
        formData.append('action', 'capsf_dashboard_ajax_call');
        formData.append('nonce',  capsf_data.capsf_nonce);
        formData.append('type',   'get_global_settings');

        fetch(capsf_data.ajax_url, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(result => {
                if (result.success && result.data) {
                    const d = result.data;
                    if (d.cache_duration)     setCacheDuration(d.cache_duration);
                    if (d.cache_storage)      setCacheStorage(d.cache_storage);
                    if (d.fallback_cache_enabled !== undefined) setFallbackEnabled(d.fallback_cache_enabled !== '0');
                    if (d.preserve_settings !== undefined) setPreserveSettings(!!d.preserve_settings);
                    if (d.clear_on_uninstall !== undefined) setClearOnUninstall(!!d.clear_on_uninstall);
                }
            })
            .catch(() => {});
        loadCacheStats();
    }, []);

    // ── Cache table size (fallback copies + table storage) ─────────────
    const loadCacheStats = () => {
        const formData = new FormData();
        formData.append('action', 'capsf_dashboard_ajax_call');
        formData.append('nonce',  capsf_data.capsf_nonce);
        formData.append('type',   'get_cache_stats');
        fetch(capsf_data.ajax_url, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(result => { if (result.success && result.data) setCacheStats(result.data); })
            .catch(() => {});
    };

    // ── Save a single global setting ───────────────────────────────────
    const saveSetting = async (key, value) => {
        const formData = new FormData();
        formData.append('action', 'capsf_dashboard_ajax_call');
        formData.append('nonce',  capsf_data.capsf_nonce);
        formData.append('type',   'set_global_setting');
        formData.append('key',    key);
        formData.append('value',  value);
        const response = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData });
        return response.json();
    };

    // ── Clear cache ────────────────────────────────────────────────────
    const handleClearCache = async () => {
        if (cacheStatus === 'loading') return;
        setCacheStatus('loading');
        setCacheMessage('');

        const formData = new FormData();
        formData.append('action', 'capsf_dashboard_ajax_call');
        formData.append('nonce',  capsf_data.capsf_nonce);
        formData.append('type',   'set_clear_cache');

        const response = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData });
        const result   = await response.json();

        if (result.success) {
            setCacheStatus('success');
            setCacheMessage(result.data?.message || __('Cache cleared successfully!', 'captain-social-feed'));
        } else {
            setCacheStatus('error');
            setCacheMessage(result.message || __('Something went wrong. Please try again.', 'captain-social-feed'));
        }

        loadCacheStats();
        setTimeout(() => { setCacheStatus('idle'); setCacheMessage(''); }, 4000);
    };

    // ── Save cache storage ─────────────────────────────────────────────
    // Switching storage clears the cache on the server, so feeds re-fetch once.
    const handleCacheStorageChange = async (val) => {
        const previous = cacheStorage;
        setCacheStorage(val);
        setCacheStorageStatus('saving');
        try {
            const result = await saveSetting('cache_storage', val);
            if (!result.success) setCacheStorage(previous);
            setCacheStorageStatus(result.success ? 'success' : 'error');
            setCacheStorageMessage(result.success
                ? __('Cache storage saved. Existing cache was cleared.', 'captain-social-feed')
                : __('Failed to save.', 'captain-social-feed'));
        } catch {
            setCacheStorage(previous);
            setCacheStorageStatus('error');
            setCacheStorageMessage(__('Failed to save.', 'captain-social-feed'));
        }
        loadCacheStats();
        setTimeout(() => { setCacheStorageStatus('idle'); setCacheStorageMessage(''); }, 3000);
    };

    // ── Toggle fallback cache ──────────────────────────────────────────
    const handleFallbackToggle = async () => {
        const newVal = !fallbackEnabled;
        setFallbackEnabled(newVal);
        setFallbackStatus('saving');
        await saveSetting('fallback_cache_enabled', newVal ? '1' : '0');
        setFallbackStatus('idle');
    };

    // ── Save cache duration ────────────────────────────────────────────
    const handleCacheDurationChange = async (val) => {
        setCacheDuration(val);
        setCacheDurationStatus('saving');
        try {
            const result = await saveSetting('cache_duration', val);
            setCacheDurationStatus(result.success ? 'success' : 'error');
            setCacheDurationMessage(result.success
                ? __('Cache duration saved!', 'captain-social-feed')
                : __('Failed to save.', 'captain-social-feed'));
        } catch {
            setCacheDurationStatus('error');
            setCacheDurationMessage(__('Failed to save.', 'captain-social-feed'));
        }
        setTimeout(() => { setCacheDurationStatus('idle'); setCacheDurationMessage(''); }, 3000);
    };

    // ── Toggle preserve settings ───────────────────────────────────────
    const handlePreserveToggle = async () => {
        const newVal = !preserveSettings;
        setPreserveSettings(newVal);
        setPreserveStatus('saving');
        await saveSetting('preserve_settings', newVal ? '1' : '0');
        setPreserveStatus('idle');
    };

    // ── Toggle clear on uninstall ──────────────────────────────────────
    const handleClearOnUninstallToggle = async () => {
        const newVal = !clearOnUninstall;
        setClearOnUninstall(newVal);
        setClearOnUninstallStatus('saving');
        await saveSetting('clear_on_uninstall', newVal ? '1' : '0');
        setClearOnUninstallStatus('idle');
    };

    return (
        <div className="capsf-settings-wrapper">

            {/* Page Header */}
            <div className="capsf-settings-header">
                <h1 className="capsf-settings-title">{__('Settings', 'captain-social-feed')}</h1>
                <p className="capsf-settings-subtitle">{__('Manage your plugin preferences and performance options.', 'captain-social-feed')}</p>
            </div>

            <div className="capsf-settings-sections">

                {/* ── Cache Section ────────────────────────────────── */}
                <div className="capsf-settings-section">
                    <div className="capsf-settings-section-header">
                        <div className="capsf-settings-section-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10" />
                                <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="capsf-settings-section-title">{__('Cache Management', 'captain-social-feed')}</h2>
                            <p className="capsf-settings-section-desc">{__('Control how long platform API responses are cached and clear existing cache.', 'captain-social-feed')}</p>
                        </div>
                    </div>

                    <div className="capsf-settings-section-body">

                        {/* API Cache Duration */}
                        <div className="capsf-settings-row capsf-settings-row--border">
                            <div className="capsf-settings-row-info">
                                <span className="capsf-settings-cache-label">{__('API Cache Duration', 'captain-social-feed')}</span>
                                <span className="capsf-settings-cache-hint">{__('How long platform API responses are cached before refreshing. Longer durations reduce API calls.', 'captain-social-feed')}</span>
                            </div>
                            <div className="capsf-settings-row-control">
                                <div className="capsf-settings-select-wrap">
                                    <select
                                        className="capsf-settings-select"
                                        value={cacheDuration}
                                        onChange={e => handleCacheDurationChange(e.target.value)}
                                        disabled={cacheDurationStatus === 'saving'}
                                    >
                                        {CACHE_DURATION_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {cacheDurationStatus === 'saving' && <span className="capsf-settings-inline-spinner" />}
                                    {cacheDurationStatus === 'success' && <span className="capsf-settings-inline-ok">✓</span>}
                                </div>
                                {cacheDurationMessage && (
                                    <span className={`capsf-settings-inline-msg capsf-settings-inline-msg--${cacheDurationStatus}`}>{cacheDurationMessage}</span>
                                )}
                            </div>
                        </div>

                        {/* Cache Storage */}
                        <div className="capsf-settings-row capsf-settings-row--border">
                            <div className="capsf-settings-row-info">
                                <label className="capsf-settings-cache-label" htmlFor="capsf-cache-storage">{__('Cache Storage', 'captain-social-feed')}</label>
                                <span className="capsf-settings-cache-hint">{__('Where cached posts are kept. Use the plugin table if another plugin or your host keeps wiping transients.', 'captain-social-feed')}</span>
                            </div>
                            <div className="capsf-settings-row-control">
                                <div className="capsf-settings-select-wrap">
                                    <select
                                        id="capsf-cache-storage"
                                        className="capsf-settings-select"
                                        value={cacheStorage}
                                        onChange={e => handleCacheStorageChange(e.target.value)}
                                        disabled={cacheStorageStatus === 'saving'}
                                    >
                                        {CACHE_STORAGE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    {cacheStorageStatus === 'saving' && <span className="capsf-settings-inline-spinner" />}
                                    {cacheStorageStatus === 'success' && <span className="capsf-settings-inline-ok" aria-hidden="true">✓</span>}
                                </div>
                                {cacheStorageMessage && (
                                    <span className={`capsf-settings-inline-msg capsf-settings-inline-msg--${cacheStorageStatus}`} role="status">{cacheStorageMessage}</span>
                                )}
                            </div>
                        </div>

                        {/* Fallback Cache */}
                        <div className="capsf-settings-toggle-row capsf-settings-row--border">
                            <div className="capsf-settings-toggle-info">
                                <span className="capsf-settings-cache-label" id="capsf-fallback-label">{__('Fallback Cache', 'captain-social-feed')}</span>
                                <span className="capsf-settings-cache-hint">
                                    {__('Keeps a copy of the last successful posts in the plugin table and shows it when a platform request fails (expired token, rate limit, outage), instead of an empty feed.', 'captain-social-feed')}
                                    {cacheStats && (
                                        <> {sprintf(
                                            /* translators: 1: number of cached entries, 2: size, e.g. "12 KB". */
                                            __('Table now holds %1$d entries (%2$s).', 'captain-social-feed'),
                                            cacheStats.item_count,
                                            cacheStats.size_formatted
                                        )}</>
                                    )}
                                </span>
                            </div>
                            <button
                                type="button"
                                className={`capsf-switcher ${fallbackEnabled ? 'capsf-switcher--on' : ''}`}
                                onClick={handleFallbackToggle}
                                aria-pressed={fallbackEnabled}
                                aria-labelledby="capsf-fallback-label"
                                disabled={fallbackStatus === 'saving'}
                            >
                                <span className="capsf-switcher-thumb" />
                            </button>
                        </div>

                        {/* Clear Cache Button */}
                        <div className="capsf-settings-cache-row">
                            <div className="capsf-settings-cache-info">
                                <span className="capsf-settings-cache-label">{__('Clear Plugin Cache', 'captain-social-feed')}</span>
                                <span className="capsf-settings-cache-hint">{__('Removes all cached API responses and WordPress transients. Feeds will re-fetch fresh data on next load.', 'captain-social-feed')}</span>
                            </div>

                            <button
                                className={`capsf-settings-cache-btn capsf-settings-cache-btn--${cacheStatus}`}
                                onClick={handleClearCache}
                                disabled={cacheStatus === 'loading'}
                            >
                                {cacheStatus === 'loading' && <span className="capsf-settings-btn-spinner" />}
                                {cacheStatus === 'success' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {cacheStatus === 'error' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {cacheStatus === 'idle' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span>
                                    {cacheStatus === 'loading' && __('Clearing...', 'captain-social-feed')}
                                    {cacheStatus === 'success' && __('Cleared!', 'captain-social-feed')}
                                    {cacheStatus === 'error'   && __('Failed', 'captain-social-feed')}
                                    {cacheStatus === 'idle'    && __('Clear Cache', 'captain-social-feed')}
                                </span>
                            </button>
                        </div>

                        {cacheMessage && (
                            <div className={`capsf-settings-feedback capsf-settings-feedback--${cacheStatus}`}>
                                <span>{cacheMessage}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Plugin Data Section ──────────────────────────── */}
                <div className="capsf-settings-section">
                    <div className="capsf-settings-section-header">
                        <div className="capsf-settings-section-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <ellipse cx="12" cy="5" rx="9" ry="3" />
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="capsf-settings-section-title">{__('Plugin Data', 'captain-social-feed')}</h2>
                            <p className="capsf-settings-section-desc">{__('Control what happens to your data when the plugin is deactivated or uninstalled.', 'captain-social-feed')}</p>
                        </div>
                    </div>

                    <div className="capsf-settings-section-body">

                        {/* Preserve settings toggle */}
                        <div className="capsf-settings-toggle-row capsf-settings-row--border">
                            <div className="capsf-settings-toggle-info">
                                <span className="capsf-settings-cache-label">{__('Preserve settings if plugin is removed', 'captain-social-feed')}</span>
                                <span className="capsf-settings-cache-hint">{__('This will make sure that all of your feeds and settings are still saved even if the plugin is uninstalled.', 'captain-social-feed')}</span>
                            </div>
                            <button
                                className={`capsf-switcher ${preserveSettings ? 'capsf-switcher--on' : ''}`}
                                onClick={handlePreserveToggle}
                                aria-pressed={preserveSettings}
                                disabled={preserveStatus === 'saving'}
                            >
                                <span className="capsf-switcher-thumb" />
                            </button>
                        </div>

                        {/* Clear data on uninstall toggle */}
                        <div className="capsf-settings-toggle-row">
                            <div className="capsf-settings-toggle-info">
                                <span className="capsf-settings-cache-label">{__('Clear all data on uninstall', 'captain-social-feed')}</span>
                                <span className="capsf-settings-cache-hint">
                                    {__('When enabled, all plugin database tables, feeds, settings, and transients will be permanently deleted when the plugin is uninstalled. ', 'captain-social-feed')}
                                    <strong className="capsf-settings-warning-text">{__('This action cannot be undone.', 'captain-social-feed')}</strong>
                                </span>
                                {clearOnUninstall && (
                                    <div className="capsf-settings-warning-badge">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                        {__('All data will be deleted on uninstall!', 'captain-social-feed')}
                                    </div>
                                )}
                            </div>
                            <button
                                className={`capsf-switcher ${clearOnUninstall ? 'capsf-switcher--on capsf-switcher--danger' : ''}`}
                                onClick={handleClearOnUninstallToggle}
                                aria-pressed={clearOnUninstall}
                                disabled={clearOnUninstallStatus === 'saving'}
                            >
                                <span className="capsf-switcher-thumb" />
                            </button>
                        </div>

                    </div>
                </div>

            </div>

        </div>
    );
};

export default Settings;
