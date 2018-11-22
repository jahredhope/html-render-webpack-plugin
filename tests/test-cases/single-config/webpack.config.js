const path = require("path");
const HtmlRenderPlugin = require("../../../src");

const renderDirectory = path.join(process.cwd(), "dist", "render");
const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js")
};

module.exports = {
  name: "render",
  target: "node",
  mode: "production",
  entry: { render: paths.renderEntry },
  output: {
    libraryExport: "default",
    library: "static",
    libraryTarget: "umd2",
    filename: "render-[name]-[contenthash].js"
  },
  plugins: [new HtmlRenderPlugin({ renderDirectory })]
};
