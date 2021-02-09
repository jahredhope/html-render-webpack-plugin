const path = require("path");
const { merge } = require("webpack-merge");
const defaultConfig = require("./webpack.default.config");
const HtmlRenderPlugin = require("../../../src").default;

const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: () => ({}),
  renderDirectory,
  routes: [
    { route: "production", language: "en-us", environment: "production" },
    {
      route: "development",
      language: "en-us",
      environment: "development",
    },
  ],
});

module.exports = [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.rendererPlugin],
  }),
];
