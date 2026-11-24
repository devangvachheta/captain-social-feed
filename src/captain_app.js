import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import routes from './router/routes.js';
import Navigation from './page/navigation/navigation.jsx';
import { AttentionPingProvider } from './context/AttentionPingContext.jsx';

const AppContent = () => {
    const location  = useLocation();
    const theme     = useSelector( state => state.theme );
    const sidebarCollapsed = useSelector( state => state.sidebarCollapsed );

    // Apply data-capsf-theme on the root wrapper - CSS vars cascade from here
    useEffect( () => {
        const el = document.getElementById('captain-social-feed-app');
        if ( el ) {
            el.setAttribute('data-capsf-theme', theme);
        }
    }, [theme] );

    return (
        <div className='captain-app capsf-app' data-capsf-theme={ theme } data-capsf-sidebar={ sidebarCollapsed ? 'collapsed' : 'expanded' }>
            <Navigation />
            <div className={ `capsf-app-main-content${ sidebarCollapsed ? ' capsf-app-main-content--collapsed' : '' }` }>
                <Routes>
                    {routes.map((route, index) => (
                        <Route key={index} path={route.path} element={route.element} />
                    ))}
                </Routes>
            </div>
        </div>
    );
};

const Captain_app = () => {
    return (
        <HashRouter>
            {/* One shared "look here first" tooltip for the whole app (e.g. the MCP
                page points back at its master switch). */}
            <AttentionPingProvider>
                <AppContent />
            </AttentionPingProvider>
        </HashRouter>
    );
}

export default Captain_app;
