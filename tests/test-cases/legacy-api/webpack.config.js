import path from "node:path";
import HtmlRenderPlugin from "../../../src";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const srcPath = path.resolve(currentDir, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};

const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: [
    {
      route: "/",
      extra: "extra-value",
    },
  ],
  mapStatsToParams: ({ webpackStats }) => ({
    assets: webpackStats.toJson().assetsByChunkName,
  }),
});

export default [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: paths.clientEntry,
    output: {
      filename: "client-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin],
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
    plugins: [htmlRenderPlugin.render()],
  },
];
