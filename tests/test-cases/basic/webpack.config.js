const path = require("path");

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js")
};

module.exports = [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: { client: paths.clientEntry },
    output: {
      filename: "client-[name]-[contenthash].js"
    }
  },
  {
    name: "render",
    target: "node",
    mode: "production",
    entry: { render: paths.renderEntry },
    output: {
      libraryExport: "default",
      library: "static",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js"
    }
  }
];
