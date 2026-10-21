import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import config from "./webpack.config.js";

describe("Multiple client builds", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should combine stats from every client compilation", async () => {
    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    const html = contents["index.html"];

    expect(html).toContain('"name": "client-a"');
    expect(html).toContain('"name": "client-b"');
    expect(html).toContain("client-a-main-");
    expect(html).toContain("client-b-main-");

    // The helper selects one compilation rather than mixing both clients.
    const { scripts } = JSON.parse(html);
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toMatch(/^\/client-a-main-[a-f0-9]+\.js$/);
  });
});
