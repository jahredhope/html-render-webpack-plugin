const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Watch", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML on initial watch build", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new HtmlRenderPlugin({
        routes: [{ route: "/a/", extra: "a" }, { route: "/b/", extra: "b" }],
        renderDirectory
      })
    );

    const watching = compiler.watch({}, error => {
      watching.close();
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
