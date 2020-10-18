const { Volume } = require("memfs");
const webpack = require("webpack");
const path = require("path");

const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render HTML from in-config Plugin", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async (done) => {
    const compiler = webpack(require("./webpack.zero-config.config"));

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      const contents = memoryFs.readFileSync(
        path.join(process.cwd(), "dist", "index.html"),
        "utf8"
      );
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render in a custom directory", async (done) => {
    const compiler = webpack(require("./webpack.directory.config.js"));

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, {
        fs: memoryFs,
      });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a file per route", async (done) => {
    const compiler = webpack(require("./webpack.routes.config.js"));

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });

  it("should render routes with extra information", async (done) => {
    const compiler = webpack(require("./webpack.route-info.config.js"));

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should allow custom file paths", async (done) => {
    const compiler = webpack(require("./webpack.paths.config.js"));

    const memoryFs = Volume.fromJSON({});
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      expect(
        memoryFs.existsSync(
          path.join(renderDirectory, "/production/en-us/about/us/index.html")
        )
      ).toBe(true);
      expect(
        memoryFs.existsSync(
          path.join(renderDirectory, "/development/en-au/about/us/index.html")
        )
      ).toBe(true);
      expect(
        memoryFs.existsSync(path.join(renderDirectory, "/about/us/index.html"))
      ).toBe(false);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();

      done();
    });
  });
});
