# html-render-webpack-plugin

## 3.1.0

### Minor Changes

- 8d9aeed: Add `getEntrypointScriptUrls(webpackStats, entrypoint, compilation)` for turning client stats into script URLs.
  It supports single and multi-compilation stats, joins `publicPath` with or without a trailing slash, and throws for an unknown entrypoint or compilation.
- 8d9aeed: Make the Express peer dependency optional for build-only users.
  Express is loaded lazily by `createDevRouter`, and the package entry point no longer references Express types.
- 8d9aeed: Export the public `Options`, route and stats types from the package entry point.
  Include route fields in the `MapStatsToParams<Route>` parameter type.
  `GetRouteFromRequest` may now return `undefined`, and `TransformExpressPath` may return `undefined` to exclude a route.
- f2ef91d: Evaluate renderer bundles with Node's `vm.compileFunction` instead of the `eval` package.
  
  This changes some details of the rendering behaviour:
  
  - Values crossing into a bundle now satisfy `instanceof`. Bundles previously ran in a fresh `vm` context, so arrays, errors and promises created outside it failed checks like `value instanceof Array`.
  - `__dirname` and `__filename` are now defined, pointing at the evaluated asset and its directory in the compiler's output. Both were `undefined` before.
  - Dynamic `import()` now works. It previously threw `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, since a `vm` context has no import callback.
  
  Note: bundles are no longer isolated from the build process. Writes to globals, prototypes or undeclared variables used to die with each asset's `vm` context; they now persist for the build and are visible to other assets and the plugin. `extraGlobals` are module-scope bindings, so `globalThis.<name>` no longer resolves.

### Patch Changes

- 8d9aeed: Normalize dev-router paths with a leading slash, so routes written as `"about"` or `""` work in development as well as in the static build.
  The default `""` route is served at `/`.
  Returning `undefined`, or an empty string for any other route, still excludes it from the dev router.
  
  Normalization affects file and Express paths only; the renderer still receives the route string as configured.
- f2ef91d: Fix the development server error page to emit real client asset URLs with webpack 5 stats, collecting scripts from every entrypoint and skipping the renderer entry when a single compilation uses the renderer's own stats.
  Also stop requests from hanging when `getRouteFromRequest` returns no route or a route outside the configured set.
- 8d9aeed: Queue dev-router renders correctly when a request arrives before the build is ready.
  Queued renders now go through `mapStatsToParams` instead of calling the raw renderer.
- f2ef91d: Update runtime dependencies:
  
  - Replaced `chalk` with Node's built-in `util.styleText`
  - Upgrade `schema-utils` to v4
- 8d9aeed: Render single-compilation builds with the default `mapStatsToParams`.
  The renderer's own stats are used when there is no client compilation, instead of calling `MultiStats.toJson()` with an empty list.
- f2ef91d: Support webpack 5.112 by resolving `MultiStats` from both its current and previous module locations.
- f2ef91d: Declare `webpack` as a peer dependency (`^5.0.0`)
