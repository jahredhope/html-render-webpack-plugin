import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import HtmlRenderPlugin from "../../../src";
import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import getConfig from "./webpack.config.js";

describe("Render asynchronously", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML once resolved", async () => {
    const compiler = webpack(
      getConfig(
        new HtmlRenderPlugin({ mapStatsToParams: () => ({}), renderDirectory })
      )
    );

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    const stats = await runWebpack(compiler);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });

  it("should render a multiple files at once", async () => {
    const compiler = webpack(
      getConfig(
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

    const stats = await runWebpack(compiler);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });
});
