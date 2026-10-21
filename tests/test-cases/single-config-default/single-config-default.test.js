import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import config from "./webpack.config.js";

describe("Single webpack build with default options", () => {
  it("renders using the renderer stats when there is no client build", async () => {
    const renderDirectory = path.join(
      process.cwd(),
      "dist",
      "single-config-default",
    );
    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["index.html"]).toContain("stats:available");
    expect(contents["index.html"]).toContain("route:");
  });
});
