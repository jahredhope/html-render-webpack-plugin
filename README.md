# html-render-webpack-plugin

webpack plugin for rendering static HTML in a multi-config webpack build

# Setup

**Note:** Requires Node v10.12 or greater.

```bash
$ npm install webpack html-render-webpack-plugin
# OR
$ yarn add webpack html-render-webpack-plugin
```

Export [multiple webpack configurations](https://webpack.js.org/configuration/configuration-types/#exporting-multiple-configurations).

```js
// webpack.config.js
module.exports = [
  {
    name: "client",
    target: "web"
    // Creates files that run on the browser
  },
  {
    name: "render",
    target: "node"
    // Creates assets that render HTML that runs well in node
    dependencies: ["client"], // Requires client files to be ready before render
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

multiCompiler.apply(
  new HtmlRenderPlugin({
    renderDirectory: path.join(process.cwd(), "dist")
  })
);
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

See [examples](#examples) for more details.

## Why two configurations? It's all just JavaScript

For some builds you may be able to avoid needing two configurations. If that is the case you don't need this tool and can avoid the complexity.
Here are some reasons I've needed to use two configurations:

##### Complex loaders

Some projects use webpack only to generate the client assets. For the render they then use tools such as babel directly.
This can become a complex when the project has webpack loaders that affect the behaviour of the code such as [CSS Modules](https://github.com/css-modules/css-modules). This can result in differences between rendered HTML and client code.

##### Async chunks

webpack's `target` field helps webpack decide how to handle async chunks.
For example:

- A web build may try to create `<script />` tags to load in the new file.
- A node build may try to `require()` the new file.

Code compiled for one target may not work for in the other environment, especially when encountering async chunks.

## Why not just use existing static generation tools?

There are lots of other [great options for statically rendering your HTML](https://github.com/markdalgleish/static-site-generator-webpack-plugin) but they typically work on a single webpack build.

However when rendering your HTML you may need access to information about all your assets.
For example, when using content hash based file names you need to render with the node/render assets, but you need to know the names of the static assets generated.

# Options

## routes Array<object|string>

**default:** [""]
To render multiple pages pass a routes array. Each route will create a seperate `.html` file.
A route can be a string showing the folder or file to render. `index.html` is automatically appended for paths.

```js
const routes = ["", "contact", "about"];
```

A route can be an object, containing a `route` parameter. Additional values will be passed to `mapStatsToParams`.

```js
const routes = [
  {
    route: "en-us/contact",
    language: "en-us"
  },
  {
    route: "en-us/about"
    language: "en-us"
  },
  {
    route: "en-au/contact"
    language: "en-au"
  },
  {
    route: "/en-au/about"
    language: "en-au"
  }
];
```

## transformFilePath

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

# Examples

## Basic

**build.js**

```js
const path = require("path");
const webpack = require("webpack");
const config = require("./webpack.config");
const HtmlRenderPlugin = require("html-render-webpack-plugin");

const compiler = webpack(config);

// Apply the plugin directly to the MultiCompiler
compiler.apply(
  new HtmlRenderPlugin({
    renderDirectory: path.join(process.cwd(), "dist")
  })
);
```

**webpack.config.js**

```js
module.exports = [
  {
    name: "client",
    target: "web",
    output: {
      filename: "client-[name]-[contenthash].js",
    }
    entry: { client: path.resolve("src", "client.js") }
  },
  {
    dependencies: ["client"],
    name: "render",
    target: "node",
    output: {
      libraryExport: "default",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js",
    },
    entry: { render: path.resolve("src", "render.js") },
  }),
]
```

## Example: Live reload

**dev-server.js**

```js
const DevServer = require("webpack-dev-server");
const getCompiler = require("./getCompiler");
const compiler = getCompiler({ liveReload: true, mode: "development" });

const server = new DevServer(compiler, {
  compress: true
});
server.listen(8080, "localhost", function() {});
```

**getCompiler.js**

```js
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const getConfig = require("./webpack.config");
const RenderStaticPlugin = require("html-render-webpack-plugin");

module.exports = function getCompiler({ liveReload, mode }) {
  const compiler = webpack(getConfig({ liveReload, mode }));

  const cwd = process.cwd();
  const distDirectory = path.join(cwd, "dist");

  const routes = ["", "b", "a", "c", "about", "home", "contact/us"];
  compiler.apply(
    new RenderStaticPlugin({
      routes,
      mapStatsToParams: ({ clientStats }) => {
        const fileSystem = compiler.compilers[0].outputFileSystem.readFileSync
          ? compiler.compilers[0].outputFileSystem
          : fs;
        return {
          clientStats,
          reactLoadableManifest: JSON.parse(
            fileSystem.readFileSync(
              path.join(clientStats.outputPath, "react-loadable-manifest.json"),
              "utf8"
            )
          )
        };
      },
      renderDirectory: distDirectory,
      fs,
      verbose: true
    })
  );

  return compiler;
};
```

**webpack.config.js**

```js
const webpack = require("webpack");
const merge = require("webpack-merge");
const path = require("path");
const {
  ReactLoadablePlugin
} = require("@jahredhope/react-loadable-webpack-plugin");

const cwd = process.cwd();
const srcPath = path.resolve(cwd, "./src");
const routes = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js")
};

module.exports = ({ liveReload, mode }) => {
  const domain = "http://localhost:8080";
  const liveReloadEntry = `${require.resolve(
    "webpack-dev-server/client/"
  )}?${domain}`;

  const common = {
    mode,
    output: {
      publicPath: "/"
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: {
            loader: "babel-loader"
          }
        }
      ]
    }
  };
  const clientEntry = liveReload
    ? [liveReloadEntry, routes.clientEntry]
    : routes.clientEntry;
  return [
    merge(common, {
      output: {
        filename: "client-[name]-[contenthash].js"
      },
      optimization: {
        runtimeChunk: {
          name: "manifest"
        },
        splitChunks: {
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "vendor",
              chunks: "all"
            }
          }
        }
      },
      name: "client",
      target: "web",
      entry: { client: clientEntry },
      plugins: [
        new ReactLoadablePlugin({
          filename: "react-loadable-manifest.json"
        }),
        new webpack.HashedModuleIdsPlugin()
      ]
    }),
    merge(common, {
      dependencies: ["client"],
      output: {
        libraryExport: "default",
        library: "static",
        libraryTarget: "umd2",
        filename: "render-[name]-[contenthash].js"
      },
      name: "render",
      target: "node",
      entry: { render: routes.renderEntry }
    })
  ];
};
```
