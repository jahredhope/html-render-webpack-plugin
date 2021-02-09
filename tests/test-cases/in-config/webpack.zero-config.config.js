const { merge } = require("webpack-merge");
const defaultConfig = require("./webpack.default.config");
const HtmlRenderPlugin = require("../../../src").default;

const htmlRenderPlugin = new HtmlRenderPlugin({ mapStatsToParams: () => ({}) });

module.exports = [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.rendererPlugin],
  }),
];
