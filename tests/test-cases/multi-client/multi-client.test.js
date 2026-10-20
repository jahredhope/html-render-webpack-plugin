import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import config from "./webpack.config.js";

describe("Multiple client builds", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should combine stats from every client compilation", async () => {
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    const stats = await runWebpack(compiler);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    const html = contents["index.html"];

    expect(html).toContain('"name": "client-a"');
    expect(html).toContain('"name": "client-b"');
    expect(html).toContain("client-a-main-");
    expect(html).toContain("client-b-main-");
  });
});
