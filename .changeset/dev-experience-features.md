---
"html-render-webpack-plugin": minor
---

Several development experience improvements:

- Add `getEntrypointScriptUrls(webpackStats, entrypoint, compilation)` for turning client stats into script URLs. It supports single and multi-compilation stats, joins `publicPath` with or without a trailing slash, takes an optional compilation name, and throws for an unknown entrypoint or compilation. When several compilations share an entrypoint, it requires the compilation name instead of combining their scripts.
- Export the public `Options`, route and stats types from the package entry point. `GetRouteFromRequest` may now return `undefined`, and `TransformExpressPath` may return `undefined` to exclude a route.
- Include route fields in the `MapStatsToParams<Route>` parameter type.
- Make the Express peer dependency optional for build-only users. `createDevRouter` still needs Express, so install `express` when using the dev router.
- Replace the stale README examples with current single-compilation and multi-compilation setups, a working Express dev-server recipe and guidance on separating renderer output from deployable assets.
