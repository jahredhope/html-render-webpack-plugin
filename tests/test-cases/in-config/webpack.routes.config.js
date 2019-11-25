const path = require("path");
const merge = require("webpack-merge");
const defaultConfig = require("./webpack.default.config");
const HtmlRenderPlugin = require("../../../src");

const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  renderDirectory,
  routes: ["", "pageA", "pageB", "error.html"]
});

module.exports = [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.collectStats]
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.render]
  })
];
