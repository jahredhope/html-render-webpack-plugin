import { describe, expect, it } from "vitest";

import type { WebpackStats } from "../../src/common-types";
import type { MultiStatsLike } from "../../src/assets";
import {
  getEntrypointScriptUrls,
  getScriptUrlsFromStats,
} from "../../src/assets";

describe("getEntrypointScriptUrls", () => {
  it("returns public URLs for hashed JavaScript assets", () => {
    const webpackStats = {
      toJson: () => ({
        entrypoints: {
          main: {
            assets: [{ name: "assets/main.abc123.js" }, { name: "main.css" }],
          },
        },
        publicPath: "/",
      }),
    } as unknown as WebpackStats;

    expect(getEntrypointScriptUrls(webpackStats)).toEqual([
      "/assets/main.abc123.js",
    ]);
  });

  it("supports custom entrypoints, string assets and a public path", () => {
    const webpackStats = {
      toJson: () => ({
        entrypoints: {
          app: {
            assets: ["app.abc123.js", { name: "app.css" }],
          },
        },
        publicPath: "/static/",
      }),
    } as unknown as WebpackStats;

    expect(getEntrypointScriptUrls(webpackStats, "app")).toEqual([
      "/static/app.abc123.js",
    ]);
  });

  it("collects every entrypoint when no entrypoint is passed", () => {
    expect(
      getScriptUrlsFromStats({
        entrypoints: {
          main: { assets: [{ name: "main.js" }] },
          admin: { assets: [{ name: "admin.js" }, { name: "admin.css" }] },
        },
        publicPath: "/",
      }),
    ).toEqual(["/main.js", "/admin.js"]);
  });

  it("deduplicates shared assets and falls back to the root public path", () => {
    expect(
      getScriptUrlsFromStats({
        entrypoints: {
          main: { assets: [{ name: "runtime.js" }, { name: "main.js" }] },
          admin: { assets: [{ name: "runtime.js" }, { name: "admin.js" }] },
        },
        publicPath: "auto",
      }),
    ).toEqual(["/runtime.js", "/main.js", "/admin.js"]);
  });

  it("joins a public path that has no trailing slash", () => {
    expect(
      getScriptUrlsFromStats(
        {
          entrypoints: { main: { assets: [{ name: "assets/main.js" }] } },
          publicPath: "/static",
        },
        "main",
      ),
    ).toEqual(["/static/assets/main.js"]);
  });

  it("joins a fully qualified public path", () => {
    expect(
      getScriptUrlsFromStats(
        {
          entrypoints: { main: { assets: [{ name: "assets/main.js" }] } },
          publicPath: "https://cdn.example.com/static",
        },
        "main",
      ),
    ).toEqual(["https://cdn.example.com/static/assets/main.js"]);
  });

  it("collects scripts from every stats object in a multi-compilation build", () => {
    const webpackStats = {
      toJson: () => ({
        children: [
          {
            entrypoints: {
              main: {
                assets: [{ name: "runtime.js" }, { name: "client-a.js" }],
              },
            },
            publicPath: "/",
          },
          {
            entrypoints: {
              main: {
                assets: [{ name: "runtime.js" }, { name: "client-b.js" }],
              },
            },
            publicPath: "/",
          },
        ],
      }),
    } as MultiStatsLike;

    expect(getEntrypointScriptUrls(webpackStats)).toEqual([
      "/runtime.js",
      "/client-a.js",
      "/client-b.js",
    ]);
  });

  it("uses each compilation's public path in a multi-compilation build", () => {
    expect(
      getScriptUrlsFromStats(
        {
          children: [
            {
              entrypoints: { main: { assets: [{ name: "main.js" }] } },
              publicPath: "/",
            },
            {
              entrypoints: { main: { assets: [{ name: "main.js" }] } },
              publicPath: "https://cdn.example.com/",
            },
          ],
        },
        "main",
      ),
    ).toEqual(["/main.js", "https://cdn.example.com/main.js"]);
  });

  it("throws when the entrypoint is missing", () => {
    expect(() =>
      getScriptUrlsFromStats({ entrypoints: {}, publicPath: "/" }, "missing"),
    ).toThrowError(
      'Unable to find entrypoint "missing" in webpack stats. Available entrypoints: none.',
    );
  });

  it("lists the available entrypoints in the error", () => {
    expect(() =>
      getScriptUrlsFromStats(
        { entrypoints: { app: { assets: [] } }, publicPath: "/" },
        "main",
      ),
    ).toThrowError("Available entrypoints: app.");
  });

  it("accepts an entrypoint that only exists in one compilation", () => {
    expect(
      getScriptUrlsFromStats(
        [
          { entrypoints: { main: { assets: [{ name: "main.js" }] } } },
          { entrypoints: { admin: { assets: [{ name: "admin.js" }] } } },
        ],
        "admin",
      ),
    ).toEqual(["/admin.js"]);
  });
});
