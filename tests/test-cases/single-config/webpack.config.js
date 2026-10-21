import path from "node:path";
import HtmlRenderPlugin from "../../../src";

const renderDirectory = path.join(process.cwd(), "dist", "render");
const srcPath = path.resolve(import.meta.dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

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
  plugins: [
    new HtmlRenderPlugin({
      mapStatsToParams: () => ({}),
      renderDirectory,
    }).render(),
  ],
};
