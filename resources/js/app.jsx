import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

import { Toaster } from 'react-hot-toast';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'ComicVault';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <Toaster position="bottom-right" toastOptions={{
                    style: {
                        background: '#16161f',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }} />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#e8003d',
    },
});
