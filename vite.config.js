import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const devHost = env.VITE_DEV_HOST || 'localhost';
    // 5175 — keep 5173 free for other projects (e.g. marketmind)
    const devPort = Number(env.VITE_PORT || 5175);
    const devOrigin = `http://${devHost}:${devPort}`;

    // Origins that may load Vite assets (Laravel app over LAN IP, .local domain, etc.)
    const allowedOrigins = [
        devOrigin,
        env.APP_URL,
        `http://${devHost}:8001`,
        `http://${devHost}:8000`,
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
    ].filter(Boolean);

    return {
        plugins: [
            laravel({
                input: ['resources/js/app.jsx', 'resources/js/guest.js'],
                refresh: true,
            }),
            react(),
        ],
        resolve: {
            alias: {
                '@': '/resources/js',
            },
        },
        server: {
            host: '0.0.0.0',
            port: devPort,
            strictPort: true,
            // Script URLs in @vite must use the LAN IP, not 127.0.0.1 (written to public/hot)
            origin: devOrigin,
            hmr: {
                host: devHost,
                port: devPort,
                clientPort: devPort,
            },
            cors: {
                origin: allowedOrigins,
            },
        },
    };
});
