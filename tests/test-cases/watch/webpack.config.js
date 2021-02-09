const path = require("path");
const HtmlRenderPlugin = require("../../../src").default;

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

const renderDirectory = path.join(process.cwd(), "dist", "render");
const plugin = new HtmlRenderPlugin({
  mapStatsToParams: () => ({}),
  routes: [
    { route: "/a/", extra: "a" },
    { route: "/b/", extra: "b" },
  ],
  renderDirectory,
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
    plugins: [plugin],
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
    plugins: [plugin.render()],
  },
];
