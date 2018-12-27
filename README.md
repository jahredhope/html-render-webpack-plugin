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
  plugins: [new HtmlRenderPlugin().render()]
};
```

# Multiple configurations

Apply `html-render-webpack-plugin` to your webpack [MultiCompiler](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations) to enable rendering based on all resulting webpack outputs.

The code from the render build is used to generate the HTML, often using values from other builds such as asset names of created assets.

For example, you may wish to add a script tag where the name includes a hash:

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

Pass an instance of HtmlRenderPlugin to each configuration that should be available during render. Call `.render()` on the configuration that should be used to render.

**webpack.config.js**

```js
const HtmlRenderPlugin = require("html-render-webpack-plugin");

const htmlRenderPlugin = new HtmlRenderPlugin();
module.exports = [
  {
    name: "render",
    target: "node", // Creates assets that render HTML that runs well in node
    plugins: [htmlRenderPlugin.render()]
  },
  {
    name: "client",
    target: "web", // Creates files that run on the browser
    plugins: [htmlRenderPlugin]
  }
];
```

See [examples](#examples) for more details.

### Alternative multiple configuration setup

Instead of applying the plugin to each configuration you can apply the plugin to the parent [MultiCompiler](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations).

This is not recommended and may eventually deprecated in future releases.

**webpack.config.js**

```js
module.exports = [
  {
    name: "render",
    target: "node" // Creates assets that render HTML that runs well in node
  },
  {
    name: "client",
    target: "web" // Creates files that run on the browser
  }
];
```

Use the [webpack Node API](https://webpack.js.org/api/node/) to create a `MultiCompiler`.

```js
const webpack = require("webpack");
const config = require("./webpack.config");
const multiCompiler = webpack(config);
```

Apply the plugin to your compiler.

```js
const HtmlRenderPlugin = require("html-render-webpack-plugin");

new HtmlRenderPlugin().apply(multiCompiler);
```

Start the build

```js
// Single build
multiCompiler.run((error, stats) => {});
```

```js
// Development server
const DevServer = require("webpack-dev-server");

const server = new DevServer(multiCompiler, {
  compress: true
});
server.listen(8080, "localhost", () => {});
```

# Options

## Option: renderEntry _string_

**default:** "main"

The entry to use when rendering. Override when using [object syntax](https://webpack.js.org/concepts/entry-points/#object-syntax) in webpack entry.

```js
```

**webpack.config.js**

```js
module.exports = {
  entry: {
    myRender: "./src/myRender.js"
  },
  plugins: [
    new HtmlRenderPlugin({
      renderEntry: "myRender"
    }).render()
  ]
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
    language: "en-us"
  },
  {
    route: "en-us/about",
    language: "en-us"
  },
  {
    route: "en-au/contact",
    language: "en-au"
  },
  {
    route: "/en-au/about",
    language: "en-au"
  }
];
```

## Option: mapStatsToParams _Function_

**default:** `({webpackStats, ...route}) => ({})`

mapStatsToParams should accept webpackStats and [route](#option-routes-arrayobjectstring) information and returns values to be passed into render.
The function is called individually for each render.

**Recommendation:** mapStatsToParams is an opportunity to limit what information is provided to your render function. Keeping the boundary between your build code and application code simple. Avoid passing all webpackStats into your render function, pull out only the information needed.

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

# Examples

## Example: Client assets

An example of using `mapStatsToParams` to create `<script>` tags.

**src/render.js**

```js
export default ({ clientStats }) => {
  return `<html>
  <body>
    <script src="${clientStats.assetsByChunkName.main}"></script>
  </body>
  </html>`;
};
```

**webpack.config.js**

```js
const path = require("path");

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: ({ webpackStats }) => ({
    clientStats: webpackStats
      .toJson()
      .children.find(({ name }) => name === "client")
  })
});

module.exports = [
  {
    name: "client",
    target: "web",
    output: {
      filename: "client-[name]-[contenthash].js"
    },
    entry: path.resolve("src", "client.js"),
    plugins: [htmlRenderPlugin]
  },
  {
    name: "render",
    target: "node",
    output: {
      libraryExport: "default",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js"
    },
    entry: path.resolve("src", "render.js"),
    plugins: [htmlRenderPlugin.render()]
  }
];
```
