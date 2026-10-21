import path from "node:path";
import HtmlRenderPlugin from "../../../src";

const srcPath = path.resolve(import.meta.dirname, "./src");
const renderDirectory = path.join(process.cwd(), "dist", "render");

const htmlRenderPlugin = new HtmlRenderPlugin({
  routes: [{ route: "/" }],
  renderDirectory,
  extraGlobals: {
    extraError: new Error("from extraGlobals"),
  },
});

export default [
  {
    name: "client",
    target: "web",
    mode: "production",
    entry: path.resolve(srcPath, "client.js"),
    output: {
      filename: "client-[name]-[contenthash].js",
    },
    plugins: [htmlRenderPlugin.statsCollectorPlugin],
  },
  {
    dependencies: ["client"],
    name: "render",
    target: "node",
    mode: "production",
    entry: path.resolve(srcPath, "render.js"),
    output: {
      libraryTarget: "commonjs2",
      filename: "render-[name]-[contenthash].js",
      chunkFilename: "render-chunk-[name]-[contenthash].js",
    },
    externals: {
      path: "commonjs path",
    },
    plugins: [htmlRenderPlugin.rendererPlugin],
  },
];
