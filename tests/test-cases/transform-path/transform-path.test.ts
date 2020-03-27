import MemoryFS from "memory-fs";
import webpack from "webpack";
import path from "path";
// @ts-ignore: Not yet typed
import getDirContentsSync from "../../utils/getDirContentsSync";

import getConfig from "./webpack.config";
import HtmlRenderPlugin from "../../../src";
import { BaseRoute } from "../../../src/common-types";

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
    })
  )
);

describe("transformFilePath", () => {
  it("should allow multiple routes with the same path", async (done) => {
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

    const memoryFs = new MemoryFS();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      // @ts-ignore: Ignore fs/memoryFs conflicts
      const contents = getDirContentsSync(renderDirectory, { fs: memoryFs });
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
