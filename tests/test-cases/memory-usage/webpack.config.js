import path from "node:path";
import HtmlRenderPlugin from "../../../src";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const srcPath = path.resolve(currentDir, "./src");
const paths = {
  renderEntry: path.resolve(srcPath, "render.js"),
  clientEntry: path.resolve(srcPath, "client.js"),
};
const renderDirectory = path.join(process.cwd(), "dist", "render");

const routes = new Array(20000)
  .fill(undefined)
  .map((v, i) => ({ route: `route-${i}`, seed: i }));

const statsCache = new Map();
const getStats = (stats) => {
  if (!statsCache.has(stats)) {
    statsCache.set(stats, stats.toJson());
  }
  return statsCache.get(stats);
};

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: ({ webpackStats }) => {
    return webpackStats ? { webpackStats: getStats(webpackStats) } : {};
  },
  renderDirectory,
  routes,
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
      libraryTarget: "umd2",
      filename: "render-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
