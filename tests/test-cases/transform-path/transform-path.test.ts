import path from "node:path";
import { describe, expect, it } from "vitest";
import webpack from "webpack";

import HtmlRenderPlugin from "../../../src";
import { BaseRoute } from "../../../src/common-types";
import getDirContentsSync from "../../utils/getDirContentsSync";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
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
    const config = getConfig(htmlRenderPlugin);
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    const stats = await runWebpack(compiler);

    expect(stats?.hasErrors()).toBe(false);
    const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
    expect(contents).toMatchSnapshot();
  });
});
