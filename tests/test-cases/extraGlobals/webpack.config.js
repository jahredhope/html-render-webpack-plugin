const path = require("path");

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js")
};

const HtmlRenderPlugin = require("../../../src");

const renderDirectory = path.join(process.cwd(), "dist", "render");
const plugin = new HtmlRenderPlugin({
  routes: [{ route: "/a/", extra: "a" }],
  renderDirectory,
  extraGlobals: {
    anExtraGlobalValue: "An Extra Global Value"
  }
});

module.exports = {
  name: "render",
  target: "node",
  mode: "production",
  entry: paths.renderEntry,
  output: {
    libraryExport: "default",
    library: "static",
    libraryTarget: "umd2",
    filename: "render-[name]-[contenthash].js"
  },
  plugins: [plugin.render()]
};
