---
"html-render-webpack-plugin": patch
---

Fix single-compilation rendering and development-server edge cases:

- Render single-compilation builds with the default `mapStatsToParams`. The renderer's own stats are used when there is no client compilation, instead of calling `MultiStats.toJson()` with an empty list.
- Queue dev-router renders correctly when a request arrives before the build is ready. Queued renders now go through `mapStatsToParams` instead of calling the raw renderer.
- Normalize dev-router paths with a leading slash, so routes written as `"about"` or `""` work in development as well as in the static build. The default `""` route is served at `/`. Returning `undefined`, or an empty string for any other route, still excludes it from the dev router. Normalization affects file and Express paths only; the renderer still receives the route string as configured.
- Collect dev-server error page scripts from every entrypoint rather than assuming `entrypoints.main`, and skip the render entry when a single compilation uses the renderer's own stats.
- Warn when the renderer compilation's `output.path` is at or inside `renderDirectory`, since the renderer bundle would be published with the static files.
- Remove Express types from the package entry point. `createDevRouter` returns a structural `DevRouter` type, so build-only TypeScript users do not need `@types/express`.
