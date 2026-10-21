import path from "node:path";

import HtmlRenderPlugin from "../../../src";

const renderDirectory = path.join(
  process.cwd(),
  "dist",
  "single-config-default",
);
const srcPath = path.resolve(import.meta.dirname, "./src");

export default {
  name: "render",
  target: "node",
  mode: "production",
  entry: path.resolve(srcPath, "render.js"),
  output: {
    library: { type: "umd2", export: "default" },
    filename: "render-[name]-[contenthash].js",
  },
  plugins: [new HtmlRenderPlugin({ renderDirectory }).rendererPlugin],
};
