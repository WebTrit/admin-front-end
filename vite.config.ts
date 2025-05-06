import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {createHtmlPlugin} from 'vite-plugin-html';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            react(),
            createHtmlPlugin({
                inject: {
                    data: {
                        title: env.VITE_APP_TITLE,
                        description: env.VITE_APP_DESCRIPTION,
                        keywords: env.VITE_APP_KEYWORDS,
                        favicon: env.VITE_FAVICON_URL || '/favicon.png',
                        shareImage: env.VITE_SHARE_IMAGE_URL,
                    },
                },
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        base: "/",
        build: {
            outDir: "dist",
        },
        server: {
            port: 3000,
            host: "0.0.0.0",
        },
        preview: {
            port: 8080,
            host: "0.0.0.0",
        },
    };
});
