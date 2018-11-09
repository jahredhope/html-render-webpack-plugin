const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const MultiStaticRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render HTML", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(new MultiStaticRenderPlugin({ renderDirectory: "render" }));

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a file per route", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new MultiStaticRenderPlugin({
        routes: ["", "pageA", "pageB", "error.html"],
        renderDirectory: "render"
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render routes with extra information", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new MultiStaticRenderPlugin({
        routes: [
          { route: "production", language: "en-us", environment: "production" },
          {
            route: "development",
            language: "en-us",
            environment: "development"
          }
        ],
        renderDirectory: "render"
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
