import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import config from "./webpack.config.js";

describe("Use legacy api", () => {
  it("should render a HTML file", async () => {
    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    const contents = memoryFs.readFileSync(
      path.join(process.cwd(), "dist", "index.html"),
      "utf8",
    );
    expect(contents).toContain("Rendered with");
    expect(contents).toContain('"route": "/"');
    expect(contents).toMatchSnapshot();
  });
});
