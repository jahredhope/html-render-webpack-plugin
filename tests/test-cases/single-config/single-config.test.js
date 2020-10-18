const { Volume } = require("memfs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Single webpack build", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async (done) => {
    const compiler = webpack(config);

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error, stats) => {
      expect(error).toBe(null);
      expect(stats.hasErrors()).toBe(false);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
