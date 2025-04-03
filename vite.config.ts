import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
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
});