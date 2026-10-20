import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import config from "./webpack.config.js";

describe("Render WebpackStats", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a with asset names", async () => {
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    const stats = await runWebpack(compiler);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });
});
