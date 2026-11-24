import { __ } from '@wordpress/i18n';
import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom';
import Primary_button from '../../components/button/primary_button/primary_button.jsx';
import { useNavigate } from 'react-router-dom';
import './dashboardContent.scss';

/* ── Last Modified tooltip - rendered via portal so it's never clipped
 *    by the table's overflow:hidden (used for its rounded corners). ── */
const LastModifiedTooltip = ({ anchorEl, value }) => {
    const [pos, setPos] = useState(null)

    useEffect(() => {
        if (!anchorEl) return
        const rect = anchorEl.getBoundingClientRect()
        setPos({
            top:  rect.bottom + window.scrollY + 8,
            left: rect.left + window.scrollX + rect.width / 2,
        })
    }, [anchorEl])

    if (!pos) return null

    return createPortal(
        <div
            className='capsf-tooltip-bubble capsf-tooltip-bubble--portal'
            role='tooltip'
            style={{ top: pos.top, left: pos.left }}
        >
            <span className='capsf-tooltip-label'>{ __( 'Last Modified', 'captain-social-feed' ) }</span>
            <span className='capsf-tooltip-value'>{ value || '-' }</span>
        </div>,
        document.body
    )
}

/* ── Delete confirmation modal (U6) ───────────────────────────────────────── */
const DeleteModal = ({ feedName, onConfirm, onCancel }) => (
    <div className='capsf-modal-overlay' role='dialog' aria-modal='true' aria-label={__('Confirm Delete', 'captain-social-feed')}>
        <div className='capsf-modal'>
            <div className='capsf-modal-icon'>
                <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' width='32' height='32'>
                    <polyline points='3 6 5 6 21 6'/><path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6'/><path d='M10 11v6M14 11v6'/><path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2'/>
                </svg>
            </div>
            <h3 className='capsf-modal-title'>{__('Delete Feed?', 'captain-social-feed')}</h3>
            <p className='capsf-modal-body'>
                {__('Are you sure you want to delete', 'captain-social-feed')} <strong>{feedName}</strong>?
                {' '}{__('This action cannot be undone.', 'captain-social-feed')}
            </p>
            <div className='capsf-modal-actions'>
                <button className='capsf-modal-btn capsf-modal-btn--cancel' onClick={onCancel}>
                    {__('Cancel', 'captain-social-feed')}
                </button>
                <button className='capsf-modal-btn capsf-modal-btn--delete' onClick={onConfirm}>
                    {__('Yes, Delete', 'captain-social-feed')}
                </button>
            </div>
        </div>
    </div>
)

const DashboardContent = ({ listing_data, skeleton = false, onDeleteSuccess, onStatusToggle }) => {

    const navigate   = useNavigate();
    const [copiedId,    setCopiedId]    = useState(null);
    const [creating,    setCreating]    = useState(false);

    /* ── Create feed and jump straight to edit wizard ───────────────────── */
    const createAndEdit = async () => {
        if ( creating || typeof capsf_data === 'undefined' ) return
        setCreating(true)
        try {
            const fd = new FormData()
            fd.append('action', 'capsf_dashboard_ajax_call')
            fd.append('nonce',  capsf_data.capsf_nonce)
            fd.append('type',   'create_new_feed')
            const res    = await fetch(capsf_data.ajax_url, { method: 'POST', body: fd })
            const result = await res.json()
            if (result.success && result.data?.feed_id) {
                navigate(`/edit?id=${result.data.feed_id}`)
            }
        } catch(e) {
            console.error('[capsf] create error:', e)
        } finally {
            setCreating(false)
        }
    }

    // U6: Custom delete modal state
    const [deleteModal,  setDeleteModal]  = useState(null) // { feedId, feedName }
    // F5: Status toggle loading state
    const [togglingId,   setTogglingId]   = useState(null)

    /* ── Last Modified tooltip (click-to-toggle, closes on outside click) ── */
    const [openTooltipId, setOpenTooltipId] = useState(null)
    const [tooltipAnchorEl, setTooltipAnchorEl] = useState(null)
    const tooltipRef = useRef(null)

    // Hover / keyboard focus shows it; a click still toggles it (touch screens).
    const showTooltip = (id, el) => {
        setOpenTooltipId(id)
        setTooltipAnchorEl(el)
    }
    const hideTooltip = () => {
        setOpenTooltipId(null)
        setTooltipAnchorEl(null)
    }

    const toggleTooltip = (id, el) => {
        if (openTooltipId === id) {
            setOpenTooltipId(null)
            setTooltipAnchorEl(null)
        } else {
            setOpenTooltipId(id)
            setTooltipAnchorEl(el)
        }
    }

    useEffect(() => {
        if (openTooltipId === null) return
        const handleOutsideClick = (e) => {
            if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
                setOpenTooltipId(null)
                setTooltipAnchorEl(null)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('touchstart', handleOutsideClick)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('touchstart', handleOutsideClick)
        }
    }, [openTooltipId])

    /* ── Delete flow ────────────────────────────────────────────────────── */
    const confirmDelete = (feedId, feedName) => setDeleteModal({ feedId, feedName })
    const cancelDelete  = () => setDeleteModal(null)

    const executeDelete = async () => {
        const { feedId } = deleteModal
        setDeleteModal(null)

        const formData = new FormData()
        formData.append('action',  'capsf_dashboard_ajax_call')
        formData.append('nonce',   capsf_data.capsf_nonce)
        formData.append('type',    'delete_feed')
        formData.append('feed_id', feedId)

        try {
            const res    = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData })
            const result = await res.json()
            if (result.success) {
                if (typeof onDeleteSuccess === 'function') onDeleteSuccess(feedId)
            }
        } catch (e) {
            console.error('[capsf] delete error:', e)
        }
    }

    /* ── Status toggle (F5) ──────────────────────────────────────────────── */
    const handleStatusToggle = async (feedId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        setTogglingId(feedId)

        const fd = new FormData()
        fd.append('action',  'capsf_dashboard_ajax_call')
        fd.append('nonce',   capsf_data.capsf_nonce)
        fd.append('type',    'toggle_feed_status')
        fd.append('feed_id', feedId)
        fd.append('status',  newStatus)

        try {
            const res    = await fetch(capsf_data.ajax_url, { method: 'POST', body: fd })
            const result = await res.json()
            if (result.success && typeof onStatusToggle === 'function') {
                onStatusToggle(feedId, newStatus)
            }
        } catch (e) {
            console.error('[capsf] status toggle error:', e)
        } finally {
            setTogglingId(null)
        }
    }

    const getArray = (length) => Array.from({ length })

    /* ── Platform label + logo from DB row ── */
    const PLATFORM_META = {
        instagram: { label: __('Instagram', 'captain-social-feed'), icon: 'instagram.svg' },
        facebook:  { label: __('Facebook',  'captain-social-feed'), icon: 'facebook.svg' },
        twitter:   { label: __('Twitter / X', 'captain-social-feed'), icon: 'twitter.svg' },
        threads:   { label: __('Threads',   'captain-social-feed'), icon: 'threads.svg' },
        pinterest: { label: __('Pinterest', 'captain-social-feed'), icon: 'pinterest.svg' },
    }
    const getFeedTypeLabel = (item) => {
        const raw = ( item.feed_type || 'instagram' ).toLowerCase()
        return PLATFORM_META[raw]?.label || item.feed_type
    }
    const getFeedTypeIcon = (item) => {
        const raw = ( item.feed_type || 'instagram' ).toLowerCase()
        const icon = PLATFORM_META[raw]?.icon
        if ( !icon || typeof capsf_data === 'undefined' ) return null
        return capsf_data.plugin_url + 'assets/svg/social/' + icon
    }

    const TableHead = () => (
        <thead className='capsf-list-header'>
            <tr className='capsf-list-row'>
                <th className='capsf-list-row-item'>{__('FEED NAME',  'captain-social-feed')}</th>
                <th className='capsf-list-row-item'>{__('TYPE',       'captain-social-feed')}</th>
                <th className='capsf-list-row-item'>{__('SHORTCODE',  'captain-social-feed')}</th>
                <th className='capsf-list-row-item'>{__('STATUS',     'captain-social-feed')}</th>
                <th className='capsf-list-row-item'>{__('ACTIONS',    'captain-social-feed')}</th>
            </tr>
        </thead>
    )

    /* ── Skeleton rows (U5: no fake shortcode id) ──────────────────────── */
    if (skeleton) {
        return (
            <div className='capsf-listing-page'>
                <div className='capsf-listing-page-header'>
                    <h2 className='capsf-listing-page-title'>{__('Your Feeds', 'captain-social-feed')}</h2>
                </div>
                <div className='capsf-listing-content-wrapper capsf-skeleton-wrapper'>
                    <table className='capsf-listing-table'>
                        <TableHead />
                        <tbody>
                            {getArray(4).map((_, i) => (
                                <tr className='capsf-list-row capsf-skeleton-row' key={i} style={{ pointerEvents: 'none', opacity: 0.6 }}>
                                    <td className='capsf-list-row-item'>
                                        <span className='capsf-skeleton-bar' style={{ width: 120, display: 'inline-block', height: 14, background: '#e5e7eb', borderRadius: 4 }} />
                                    </td>
                                    <td className='capsf-list-row-item'>
                                        <span className='capsf-skeleton-bar' style={{ width: 60, display: 'inline-block', height: 14, background: '#e5e7eb', borderRadius: 4 }} />
                                    </td>
                                    <td className='capsf-list-row-item'>
                                        <span className='capsf-skeleton-bar' style={{ width: 200, display: 'inline-block', height: 14, background: '#e5e7eb', borderRadius: 4 }} />
                                    </td>
                                    <td className='capsf-list-row-item'>
                                        <span className='capsf-skeleton-bar' style={{ width: 60, display: 'inline-block', height: 22, background: '#e5e7eb', borderRadius: 12 }} />
                                    </td>
                                    <td className='capsf-list-row-item'>
                                        <span className='capsf-skeleton-bar' style={{ width: 80, display: 'inline-block', height: 28, background: '#e5e7eb', borderRadius: 6 }} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    if (listing_data.length === 0) {
        return (
            <div className='capsf-listing-page'>
                <div className='capsf-listing-page-header'>
                    <h2 className='capsf-listing-page-title'>{__('Your Feeds', 'captain-social-feed')}</h2>
                    <Primary_button text={__('+ Create Feed', 'captain-social-feed')} onClick={() => navigate('/create')} />
                </div>
                <div className='capsf-db-wrapper'>
                    <span className='capsf-db-icon'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M400 96c0-8.8-7.2-16-16-16L64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320zM384 32c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96C0 60.7 28.7 32 64 32l320 0zM320 256c0 6.7-2.8 13-7.7 17.6l-112 104c-7 6.5-17.2 8.2-25.9 4.4S160 369.5 160 360l0-208c0-9.5 5.7-18.2 14.4-22s18.9-2.1 25.9 4.4l112 104c4.9 4.5 7.7 10.9 7.7 17.6z" /></svg>
                    </span>
                    <span className='capsf-db-title'>{__('No feeds yet', 'captain-social-feed')}</span>
                    <span className='capsf-db-desc'>{__('Create your first social feed. Select a platform, fill in the details, and embed it anywhere on your site using a shortcode.', 'captain-social-feed')}</span>
                    <Primary_button text={__('Create Feed', 'captain-social-feed')} onClick={() => navigate('/create')} />
                </div>
            </div>
        )
    }

    return (
        <>
            {/* U6: Custom delete confirmation modal */}
            {deleteModal && (
                <DeleteModal
                    feedName={deleteModal.feedName}
                    onConfirm={executeDelete}
                    onCancel={cancelDelete}
                />
            )}

            <div className='capsf-listing-page'>
                <div className='capsf-listing-page-header'>
                    <h2 className='capsf-listing-page-title'>{__('Your Feeds', 'captain-social-feed')}</h2>
                    <Primary_button text={__('+ Create Feed', 'captain-social-feed')} onClick={() => navigate('/create')} />
                </div>
                <div className='capsf-listing-content-wrapper'>
                    <table className='capsf-listing-table'>
                        <TableHead />
                        <tbody>
                            {listing_data.map((item, index) => {
                                const isActive  = !item.status || item.status.toLowerCase() === 'active'
                                const isToggling = togglingId === item.id

                                return (
                                    <tr className='capsf-list-row' key={index}>
                                        <td className='capsf-list-row-item'>
                                            <span
                                                className='capsf-feed-name-link'
                                                onClick={() => navigate(`/edit?id=${item.id}`)}
                                                title={__('Edit Feed', 'captain-social-feed')}
                                            >
                                                {item.feed_name}
                                            </span>
                                        </td>
                                        <td className='capsf-list-row-item'>
                                            <span className={ `capsf-type-badge capsf-type-badge--${ ( item.feed_type || 'instagram' ).toLowerCase() }` }>
                                                {/* Logo painted with the badge colour (CSS mask), so icon and text always match. */}
                                                { getFeedTypeIcon(item) && <span className='capsf-type-badge-icon' aria-hidden='true' style={ { '--capsf-type-icon': `url(${ getFeedTypeIcon(item) })` } } /> }
                                                {getFeedTypeLabel(item)}
                                            </span>
                                        </td>
                                        <td className='capsf-list-row-item'>
                                            <div className='capsf-shortcode-cell'>
                                                <code className='capsf-shortcode-readable'>
                                                    {`[captain-social-feed id="${item.id}"]`}
                                                </code>
                                                <button
                                                    className='capsf-copy-btn'
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`[captain-social-feed id="${item.id}"]`)
                                                        setCopiedId(item.id)
                                                        setTimeout(() => setCopiedId(null), 2000)
                                                    }}
                                                    title={__('Copy shortcode', 'captain-social-feed')}
                                                >
                                                    {copiedId === item.id
                                                        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                                                        : <svg viewBox="0 0 24 24" width="15" height="15"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                        <td className='capsf-list-row-item'>
                                            {/* F5: Status toggle button */}
                                            <button
                                                className={`capsf-status-toggle ${isActive ? 'capsf-status-toggle--active' : 'capsf-status-toggle--inactive'} ${isToggling ? 'capsf-status-toggle--loading' : ''}`}
                                                onClick={() => handleStatusToggle(item.id, isActive ? 'active' : 'inactive')}
                                                disabled={isToggling}
                                                title={isActive ? __('Click to deactivate', 'captain-social-feed') : __('Click to activate', 'captain-social-feed')}
                                            >
                                                <span className='capsf-status-dot' />
                                                {isActive ? __('Active', 'captain-social-feed') : __('Inactive', 'captain-social-feed')}
                                            </button>
                                        </td>
                                        <td className='capsf-list-row-item'>
                                            <div className='capsf-action-btns'>
                                                <button
                                                    className='capsf-action-btn'
                                                    onClick={() => navigate(`/edit?id=${item.id}`)}
                                                    title={__('Edit', 'captain-social-feed')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z" /></svg>
                                                </button>
                                                <div
                                                    className='capsf-tooltip-wrap'
                                                    ref={ openTooltipId === item.id ? tooltipRef : null }
                                                    onMouseEnter={ (e) => showTooltip( item.id, e.currentTarget.querySelector( 'button' ) ) }
                                                    onMouseLeave={ hideTooltip }
                                                >
                                                    <button
                                                        type='button'
                                                        className='capsf-action-btn capsf-action-btn-info'
                                                        onClick={ (e) => toggleTooltip( item.id, e.currentTarget ) }
                                                        onFocus={ (e) => showTooltip( item.id, e.currentTarget ) }
                                                        onBlur={ hideTooltip }
                                                        aria-label={ __( 'Last Modified', 'captain-social-feed' ) }
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                                    </button>
                                                    { openTooltipId === item.id && (
                                                        <LastModifiedTooltip anchorEl={ tooltipAnchorEl } value={ item.last_modified } />
                                                    ) }
                                                </div>
                                                {/* U6: Custom modal instead of window.confirm */}
                                                <button
                                                    className='capsf-action-btn capsf-action-btn-delete'
                                                    onClick={() => confirmDelete(item.id, item.feed_name)}
                                                    title={__('Delete', 'captain-social-feed')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default DashboardContent;
