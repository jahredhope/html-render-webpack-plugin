const merge = require("webpack-merge");
const defaultConfig = require("./webpack.default.config");
const HtmlRenderPlugin = require("../../../src");

const htmlRenderPlugin = new HtmlRenderPlugin();

module.exports = [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.collectStats]
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.render]
  })
];
