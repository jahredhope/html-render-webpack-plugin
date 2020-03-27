const path = require("path");
const HtmlRenderPlugin = require("../../../src");
const memoize = require("memoizee");

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};
const renderDirectory = path.join(process.cwd(), "dist", "render");

const routes = new Array(20000)
  .fill(undefined)
  .map((v, i) => ({ route: `route-${i}`, seed: i }));

const getStats = memoize((stats) => stats.toJson());

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: ({ webpackStats }) => {
    return webpackStats ? { webpackStats: getStats(webpackStats) } : {};
  },
  renderDirectory,
  routes,
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
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
  {
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
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
