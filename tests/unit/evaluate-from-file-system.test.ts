import path from "node:path";
import { describe, expect, it } from "vitest";

import evaluateFromFileSystem from "../../src/evaluateFromFileSystem";
import { createInMemoryFileSystem } from "../utils/memory-fs";

function createFileSystem(files: Record<string, string>) {
  const fileSystem = createInMemoryFileSystem();
  fileSystem.fromJSON(files);
  return fileSystem;
}

describe("evaluateFromFileSystem", () => {
  it("evaluates a module with a require-like scope", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `
        module.exports = {
          dirname: __dirname,
          filename: __filename,
          thisIsExports: this === exports,
          isArray: (value) => value instanceof Array,
          isError: (value) => value instanceof Error,
        };
      `,
    });

    const renderer = evaluateFromFileSystem(
      "render.js",
      fileSystem,
      "/output",
      {},
    ) as any;

    expect(renderer.dirname).toBe(".");
    expect(renderer.filename).toBe("render.js");
    expect(renderer.thisIsExports).toBe(true);
    // Values from the host realm keep their prototypes.
    expect(renderer.isArray([])).toBe(true);
    expect(renderer.isError(new Error("boom"))).toBe(true);
  });

  it("exposes extraGlobals as free variables", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `module.exports = anExtraGlobalValue;`,
    });

    const result = evaluateFromFileSystem("render.js", fileSystem, "/output", {
      anExtraGlobalValue: "from options",
    });

    expect(result).toBe("from options");
    expect("anExtraGlobalValue" in globalThis).toBe(false);
  });

  it("requires assets from the output file system", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `module.exports = require("./nested.js");`,
      "/output/nested.js": `module.exports = () => "nested";`,
    });

    const renderer = evaluateFromFileSystem(
      "render.js",
      fileSystem,
      "/output",
      {},
    ) as any;

    expect(renderer()).toBe("nested");
  });

  it("falls back to the real require for external packages", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `module.exports = require("path").sep;`,
    });

    const result = evaluateFromFileSystem(
      "render.js",
      fileSystem,
      "/output",
      {},
    );

    expect(result).toBe(path.sep);
  });

  it("rejects extraGlobals that shadow the module scope", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `module.exports = {};`,
    });

    expect(() =>
      evaluateFromFileSystem("render.js", fileSystem, "/output", {
        require: () => {},
      }),
    ).toThrow(/cannot use the reserved name "require"/);
  });

  it("rejects extraGlobals that are not identifiers", () => {
    const fileSystem = createFileSystem({
      "/output/render.js": `module.exports = {};`,
    });

    expect(() =>
      evaluateFromFileSystem("render.js", fileSystem, "/output", {
        "not-an-identifier": true,
      }),
    ).toThrow(/is not a valid JavaScript identifier/);
  });

  it("throws a clear error when the source is missing", () => {
    const fileSystem = createFileSystem({});

    expect(() =>
      evaluateFromFileSystem("missing.js", fileSystem, "/output", {}),
    ).toThrow(/Unable to find source for "missing.js"/);
  });
});
