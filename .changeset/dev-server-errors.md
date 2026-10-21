---
"html-render-webpack-plugin": patch
---

Fix the development server error page to emit real client asset URLs with webpack 5 stats, and stop requests from hanging when `getRouteFromRequest` returns no route or a route outside the configured set.
