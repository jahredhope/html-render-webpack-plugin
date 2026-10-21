---
"html-render-webpack-plugin": patch
---

Fix the development server error page to emit real client asset URLs with webpack 5 stats, collecting scripts from every entrypoint and skipping the renderer entry when a single compilation uses the renderer's own stats.
Also stop requests from hanging when `getRouteFromRequest` returns no route or a route outside the configured set.
