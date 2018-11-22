const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render WebpackStats", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a with asset names", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new HtmlRenderPlugin({
        renderDirectory,
        mapStatsToParams: ({ webpackStats }) => ({
          webpackStats
        })
      })
    );

    compiler.run(error => {
      if (error) {
        throw error;
      }
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
