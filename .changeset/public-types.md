---
"html-render-webpack-plugin": minor
---

Export the public `Options`, route and stats types from the package entry point. Include route fields in the `MapStatsToParams<Route>` parameter type. `GetRouteFromRequest` may now return `undefined`, and `TransformExpressPath` may return `undefined` to exclude a route.
