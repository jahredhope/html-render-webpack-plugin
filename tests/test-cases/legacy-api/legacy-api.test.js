import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import config from "./webpack.config.js";

describe("Use legacy api", () => {
  it("should render a HTML file", async () => {
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);

    const contents = memoryFs.readFileSync(
      path.join(process.cwd(), "dist", "index.html"),
      "utf8",
    );
    expect(contents).toMatchSnapshot();
  });
});
