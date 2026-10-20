import { describe, expect, it } from "vitest";
import webpack from "webpack";

import HtmlRenderPlugin from "../../../src";
import { BaseRoute } from "../../../src/common-types";
import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import getConfig from "./webpack.config";

describe("renderWhenReady", () => {
  interface Route extends BaseRoute {
    route: string;
    language: string;
    forceError?: boolean;
  }

  it("should render a HTML once resolved", async () => {
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
    const resolution = expect(promise).resolves.toMatchSnapshot();

    const compiler = webpack(getConfig(htmlRenderPlugin));

    const memoryFs = createInMemoryFileSystem();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);
    await resolution;
  });

  it("should contain webpackStats when render errors", async () => {
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
    const rejection = expect(promise).rejects.toEqual(
      expect.objectContaining({
        route: "/new",
        webpackStats: expect.any(Object),
      }),
    );

    const compiler = webpack(getConfig(htmlRenderPlugin));

    const memoryFs = createInMemoryFileSystem();
    // @ts-ignore: Yes outputFileSystem does exist on MultiCompiler
    compiler.outputFileSystem = memoryFs;

    await runWebpack(compiler);
    await rejection;
  });
});
