import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import HtmlRenderPlugin from "../../../src";
import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import getConfig from "./webpack.config.js";

describe("Single webpack build with default options", () => {
  const renderDirectory = path.join(
    process.cwd(),
    "dist",
    "single-config-default",
  );

  function build() {
    return buildFixture(getConfig(new HtmlRenderPlugin({ renderDirectory })));
  }

  it("renders using the renderer stats when there is no client build", async () => {
    const { stats, memoryFs } = await build();

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["index.html"]).toContain("stats:available");
    expect(contents["index.html"]).toContain("route:");
  });

  it("writes the render summary to stderr, not stdout", async () => {
    const stdout = vi.spyOn(console, "log").mockImplementation(() => {});
    const stderr = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      await build();

      expect(stdout.mock.calls.flat().join(" ")).not.toContain(
        "HtmlRenderPlugin",
      );

      const summary = stderr.mock.calls.flat().join(" ");
      expect(summary).toContain("Rendered 1 route to");
      expect(summary).toContain(renderDirectory);
    } finally {
      stdout.mockRestore();
      stderr.mockRestore();
    }
  });
});
