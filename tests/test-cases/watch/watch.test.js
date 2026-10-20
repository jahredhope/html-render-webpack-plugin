import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import config from "./webpack.config.js";

describe("Watch", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML on initial watch build", async () => {
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    await new Promise((resolve, reject) => {
      const watching = compiler.watch({}, (error) => {
        if (error) {
          watching.close(() => reject(error));
          return;
        }
        watching.close(() => resolve(undefined));
      });
    });

    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });
});
