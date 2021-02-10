const { createInMemoryFileSystem } = require("../../utils/memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src").default;
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render asynchronously", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML once resolved", async (done) => {
    const compiler = webpack(
      config(
        new HtmlRenderPlugin({ mapStatsToParams: () => ({}), renderDirectory })
      )
    );

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error, stats) => {
      expect(error).toBe(null);
      expect(stats.hasErrors()).toBe(false);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a multiple files at once", async (done) => {
    jest.setTimeout(2000);
    const compiler = webpack(
      config(
        new HtmlRenderPlugin({
          mapStatsToParams: () => ({}),
          renderConcurrency: "parallel",
          routes: new Array(20).fill(null).map((_, i) => `page${i}`),
          renderDirectory,
        })
      )
    );

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error, stats) => {
      expect(stats.hasErrors()).toBe(false);
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
