import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import config from "./webpack.config.js";

describe("Single webpack build", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async () => {
    const { stats, memoryFs } = await buildFixture(config);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["index.html"]).toContain("Rendered with");
    expect(contents["index.html"]).toContain('"route": ""');
    expect(contents).toMatchSnapshot();
  });
});
