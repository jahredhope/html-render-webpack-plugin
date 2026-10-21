import { merge } from "webpack-merge";
import defaultConfig from "./webpack.default.config.js";
import HtmlRenderPlugin from "../../../src";

const htmlRenderPlugin = new HtmlRenderPlugin({ mapStatsToParams: () => ({}) });

export default [
  merge(defaultConfig[0], {
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  }),
  merge(defaultConfig[1], {
    plugins: [htmlRenderPlugin.rendererPlugin],
  }),
];
