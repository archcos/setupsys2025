import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            keyframes: {
                'loading-bar': {
                '0%': { width: '0%' },
                '50%': { width: '70%' },
                '100%': { width: '100%' },
                },
            },
            animation: {
                'loading-bar': 'loading-bar 2s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
