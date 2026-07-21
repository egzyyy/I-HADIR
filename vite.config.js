import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [
        laravel({
            input: ["resources/js/app.tsx"],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js"),
        },
    },
    server: {
        // host 0.0.0.0 is needed for Vite to accept connections from outside
        // the container (e.g. via docker-compose's `vite` service) — harmless
        // for bare-metal `npm run dev` too, since it's still reachable via
        // localhost.
        host: "0.0.0.0",
        port: 5173,
        strictPort: true,
        // laravel-vite-plugin uses `origin` for two different things, and
        // that's the source of a nasty gotcha: it's both (a) the base URL
        // baked into the <script src> tags in the rendered page, AND, if
        // `cors` isn't set separately, (b) the *only* allowed CORS origin.
        // Without it, asset URLs fall back to the dev server's own bind
        // address (0.0.0.0 here) — unreachable from the browser. With it set
        // but `cors` left alone, the plugin defaults `cors.origin` to this
        // same value too, which blocks the page (served from :8000, a
        // different origin than Vite's :5173) from loading any of it. Both
        // need to be set, independently, to their correct — different —
        // values.
        origin: "http://localhost:5173",
        cors: {
            origin: ["http://localhost:8000"],
        },
        // watch: {
        //     usePolling: true,
        // },
    },
});
