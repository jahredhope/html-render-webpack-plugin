const path = require("path");
const merge = require("webpack-merge");
const defaultConfig = require("./webpack.default.config");
const HtmlRenderPlugin = require("../../../src");

console.log("HtmlRenderPlugin", HtmlRenderPlugin);
console.log("HtmlRenderPlugin default", HtmlRenderPlugin.default);

const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({ renderDirectory });

module.exports = [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin]
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.render()]
  })
];
