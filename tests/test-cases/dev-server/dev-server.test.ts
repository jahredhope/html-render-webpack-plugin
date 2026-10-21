import { once } from "node:events";
import path from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { describe, expect, it } from "vitest";

import HtmlRenderPlugin from "../../../src";
import type { BaseRoute } from "../../../src/common-types";
import { buildFixture } from "../../utils/build-fixture";
import getConfig from "./webpack.config";

interface Route extends BaseRoute {
  route: string;
  forceError?: boolean;
}

async function startServer(plugin: HtmlRenderPlugin<Route>) {
  const app = express();
  app.use(plugin.createDevRouter());

  const server: Server = app.listen(0);
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve());
      }),
  };
}

function fetchRoute(baseUrl: string, path: string) {
  return fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(5_000) });
}

describe("dev-server", () => {
  it("renders routes on demand without writing static files", async () => {
    const routes: Route[] = [{ route: "/" }, { route: "/about" }];
    const plugin = new HtmlRenderPlugin<Route>({ routes, skipAssets: true });
    const { memoryFs } = await buildFixture(getConfig(plugin));

    expect(
      memoryFs.existsSync(path.join(process.cwd(), "dist", "render")),
    ).toBe(false);

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/about");

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("route:/about");
    } finally {
      await server.close();
    }
  });

  it("uses getRouteFromRequest to pick a route", async () => {
    const routes: Route[] = [{ route: "/a" }, { route: "/b" }];
    const plugin = new HtmlRenderPlugin<Route>({
      routes,
      skipAssets: true,
      getRouteFromRequest: (_req, availableRoutes) =>
        availableRoutes.find((route) => route.route === "/b")!,
    });
    await buildFixture(getConfig(plugin));

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/a");

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("route:/b");
    } finally {
      await server.close();
    }
  });

  it("serves routes at custom express paths", async () => {
    const routes: Route[] = [{ route: "/about" }];
    const plugin = new HtmlRenderPlugin<Route>({
      routes,
      skipAssets: true,
      transformExpressPath: (route) => `/static${route.route}`,
    });
    await buildFixture(getConfig(plugin));

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/static/about");

      expect(response.status).toBe(200);
      expect(await response.text()).toContain("route:/about");

      const missing = await fetchRoute(server.baseUrl, "/about");
      expect(missing.status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it("returns a 500 with dev server scripts when rendering fails", async () => {
    const routes: Route[] = [
      { route: "/" },
      { route: "/error", forceError: true },
    ];
    const plugin = new HtmlRenderPlugin<Route>({ routes, skipAssets: true });
    await buildFixture(getConfig(plugin));

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/error");
      const body = await response.text();

      expect(response.status).toBe(500);
      expect(body).toContain("Dev server render error");
      expect(body).toContain('<script src="/client-main-');
    } finally {
      await server.close();
    }
  });

  it("falls through when getRouteFromRequest returns no route", async () => {
    const routes: Route[] = [{ route: "/" }];
    const plugin = new HtmlRenderPlugin<Route>({
      routes,
      skipAssets: true,
      getRouteFromRequest: () => undefined as unknown as Route,
    });
    await buildFixture(getConfig(plugin));

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/");

      expect(response.status).toBe(404);
    } finally {
      await server.close();
    }
  });

  it("rejects routes that are not part of the configured routes", async () => {
    const routes: Route[] = [{ route: "/" }];
    const plugin = new HtmlRenderPlugin<Route>({
      routes,
      skipAssets: true,
      getRouteFromRequest: () => ({ route: "/unknown" }),
    });
    await buildFixture(getConfig(plugin));

    const server = await startServer(plugin);
    try {
      const response = await fetchRoute(server.baseUrl, "/");
      const body = await response.text();

      expect(response.status).toBe(500);
      expect(body).toContain(
        "Returned route was not an existing route. Ensure return value from getRouteFromRequest is route",
      );
    } finally {
      await server.close();
    }
  });
});
