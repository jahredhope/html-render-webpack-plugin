import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import directoryConfig from "./webpack.directory.config.js";
import pathsConfig from "./webpack.paths.config.js";
import routeInfoConfig from "./webpack.route-info.config.js";
import routesConfig from "./webpack.routes.config.js";
import zeroConfig from "./webpack.zero-config.config.js";

describe("Render HTML from in-config Plugin", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async () => {
    const compiler = webpack(zeroConfig);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

    const contents = memoryFs.readFileSync(
      path.join(process.cwd(), "dist", "index.html"),
      "utf8"
    );
    expect(contents).toMatchSnapshot();
  });

  it("should render in a custom directory", async () => {
    const compiler = webpack(directoryConfig);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

    const contents = getDirContentsSync(renderDirectory, {
      fs: memoryFs,
    });
    expect(contents).toMatchSnapshot();
  });

  it("should render a file per route", async () => {
    const compiler = webpack(routesConfig);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });

  it("should render routes with extra information", async () => {
    const compiler = webpack(routeInfoConfig);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });

  it("should allow custom file paths", async () => {
    const compiler = webpack(pathsConfig);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

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
  });
});
