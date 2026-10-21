import path from "node:path";
import { describe, expect, it } from "vitest";

import HtmlRenderPlugin from "../../../src";
import type { BaseRoute } from "../../../src/common-types";
import { buildFixture } from "../../utils/build-fixture";
import getDirContentsSync from "../../utils/getDirContentsSync";
import getConfig from "./webpack.config";

interface Route extends BaseRoute {
  route: string;
  site: string;
  language: string;
}

const paths = ["/", "/book", "/books"];
const sites = ["us", "global"];
const languages = ["en-us", "en-gb", "en-au"];

const routes: Route[] = [];
languages.forEach((language) =>
  sites.forEach((site) =>
    paths.forEach((pathName) => {
      routes.push({ route: pathName, site, language });
    }),
  ),
);

describe("transformFilePath", () => {
  it("should allow multiple routes with the same path", async () => {
    const renderDirectory = path.join(process.cwd(), "dist", "render");
    const htmlRenderPlugin = new HtmlRenderPlugin<Route>({
      mapStatsToParams: () => ({}),
      routes,
      renderDirectory,
      transformFilePath: (route) =>
        `/${route.site}/${route.language}/${route.route}`,
    });

    const { stats, memoryFs } = await buildFixture(getConfig(htmlRenderPlugin));

    expect(stats?.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, {
      fs: memoryFs,
    }) as any;
    expect(contents.us["en-us"]["index.html"]).toContain('"site": "us"');
    expect(Object.keys(contents).sort()).toEqual(["global", "us"]);
    expect(contents).toMatchSnapshot();
  });
});
