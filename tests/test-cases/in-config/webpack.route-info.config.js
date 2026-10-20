import path from "node:path";
import { merge } from "webpack-merge";
import defaultConfig from "./webpack.default.config.js";
import HtmlRenderPlugin from "../../../src";

const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: () => ({}),
  renderDirectory,
  routes: [
    { route: "production", language: "en-us", environment: "production" },
    {
      route: "development",
      language: "en-us",
      environment: "development",
    },
  ],
});

export default [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.rendererPlugin],
  }),
];
