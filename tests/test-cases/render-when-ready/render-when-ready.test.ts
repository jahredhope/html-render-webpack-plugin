import { describe, expect, it } from "vitest";

import HtmlRenderPlugin from "../../../src";
import type { BaseRoute } from "../../../src/common-types";
import { buildFixture } from "../../utils/build-fixture";
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

    await buildFixture(getConfig(htmlRenderPlugin));

    const html = await promise;
    expect(html).toContain('"route": "/new"');
    expect(html).toMatchSnapshot();
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

    await buildFixture(getConfig(htmlRenderPlugin));
    await rejection;
  });
});
