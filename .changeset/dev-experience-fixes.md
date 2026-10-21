---
"html-render-webpack-plugin": patch
---

Fix single-compilation rendering and development-server edge cases:

- Render single-compilation builds with the default `mapStatsToParams`. The renderer's own stats are used when there is no client compilation, instead of calling `MultiStats.toJson()` with an empty list.
- Queue dev-router renders correctly when a request arrives before the build is ready. Queued renders now go through `mapStatsToParams` instead of calling the raw renderer.
- Normalize dev-router paths with a leading slash, so routes written as `"about"` or `""` work in development as well as in the static build. Falsy transform results still exclude a route.
- Collect dev-server error page scripts from every entrypoint rather than assuming `entrypoints.main`.
