const MemoryFS = require("memory-fs");
const webpack = require("webpack");

const config = require("./webpack.config");
const MultiStaticRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render HTML", () => {
  const renderDirectory = "/renderDist";

  it("should render a HTML file", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new MultiStaticRenderPlugin({
        renderDirectory
      })
    );

    compiler.run(() => {
      setTimeout(() => {
        const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
        expect(contents).toMatchSnapshot();
        done();
      }, 2000);
    });
  });
  it("should render a file per route", async done => {
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
      setTimeout(() => {
        const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
        expect(contents).toMatchSnapshot();
        done();
      }, 2000);
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
        renderDirectory
      })
    );

    compiler.run(() => {
      setTimeout(() => {
        const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
        expect(contents).toMatchSnapshot();
        done();
      }, 2000);
    });
  });
});
