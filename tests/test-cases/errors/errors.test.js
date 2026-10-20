import { describe, expect, it } from "vitest";
import webpack from "webpack";

import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import config from "./webpack.errors.config.js";

describe("Errors when rendering", () => {
  it("should create an error in the compiler", async () => {
    const compiler = webpack(config);
    compiler.outputFileSystem = createInMemoryFileSystem();

    const result = await runWebpack(compiler);

    // Render errors do not show up as build errors, they show up in the compilation
    expect(result.toJson({ all: false, errors: true }).errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Example error"),
        }),
      ]),
    );
  });
});
