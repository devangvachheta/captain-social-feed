import React from 'react';
import Dashboard    from '../page/dashboard/dashboard.jsx';
import Create_page  from '../page/create_page/create_page.jsx';
import EditFeed     from '../page/edit_feed/edit_feed.jsx';
import Help         from '../page/help/help.jsx';
import Settings     from '../page/settings/settings.jsx';
import Docs         from '../page/docs/docs.jsx';
import OurProducts  from '../page/our-products/our-products.jsx';
import Rollback     from '../page/rollback/rollback.jsx';
import WhiteLabel   from '../page/white_label/white_label.jsx';
import Upgrade       from '../page/upgrade/upgrade.jsx';
import AiTools      from '../page/ai_tools/ai_tools.jsx';

const routes = [
    { path: '/',              element: <Dashboard /> },
    { path: '/create',        element: <Create_page /> },
    { path: '/edit',          element: <EditFeed /> },
    { path: '/help',          element: <Help /> },
    { path: '/settings',      element: <Settings /> },
    { path: '/docs/*',        element: <Docs /> },
    { path: '/our-products',  element: <OurProducts /> },
    { path: '/rollback',      element: <Rollback /> },
    { path: '/white-label',   element: <WhiteLabel /> },
    { path: '/upgrade',       element: <Upgrade /> },
    { path: '/mcp',           element: <AiTools /> },
];

export default routes;
