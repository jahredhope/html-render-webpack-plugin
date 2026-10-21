import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const distEntry = path.resolve(import.meta.dirname, "../../dist/index.js");
// The test verifies the built package. CI runs `pnpm build` before `pnpm test`,
// so this only skips for a local test run without a build.
const distExists = existsSync(distEntry);

describe("ESM interop", () => {
  it.skipIf(!distExists)(
    "exposes the named exports from the built CommonJS package",
    () => {
      const script = `
        import {
          HtmlRenderPlugin,
          getEntrypointScriptUrls,
        } from ${JSON.stringify(pathToFileURL(distEntry).href)};
        console.log(typeof HtmlRenderPlugin, typeof getEntrypointScriptUrls);
      `;

      const output = execFileSync(
        process.execPath,
        ["--input-type=module", "--eval", script],
        { encoding: "utf8" },
      );

      expect(output.trim()).toBe("function function");
    },
  );
});
