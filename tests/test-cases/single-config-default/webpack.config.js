import path from "node:path";

const srcPath = path.resolve(import.meta.dirname, "./src");

export default (htmlRenderPlugin) => ({
  name: "render",
  target: "node",
  mode: "production",
  entry: path.resolve(srcPath, "render.js"),
  output: {
    library: { type: "umd2", export: "default" },
    filename: "render-[name]-[contenthash].js",
  },
  plugins: [htmlRenderPlugin.rendererPlugin],
});
