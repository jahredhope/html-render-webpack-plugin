const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const MultiStaticRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render asyncronously", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML once resolved", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(new MultiStaticRenderPlugin({ renderDirectory }));

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
