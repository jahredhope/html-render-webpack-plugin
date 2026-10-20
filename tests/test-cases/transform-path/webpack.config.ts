import path from "path";
import { Configuration } from "webpack";
import HtmlRenderPlugin from "../../../src";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const srcPath = path.resolve(currentDir, "./src");
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
