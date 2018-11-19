const MemoryFS = require("memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");
const HtmlRenderPlugin = require("../../../src");
const getDirContentsSync = require("../../utils/getDirContentsSync");

describe("Render HTML", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(new HtmlRenderPlugin({ renderDirectory }));

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should render a file per route", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
      new HtmlRenderPlugin({
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
  it("should render routes with extra information", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
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
      })
    );

    compiler.run(() => {
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
  it("should allow custom file paths", async done => {
    const compiler = webpack(config);

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.apply(
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
      })
    );

    compiler.run(() => {
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
