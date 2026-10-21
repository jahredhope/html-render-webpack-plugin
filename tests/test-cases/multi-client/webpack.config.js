import path from "node:path";

import HtmlRenderPlugin, { getEntrypointScriptUrls } from "../../../src";

const srcPath = path.resolve(import.meta.dirname, "./src");
const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  renderDirectory,
  mapStatsToParams: ({ webpackStats }) => ({
    webpackStats: webpackStats.toJson(),
    scripts: getEntrypointScriptUrls(webpackStats),
  }),
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
