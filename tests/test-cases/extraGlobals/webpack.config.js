import path from "node:path";
import HtmlRenderPlugin from "../../../src";

const srcPath = path.resolve(import.meta.dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
};

const renderDirectory = path.join(process.cwd(), "dist", "render");
const plugin = new HtmlRenderPlugin({
  mapStatsToParams: () => ({}),
  routes: [{ route: "/a/", extra: "a" }],
  renderDirectory,
  extraGlobals: {
    anExtraGlobalValue: "An Extra Global Value",
  },
});

export default {
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
};
