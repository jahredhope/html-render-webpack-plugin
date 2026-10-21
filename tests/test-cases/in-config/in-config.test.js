import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import directoryConfig from "./webpack.directory.config.js";
import pathsConfig from "./webpack.paths.config.js";
import routeInfoConfig from "./webpack.route-info.config.js";
import routesConfig from "./webpack.routes.config.js";
import zeroConfig from "./webpack.zero-config.config.js";

describe("Render HTML from in-config Plugin", () => {
  const renderDirectory = path.join(process.cwd(), "dist", "render");

  it("should render a HTML file", async () => {
    const { stats, memoryFs } = await buildFixture(zeroConfig);

    expect(stats.hasErrors()).toBe(false);
    const contents = memoryFs.readFileSync(
      path.join(process.cwd(), "dist", "index.html"),
      "utf8",
    );
    expect(contents).toContain("Rendered with");
    expect(contents).toMatchSnapshot();
  });

  it("should render in a custom directory", async () => {
    const { stats, memoryFs } = await buildFixture(directoryConfig);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["index.html"]).toContain("Rendered with");
    expect(contents).toMatchSnapshot();
  });

  it("should render a file per route", async () => {
    const { stats, memoryFs } = await buildFixture(routesConfig);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents["pageA"]["index.html"]).toContain('"route": "pageA"');
    expect(contents["pageB"]["index.html"]).toContain('"route": "pageB"');
    // Routes ending in ".html" are written as files rather than directories.
    expect(contents["error.html"]).toContain('"route": "error.html"');
    expect(contents).toMatchSnapshot();
  });

  it("should render routes with extra information", async () => {
    const { stats, memoryFs } = await buildFixture(routeInfoConfig);

    expect(stats.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents.production["index.html"]).toContain(
      '"environment": "production"',
    );
    expect(contents).toMatchSnapshot();
  });

  it("should allow custom file paths", async () => {
    const { stats, memoryFs } = await buildFixture(pathsConfig);

    expect(stats.hasErrors()).toBe(false);
    expect(
      memoryFs.existsSync(
        path.join(renderDirectory, "/production/en-us/about/us/index.html"),
      ),
    ).toBe(true);
    expect(
      memoryFs.existsSync(
        path.join(renderDirectory, "/development/en-au/about/us/index.html"),
      ),
    ).toBe(true);
    expect(
      memoryFs.existsSync(path.join(renderDirectory, "/about/us/index.html")),
    ).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents.production["en-us"].about.us["index.html"]).toContain(
      '"route": "about/us"',
    );
    expect(contents).toMatchSnapshot();
  });
});
