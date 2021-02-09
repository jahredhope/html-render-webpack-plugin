import webpack from "webpack";

import config from "./webpack.config";
import HtmlRenderPlugin from "../../../src";
import { BaseRoute } from "../../../src/common-types";
import { createInMemoryFileSystem } from "../../utils/memory-fs";

describe("renderWhenReady", () => {
  interface Route extends BaseRoute {
    route: string;
    language: string;
    forceError?: boolean;
  }

  it("should render a HTML once resolved", async (done) => {
    const routes: Route[] = [{ route: "/", language: "en-au" }];
    const htmlRenderPlugin = new HtmlRenderPlugin<Route>({
      mapStatsToParams: () => ({}),
      skipAssets: true,
      routes,
    });

    const promise = htmlRenderPlugin.renderWhenReady({
      route: "/new",
      language: "en-us",
    });

    const compiler = webpack(config(htmlRenderPlugin));

    const memoryFs = createInMemoryFileSystem();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    compiler.run(async () => {
      await expect(promise).resolves.toMatchSnapshot();
      done();
    });
  });

  it("should contain webpackStats when render errors", async (done) => {
    const routes: Route[] = [{ route: "/", language: "en-au" }];
    const htmlRenderPlugin = new HtmlRenderPlugin<Route>({
      mapStatsToParams: () => ({}),
      skipAssets: true,
      routes,
    });

    const promise = htmlRenderPlugin.renderWhenReady({
      route: "/new",
      language: "en-us",
      forceError: true,
    });

    const compiler = webpack(config(htmlRenderPlugin));

    const memoryFs = createInMemoryFileSystem();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    compiler.run(async () => {
      await expect(promise).rejects.toEqual(
        expect.objectContaining({ webpackStats: expect.any(Object) })
      );
      done();
    });
  });
});
