const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Plugin applied to MultiCompiler", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    new HtmlRenderPlugin().apply(compiler);

    compiler.run(error => {
      expect(error).toBe(null);
      const contents = memoryFs.readFileSync(
        path.join(process.cwd(), "dist", "index.html"),
        "utf8"
      );
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render in a custom directory", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    new HtmlRenderPlugin({ renderDirectory }).apply(compiler);

    compiler.run(error => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, {
        fs: memoryFs
      });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a file per route", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    new HtmlRenderPlugin({
      routes: ["", "pageA", "pageB", "error.html"],
      renderDirectory
    }).apply(compiler);

    compiler.run(error => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });

  it("should render routes with extra information", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    new HtmlRenderPlugin({
      routes: [
        { route: "production", language: "en-us", environment: "production" },
        {
          route: "development",
          language: "en-us",
          environment: "development"
        }
      ],
      renderDirectory
    }).apply(compiler);

    compiler.run(error => {
      expect(error).toBe(null);
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should allow custom file paths", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    new HtmlRenderPlugin({
      transformFilePath: ({ route, language, environment }) =>
        `/${environment}/${language}/${route}`,
      routes: [
        { route: "about/us", language: "en-us", environment: "production" },
        {
          route: "about/us",
          language: "en-au",
          environment: "development"
        }
      ],
      renderDirectory
    }).apply(compiler);

    compiler.run(error => {
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
