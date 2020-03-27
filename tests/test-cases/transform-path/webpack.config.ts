import path from "path";
import { Configuration } from "webpack";
import HtmlRenderPlugin from "../../../src";

const srcPath = path.resolve(__dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

export default (htmlRenderPlugin: HtmlRenderPlugin<any>): Configuration[] => [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: paths.clientEntry,
    output: {
      filename: "client-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
  {
    name: "render",
    target: "node",
    mode: "production",
    entry: paths.renderEntry,
    output: {
      libraryExport: "default",
      library: "static",
      libraryTarget: "umd",
      filename: "render-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
