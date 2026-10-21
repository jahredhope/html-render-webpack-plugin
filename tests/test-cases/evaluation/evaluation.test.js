import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import config from "./webpack.config.js";

describe("Renderer evaluation", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("evaluates the emitted renderer with a require-like module scope", async () => {
    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    const html = contents["index.html"];

    // __dirname/__filename come from the evaluator, resolved against the
    // compiler's output directory rather than the process CWD.
    expect(html).toContain(`dirname:${path.join(process.cwd(), "dist")}`);
    expect(html).toMatch(/filename:render-main-[a-z0-9]+\.js/);
    // Both require paths end up in our linker: module.require and an external.
    expect(html).toContain(`moduleRequire:${path.sep}`);
    expect(html).toContain(`external:${path.sep}`);
    // extraGlobals keep host-realm identities, so instanceof works.
    expect(html).toContain("extraGlobalIsError:true");
    expect(html).toContain("extraGlobalMessage:from extraGlobals");
    // Async chunks are read back from the compiler's output file system.
    const assets = memoryFs.readdirSync(path.join(process.cwd(), "dist"));
    expect(assets.map(String).some((name) => /^render-chunk-/.test(name))).toBe(
      true,
    );
    expect(html).toContain("dynamic:from dynamic chunk");
  });
});
