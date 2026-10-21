---
"html-render-webpack-plugin": minor
---

Several development experience improvements:

- Add `getEntrypointScriptUrls(webpackStats, entrypoint)` for turning client stats into script URLs. It supports single and multi-compilation stats, joins `publicPath` with or without a trailing slash, and throws for an unknown entrypoint.
- Export the public `Options`, route and stats types from the package entry point. `GetRouteFromRequest` may now return `undefined`, and `TransformExpressPath` may return `undefined` to exclude a route.
- Include route fields in the `MapStatsToParams<Route>` parameter type.
- Make the Express peer dependency optional for build-only users. `createDevRouter` still needs Express, so install `express` when using the dev router. The published declarations ship with the Express types, so no separate `@types/express` install is required.
- Replace the stale README examples with current single-compilation and multi-compilation setups, a working Express dev-server recipe and guidance on separating renderer output from deployable assets.
