# html-render-webpack-plugin

Plugin to create HTML files with JavaScript.

- Supports [multiple configurations](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations)
- Supports [code-splitting](https://webpack.js.org/guides/code-splitting/) and [dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports)

# Setup

```bash
$ npm install webpack html-render-webpack-plugin
# OR
$ yarn add webpack html-render-webpack-plugin
```

**webpack.config.js**

```js
module.exports = {
  ...,
  plugins: [new HtmlRenderPlugin().rendererPlugin]
};
```

# Multiple configurations

If you use [multiple webpack configurations](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations) you may want to add information from other builds when rendering.

For example, you may wish to add a script tag where the name includes a hash. The asset name comes from the output of one build (browser assets) whilst the render is performed in another build (node rendering).

**src/render.js**

```js
export default ({ assetsByChunkName }) => {
  return `<html>
<body>
  <script src="${assetsByChunkName.main}"></script>
</body>
</html>`;
};
```

**dist/index.html**

```html
<html>
  <body>
    <script src="/main-daf2166db871ad045ea4.js"></script>
  </body>
</html>
```

See [the full example below](#example-client-assets).

## Multiple configuration setup

Add `htmlRenderPlugin.statsCollectorPlugin` to the plugins of all configurations you want to get stats for.

Add `htmlRenderPlugin.rendererPlugin` to the plugin of the configuration you want to use to render html.

HtmlRenderPlugin will then pass the [Webpack Stats](https://webpack.js.org/api/stats/) for those builds into your render function.

**webpack.config.js**

```js
const HtmlRenderPlugin = require("html-render-webpack-plugin");

const htmlRenderPlugin = new HtmlRenderPlugin();
module.exports = [
  {
    name: "render",
    target: "node", // Creates assets that render HTML that runs well in node
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
  {
    name: "client",
    target: "web", // Creates files that run on the browser
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
];
```

See [examples](#examples) for more details.

# Options

## Option: renderEntry _string_

**default:** "main"

The [webpack entry](https://webpack.js.org/concepts/entry-points/) to use when rendering. Override when using [object syntax](https://webpack.js.org/concepts/entry-points/#object-syntax).

**webpack.config.js**

```js
module.exports = {
  entry: {
    myRender: "./src/myRender.js",
  },
  plugins: [
    new HtmlRenderPlugin({
      renderEntry: "myRender",
    }).render,
  ],
};
```

## Option: renderDirectory _string_

The location to create rendered files. Defaults to the rendered assets output.

Useful when deploying HTML files seperate to other build assets.

## Option: routes _Array<object|string>_

**default:** `[""]`

Renders a HTML page for each value in the array.
A route can be a string showing the folder or file to render, or an object containing a route parameter. `index.html` is automatically appended for paths.

```js
const routes = ["", "contact", "about"];
```

A route can be an object, containing a `route` parameter.

```js
const routes = [
  {
    route: "en-us/contact",
    language: "en-us",
  },
  {
    route: "en-us/about",
    language: "en-us",
  },
  {
    route: "en-au/contact",
    language: "en-au",
  },
  {
    route: "/en-au/about",
    language: "en-au",
  },
];
```

## Option: mapStatsToParams _Function_

**default:** `({webpackStats, ...route}) => ({ webpackStats })`

mapStatsToParams should accept webpackStats and [route](#option-routes-arrayobjectstring) information and returns values to be passed into render.
The function is called individually for each render.

**Recommendation:** mapStatsToParams is an opportunity to limit what information is provided to your render function. Keeping the boundary between your build code and application code simple. Avoid passing all webpackStats into your render function, pull out only the information needed. It is recommended to override the default mapStatsToParams behaviour.

## Option: transformFilePath _Function_

**default:** `(route) => route.route ? route.route : route`

By default a file will be created using the `route` value.
For example the value `{route: '/about/us'}` would create **about/us/index.html**

If you want to use a different file path you can provide a `transformFilePath` function.

```js
new HtmlRenderPlugin({
  ...
  transformFilePath: ({ route, language }) => `${language}/${route}`
  routes: [
    { route: '/about/us', language: 'en-us' },
    { route: '/about/us', language: 'en-au' }
  ]
});
```

In this example, the resulting files will be

- **en-us/about/us/index.html**

- **en-au/about/us/index.html**

## Option: renderConcurrency _string ("serial"|"parallel")_

**default:** `"serial"`

By default each file will be rendered one after the other, creating a simple sequential build log. When renders with significant asynchronous work you may want to have each render run in parallel.

```
new HtmlRenderPlugin({
  renderConcurrency: 'parallel'
});
```

## Option: skipAssets _Function_

**default:** `false`

After waiting for all builds to complete HtmlRenderPlugin will render all routes. For particularly large projects with a large number of routes this can take some time. For watch builds you may want to skip emitting assets, relying on `createDevRouter` instead.

## Option: transformExpressPath _Function_

**default:** `(route) => route.route ? route.route : route`

When creating a dev router each route will be attached to the router using it's `route` value.

If you want to use a different express route you can provide a `transformExpressPath` function.

# Dev Server

Create an [Express Middleware](https://expressjs.com/en/guide/using-middleware.html) to attach to Webpack Dev Server to speed up development builds.

For particularly large projects with slow renders and a large number of routes rendering every route on every build can slow down development. The dev server allows you to only render the pages as they are needed during development, whilst ensuring the resulting render works like the full production render.

Using the [Webpack Dev Server Node API](https://github.com/webpack/webpack-dev-server/blob/master/examples/api/simple/server.js#L14) create a dev server and attach the dev HtmlRenderPlugin router to it. When pages are requested they will be rendered just-in-time, using the same method of rendering as production.

```js
const htmlRenderPlugin = new HtmlRenderPlugin({
  routes,
  skipAssets: true,
});

const compiler = webpack(config);

const webpackDevServer = new WebpackDevServer(compiler, {
  before: (app) => {
    app.use(htmlRenderPlugin.createDevRouter());
  },
});

webpackDevServer.listen("8081");
```

**Note:** Ensure that you use the same htmlRenderPlugin created for your webpack configuration as you use for your dev server.

# Manual just-in-time rendering

As an alternative to using the default dev server you can access `renderWhenReady` to apply your own just-in-time rendering.

Just call `renderWhenReady` with any route, and the next time the renderer is ready the render will be performed.

**Note:** Be careful to only use routes that are generated in a production. Not doing this can lead to differences between development and production builds.

Example: Using an Express App to render a dynamic path with ids.

```js
app.get('/books/:id', (req, res) => {
  res.send(await htmlRenderPlugin.renderWhenReady({route: '/books/_id'}))
})
```

Errors returned during this render will contain a `webpackStats` attribute when available. This can be useful when rendering your own error pages.

# Examples

## Example: Client assets

An example of using `mapStatsToParams` to create `<script>` tags.

**src/render.js**

```js
export default ({ mainChunk }) => {
  return `<html>
  <body>
    <script src="${mainChunk}"></script>
  </body>
  </html>`;
};
```

**webpack.config.js**

```js
const path = require("path");

const { htmlRenderPlugin, htmlRenderClientPlugin } = createHtmlRenderPlugin({
  mapStatsToParams: ({ webpackStats }) => ({
    mainChunk: webpackStats.toJson().assetsByChunkName.main,
  }),
});

module.exports = [
  {
    name: "client",
    target: "web",
    output: {
      filename: "client-[name]-[contenthash].js",
    },
    entry: path.resolve("src", "client.js"),
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
  {
    name: "render",
    target: "node",
    output: {
      libraryExport: "default",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js",
    },
    entry: path.resolve("src", "render.js"),
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
```

# Migration Guides

Migration from v1 to v2? Checkout the [Migration Guide](./MIGRATION_GUIDE_v1_to_v2.md).
