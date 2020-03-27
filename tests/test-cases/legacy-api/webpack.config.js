const path = require("path");
const HtmlRenderPlugin = require("../../../src");

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: [
    {
      route: "/",
      extra: "extra-value",
    },
  ],
  mapStatsToParams: ({ webpackStats }) => ({
    assets: webpackStats.toJson().assetsByChunkName,
  }),
});

module.exports = [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: paths.clientEntry,
    output: {
      filename: "client-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin],
  },
  {
    dependencies: ["client"],
    name: "render",
    target: "node",
    mode: "production",
    entry: paths.renderEntry,
    output: {
      libraryExport: "default",
      library: "static",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.render()],
  },
];
