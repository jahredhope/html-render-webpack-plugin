---
"html-render-webpack-plugin": minor
---

Improve the setup and development experience:

- Render single-compilation builds with the default `mapStatsToParams`. The renderer's own stats are used when there is no client compilation, instead of calling `MultiStats.toJson()` with an empty list.
- Queue dev-router renders correctly when a request arrives before the build is ready. Queued renders now go through `mapStatsToParams` instead of calling the raw renderer.
- Normalize dev-router paths with a leading slash, so routes written as `"about"` or `""` work in development as well as in the static build.
- Add `getEntrypointScriptUrls(webpackStats, entrypoint)` for turning client stats into script URLs.
- Export the public `Options`, route and stats types from the package entry point.
- Make the Express peer dependency optional for build-only users. `createDevRouter` still needs Express, so install `express` when using the dev router.
- Print a summary after rendering, including the route count, output directory and duration.
- Replace the stale README examples with current single-compilation and multi-compilation setups, a working Express dev-server recipe and guidance on separating renderer output from deployable assets.
