import { describe, expect, it } from "vitest";

import type { WebpackStats } from "../../src/common-types";
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

  it("returns no scripts when the entrypoint is missing", () => {
    expect(
      getScriptUrlsFromStats({ entrypoints: {}, publicPath: "/" }, "missing"),
    ).toEqual([]);
  });
});
