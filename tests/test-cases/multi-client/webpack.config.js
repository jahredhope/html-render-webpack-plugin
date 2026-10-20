import path from "node:path";
import { fileURLToPath } from "node:url";

import HtmlRenderPlugin from "../../../src";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(currentDir, "./src");
const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  renderDirectory,
});

function clientConfig(name) {
  return {
    name,
    target: "web",
    mode: "production",
    entry: path.resolve(srcPath, `${name}.js`),
    output: {
      filename: `${name}-[name]-[contenthash].js`,
    },
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  };
}

export default [
  clientConfig("client-a"),
  clientConfig("client-b"),
  {
    dependencies: ["client-a", "client-b"],
    name: "render",
    target: "node",
    mode: "production",
    entry: path.resolve(srcPath, "render.js"),
    output: {
      libraryExport: "default",
      library: "static",
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
