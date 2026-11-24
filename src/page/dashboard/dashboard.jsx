import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom';
import { __ } from '@wordpress/i18n';
import DashboardContent from '../../services/dashboard/dashboardContent.jsx';

const Dashboard = () => {
    const navigate = useNavigate();
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchListing = useCallback(async () => {
        const formData = new FormData();
        formData.append('action', 'capsf_dashboard_ajax_call');
        formData.append('nonce', capsf_data.capsf_nonce);
        formData.append('type', 'get_feed_listing');

        try {
            const response = await fetch(capsf_data.ajax_url, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success && result.data) {
                setTableData(result.data);
            }
        } catch (error) {
            console.error('[capsf] listing fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (typeof capsf_data !== 'undefined') {
            fetchListing();
        } else {
            setLoading(false);
        }
    }, [fetchListing]);

    // Delete - optimistic remove
    const handleDeleteFromList = (feedId) => {
        setTableData(prev => prev.filter(item => Number(item.id) !== Number(feedId)));
    };

    // F5: Status toggle - optimistic update
    const handleStatusToggle = (feedId, newStatus) => {
        setTableData(prev => prev.map(item =>
            Number(item.id) === Number(feedId) ? { ...item, status: newStatus } : item
        ));
    };

    return (
        <DashboardContent
            listing_data={tableData}
            skeleton={loading}
            onDeleteSuccess={handleDeleteFromList}
            onStatusToggle={handleStatusToggle}
        />
    )
}

export default Dashboard;
