import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

const distEntry = path.resolve(import.meta.dirname, "../../dist/index.js");
const distExists = existsSync(distEntry);

describe("ESM interop", () => {
  it.skipIf(!distExists)(
    "exposes the named export from the built CommonJS package",
    () => {
      const script = `
        import { HtmlRenderPlugin } from ${JSON.stringify(
          pathToFileURL(distEntry).href,
        )};
        console.log(typeof HtmlRenderPlugin);
      `;

      const output = execFileSync(
        process.execPath,
        ["--input-type=module", "--eval", script],
        { encoding: "utf8" },
      );

      expect(output.trim()).toBe("function");
    },
  );
});
