# html-render-webpack-plugin

[![npm](https://img.shields.io/npm/v/html-render-webpack-plugin.svg)](https://www.npmjs.com/package/html-render-webpack-plugin)

Render HTML files with JavaScript during a webpack build.

- Supports [multiple configurations](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations)
- Supports [code-splitting](https://webpack.js.org/guides/code-splitting/) and [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)
- Renders every route to a static file, or on demand through an Express dev router
- Passes client build stats into the renderer so hashed asset names are correct

## Requirements

- Node >= 22.13
- webpack ^5.0.0
- Express >= 4, only if you use `createDevRouter`

## Install

```bash
pnpm add webpack html-render-webpack-plugin
# Only needed for the development server:
pnpm add express
```

Express is an optional peer dependency. Build-only usage does not require it.

## Quick start

A single webpack compilation can render HTML when it targets Node and exports a
function. This is the smallest useful setup.

**src/render.js**

```js
export default function render({ route }) {
  return `<!doctype html>
<html lang="en">
  <body>
    <h1>Rendered ${route}</h1>
  </body>
</html>`;
}
```

**webpack.config.js**

```js
import path from "node:path";

import { HtmlRenderPlugin } from "html-render-webpack-plugin";

const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: ["/"],
  renderDirectory: path.resolve("dist"),
});

export default {
  name: "render",
  target: "node",
  mode: "production",
  entry: path.resolve("src/render.js"),
  output: {
    // Keep the Node renderer out of the folder you deploy.
    path: path.resolve(".render"),
    filename: "render.js",
    // The plugin evaluates the default export, so expose it as a UMD2 module.
    library: { type: "umd2", export: "default" },
  },
  plugins: [htmlRenderPlugin.rendererPlugin],
};
```

The build writes `dist/index.html`. The renderer bundle is written to
`.render/` and is not part of the static site.

CommonJS configs can use:

```js
const { HtmlRenderPlugin } = require("html-render-webpack-plugin");
```

## Multiple configurations

Use two compilations when the renderer needs information from a browser build,
such as a hashed script filename.

Add `htmlRenderPlugin.statsCollectorPlugin` to every compilation whose stats the
renderer needs. Add `htmlRenderPlugin.rendererPlugin` to the compilation that
renders HTML.

**webpack.config.js**

```js
import path from "node:path";

import {
  HtmlRenderPlugin,
  getEntrypointScriptUrls,
} from "html-render-webpack-plugin";

const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: ["/", "/about"],
  renderDirectory: path.resolve("dist"),
  // Keep the renderer boundary small: pass URLs, not the whole stats object.
  mapStatsToParams: ({ webpackStats }) => ({
    scripts: getEntrypointScriptUrls(webpackStats),
  }),
});

export default [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: path.resolve("src/client.js"),
    output: {
      path: path.resolve("dist"),
      filename: "assets/[name].[contenthash].js",
      chunkFilename: "assets/[name].[contenthash].js",
      publicPath: "/",
    },
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
  {
    name: "render",
    target: "node",
    mode: "production",
    // Optional: the plugin already waits for every compilation. Declaring the
    // dependency makes the intended build order explicit.
    dependencies: ["client"],
    entry: path.resolve("src/render.js"),
    output: {
      path: path.resolve(".render"),
      filename: "[name].js",
      library: { type: "umd2", export: "default" },
    },
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
```

**src/render.js**

```js
export default function render({ route, scripts }) {
  return `<!doctype html>
<html lang="en">
  <body>
    <div id="app">Rendered ${route}</div>
    ${scripts
      .map((src) => `<script src="${src}" defer></script>`)
      .join("\n    ")}
  </body>
</html>`;
}
```

`getEntrypointScriptUrls(webpackStats, entrypoint = "main")` returns public URLs
for the JavaScript assets of an entrypoint. It handles hashed filenames,
`publicPath` values with or without a trailing slash, string assets and asset
objects. It accepts the stats of a single client compilation and the multi
compilation stats produced when several compilations use
`statsCollectorPlugin`. An unknown entrypoint name throws instead of returning an
empty list.

If you need more control, `mapStatsToParams` receives the route and the client
stats, and whatever it returns is merged into the renderer's parameters.

## Routes

`routes` accepts strings or objects. A `route` may start with or without a
leading slash. Paths are appended with `index.html` unless they already end in
`.html`.

```js
const routes = [
  "/", // dist/index.html
  "/about", // dist/about/index.html
  "contact", // dist/contact/index.html
  { route: "/blog/hello", title: "Hello", category: "news" },
];
```

Extra keys on a route object are passed to the renderer, which makes routes a
convenient place for page metadata:

```js
new HtmlRenderPlugin({
  routes: [
    { route: "/", title: "Home", description: "Welcome" },
    { route: "/about", title: "About", description: "How it works" },
  ],
  // mapStatsToParams also receives the route:
  mapStatsToParams: ({ title, webpackStats }) => ({
    title,
    scripts: getEntrypointScriptUrls(webpackStats),
  }),
});
```

The renderer receives `{ route, title, scripts, webpackStats, ... }` depending on
what `mapStatsToParams` returns.

## Options

### `routes`

**Default:** `[""]`

Routes to render. A file is created for each route. `""` and `"/"` both render
to `index.html`.

### `renderEntry`

**Default:** `"main"`

The webpack entry in the renderer compilation. Set this when the renderer uses
[object entry syntax](https://webpack.js.org/concepts/entry-points/#object-syntax).

```js
new HtmlRenderPlugin({ renderEntry: "myRender" });
```

### `renderDirectory`

**Default:** `"dist"`

The directory to write HTML files to, resolved from the current working
directory. This can differ from the renderer compilation's `output.path`; that
is the recommended setup, so the Node renderer bundle is not deployed with the
static site.

### `mapStatsToParams`

**Default:** `({ webpackStats }) => ({ webpackStats: webpackStats.toJson() })`

Builds the values passed to the render function for each route. The function
receives the route fields plus `webpackStats`, and its return value is merged
into the render parameters.

Prefer passing only what the renderer needs:

```js
mapStatsToParams: ({ webpackStats }) => ({
  scripts: getEntrypointScriptUrls(webpackStats),
});
```

In a single-compilation setup the renderer's own stats are used. If you do not
need stats at all, return an empty object:

```js
mapStatsToParams: () => ({});
```

### `transformFilePath`

**Default:** `(route) => route.route`

Changes the output path for a route.

```js
new HtmlRenderPlugin({
  routes: [
    { route: "/about", language: "en-us" },
    { route: "/about", language: "en-au" },
  ],
  transformFilePath: ({ route, language }) => `${language}${route}`,
});
```

This writes `en-us/about/index.html` and `en-au/about/index.html`.

### `renderConcurrency`

**Default:** `"serial"`

Use `"parallel"` when renders do a lot of asynchronous work.

```js
new HtmlRenderPlugin({ renderConcurrency: "parallel" });
```

### `skipAssets`

**Default:** `false`

When `true`, routes are not rendered to files after the build. Use this in watch
mode with `createDevRouter` or `renderWhenReady`, where pages are rendered on
demand.

### `transformExpressPath`

**Default:** `(route) => route.route`

Changes the path used by the dev router. Routes are normalized to a leading
slash, so `"about"` and `"/about"` both work. The default `""` route is served
at `/`. Return `undefined` to exclude a route from the dev router; an empty
string excludes every route except the default one.

```js
new HtmlRenderPlugin({
  transformExpressPath: (route) =>
    route.route === "/draft" ? undefined : `/static${route.route}`,
});
```

### `getRouteFromRequest`

Used by the dev router to choose a route for a request. It must return one of the
configured routes, or `undefined` to pass the request to the next middleware.

```js
new HtmlRenderPlugin({
  routes: [
    { route: "/books/1", id: "1" },
    { route: "/books/2", id: "2" },
  ],
  getRouteFromRequest: (req, routes) =>
    routes.find((route) => route.id === req.params.id),
});
```

### `extraGlobals`

Extra values to expose as free variables in the evaluated renderer bundle. Names
must be valid JavaScript identifiers and cannot be `exports`, `require`,
`module`, `__filename` or `__dirname`.

## Development server

The dev router renders configured routes on demand with the same renderer bundle
used by the production build. Use it with Express and
[`webpack-dev-middleware`](https://github.com/webpack/webpack-dev-middleware) so
client assets are served from memory.

Set `skipAssets: true` on the plugin when using the dev router. Share the same
plugin instance between the webpack configuration and the server.

**webpack.config.js**

```js
export const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: ["/", "/about"],
  skipAssets: true,
});
```

**dev-server.js**

```js
import express from "express";
import webpack from "webpack";
import devMiddleware from "webpack-dev-middleware";

import config, { htmlRenderPlugin } from "./webpack.config.js";

const compiler = webpack(config);
const app = express();

// Mount the renderer first, then serve client assets from webpack.
app.use(htmlRenderPlugin.createDevRouter());
app.use(devMiddleware(compiler, { publicPath: "/" }));

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
```

If you use webpack-dev-server v5 instead, mount the router in
`setupMiddlewares`:

```js
devServer: {
  setupMiddlewares(middlewares, devServer) {
    devServer.app.use(htmlRenderPlugin.createDevRouter());
    return middlewares;
  },
}
```

The dev router does not add hot module replacement. It rerenders a route when it
is requested after a rebuild.

## Just-in-time rendering

`renderWhenReady` renders any route using the same renderer. It waits until the
build is ready, so it is safe to call during startup.

```js
app.get("/books/:id", (req, res) => {
  res.send(await htmlRenderPlugin.renderWhenReady({ route: "/books/_id" }));
});
```

Only use routes that also exist in the production build. Errors contain a
`webpackStats` property when stats are available.

## Output layout

A typical multi-compilation project looks like this:

```text
dist/                     # deploy this
  index.html
  about/index.html
  assets/main.<hash>.js
  assets/<chunk>.<hash>.js
.render/                  # renderer bundle, do not deploy
  render.js
```

Keep the renderer output outside `renderDirectory`. Avoid `output.clean` across
compilations that share an output directory; clean the directories yourself
before the build instead.

## TypeScript

The package ships declarations and exports the public option and route types.
The declarations reference Express's `Request` and `Router` types, so a
TypeScript project with `skipLibCheck: false` needs `@types/express` available.
Install it (`pnpm add -D @types/express`) if your project does not already
include it.

```ts
import {
  HtmlRenderPlugin,
  getEntrypointScriptUrls,
  type BaseRoute,
  type MapStatsToParams,
  type Options,
} from "html-render-webpack-plugin";

interface Route extends BaseRoute {
  title: string;
}

const mapStatsToParams: MapStatsToParams<Route> = ({
  route,
  title,
  webpackStats,
}) => ({
  route,
  title,
  scripts: getEntrypointScriptUrls(webpackStats),
});

const options: Options<Route> = {
  routes: [{ route: "/", title: "Home" }],
  mapStatsToParams,
};

const plugin = new HtmlRenderPlugin<Route>(options);
```

## Examples

The fixtures under [`tests/test-cases`](./tests/test-cases) are complete,
buildable examples, including single and multi-compilation setups, a dev server,
route metadata and asynchronous rendering.

## Migration

Upgrading from v1? See the
[v1 to v2 migration guide](./MIGRATION_GUIDE_v1_to_v2.md).
