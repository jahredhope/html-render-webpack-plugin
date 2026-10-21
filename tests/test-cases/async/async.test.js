import path from "node:path";
import { describe, expect, it } from "vitest";

import HtmlRenderPlugin from "../../../src";
import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import getConfig from "./webpack.config.js";

describe("Render asynchronously", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML once resolved", async () => {
    const { stats, memoryFs } = await buildFixture(
      getConfig(
        new HtmlRenderPlugin({ mapStatsToParams: () => ({}), renderDirectory }),
      ),
    );

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["index.html"]).toContain("Rendered with");
    expect(contents).toMatchSnapshot();
  });

  it("should render a multiple files at once", async () => {
    const { stats, memoryFs } = await buildFixture(
      getConfig(
        new HtmlRenderPlugin({
          mapStatsToParams: () => ({}),
          renderConcurrency: "parallel",
          routes: new Array(20).fill(null).map((_, i) => `page${i}`),
          renderDirectory,
        }),
      ),
    );

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(Object.keys(contents)).toHaveLength(20);
    expect(contents.page3["index.html"]).toContain('"route": "page3"');
    expect(contents).toMatchSnapshot();
  });
});
