import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.tsx',
        './resources/js/**/*.ts',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Accent colour of the signed-in user's role, matching their sidebar.
                // Driven by --role-rgb, which DashboardLayout sets per role; the
                // :root default in app.css is the brand blue, so anything rendered
                // outside a role context (login, public landing) is unaffected.
                // Declared as a space-separated triplet so Tailwind's <alpha-value>
                // works — bg-role/10, ring-role/10 and shadow-role/20 all rely on it.
                role: 'rgb(var(--role-rgb) / <alpha-value>)',
                // Darker step of the same colour, used for hover states on filled
                // buttons. Without it those hovers stay the old brand blue and a
                // cyan button would turn navy on hover.
                'role-dark': 'rgb(var(--role-dark-rgb) / <alpha-value>)',
            },
        },
    },

    plugins: [forms],
};
