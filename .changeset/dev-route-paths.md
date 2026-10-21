---
"html-render-webpack-plugin": patch
---

Normalize dev-router paths with a leading slash, so routes written as `"about"` or `""` work in development as well as in the static build. The default `""` route is served at `/`. Returning `undefined`, or an empty string for any other route, still excludes it from the dev router. Normalization affects file and Express paths only; the renderer still receives the route string as configured.
