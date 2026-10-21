---
"html-render-webpack-plugin": minor
---

Several development experience improvements:

- Add `getEntrypointScriptUrls(webpackStats, entrypoint)` for turning client stats into script URLs.
- Export the public `Options`, route and stats types from the package entry point.
- Include route fields in the `MapStatsToParams<Route>` parameter type.
- Make the Express peer dependency optional for build-only users. `createDevRouter` still needs Express, so install `express` when using the dev router.
- Print a summary after rendering, including the route count, output directory and duration.
- Replace the stale README examples with current single-compilation and multi-compilation setups, a working Express dev-server recipe and guidance on separating renderer output from deployable assets.
