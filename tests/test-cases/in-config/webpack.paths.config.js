import path from "node:path";
import { merge } from "webpack-merge";
import defaultConfig from "./webpack.default.config.js";
import HtmlRenderPlugin from "../../../src";

const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  mapStatsToParams: () => ({}),
  transformFilePath: ({ route, language, environment }) =>
    `/${environment}/${language}/${route}`,
  routes: [
    { route: "about/us", language: "en-us", environment: "production" },
    {
      route: "about/us",
      language: "en-au",
      environment: "development",
    },
  ],
  renderDirectory,
});

export default [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.rendererPlugin],
  }),
];
