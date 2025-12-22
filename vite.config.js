import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    server: {
        https: false,
        host: '127.0.0.1',
        port: 5173
    },
    plugins: [
        laravel({
        input: 'resources/js/app.jsx',
        refresh: true,
        }),
        react(),
    ],

    build: {
        // Generate smaller, more cacheable JS chunks
        rollupOptions: {
        output: {
            manualChunks: {
            // Split vendor code (React, Lucide, etc.)
            'react-vendor': ['react', 'react-dom'],
            'lucide-icons': ['lucide-react'],
            },
        },
        treeshake: true, // remove unused code
        },

        // Minify aggressively using esbuild
        minify: 'esbuild',

        // Avoid generating unnecessary large source maps in production
        sourcemap: false,

        // Don’t warn unless a chunk exceeds 600KB
        chunkSizeWarningLimit: 600,
    },

    // Optional — but useful for production performance
    esbuild: {
        drop: ['console', 'debugger'], // removes console.log/debugger in prod
    },
});
