import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import config, { statsJsonCalls } from "./webpack.config.js";

describe("Render many routes", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render every route without serialising stats more than once", async () => {
    statsJsonCalls.count = 0;

    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    expect(memoryFs.readdirSync(renderDirectory)).toHaveLength(20_000);
    // Every route shares one memoised stats payload. If the plugin calls
    // toJson() per render, this climbs and the heap grows with route count.
    expect(statsJsonCalls.count).toBe(1);
    expect(
      memoryFs.readFileSync(
        path.join(renderDirectory, "route-0", "index.html"),
        "utf8",
      ),
    ).toContain('"name": "client"');
  });
});
