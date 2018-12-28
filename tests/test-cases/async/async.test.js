const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render asyncronously", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML once resolved", async done => {
    const compiler = webpack(config(new HtmlRenderPlugin({ renderDirectory })));

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a multiple files at once", async done => {
    jest.setTimeout(1000);
    const compiler = webpack(
      config(
        new HtmlRenderPlugin({
          renderConcurrency: "parallel",
          routes: new Array(20).fill(null).map((_, i) => `page${i}`),
          renderDirectory
        })
      )
    );

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.run(error => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
