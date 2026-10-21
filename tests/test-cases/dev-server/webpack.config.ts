import path from "node:path";
import type { Configuration } from "webpack";

import type HtmlRenderPlugin from "../../../src";

type DependentConfiguration = Configuration & { dependencies?: string[] };

const srcPath = path.resolve(import.meta.dirname, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

export default (
  htmlRenderPlugin: HtmlRenderPlugin<any>,
): DependentConfiguration[] => [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: paths.clientEntry,
    output: {
      filename: "client-[name]-[contenthash].js",
      publicPath: "/",
    },
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
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
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
