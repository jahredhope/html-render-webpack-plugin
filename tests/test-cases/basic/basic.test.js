const MemoryFS = require("memory-fs");
const webpack = require("webpack");

const config = require("./webpack.config");
const MultiStaticRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render HTML", () => {
  const renderDirectory = "/renderDist";

  it("should render a HTML file", done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new MultiStaticRenderPlugin({
        renderDirectory
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a file per route", done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new MultiStaticRenderPlugin({
        routes: ["", "pageA", "pageB", "error.html"],
        renderDirectory
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render routes with extra information", done => {
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
        renderDirectory
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
