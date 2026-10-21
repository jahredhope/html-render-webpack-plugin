import { describe, expect, it } from "vitest";

import type { WebpackStats } from "../../src/common-types";
import type { MultiStatsLike } from "../../src/assets";
import {
  getEntrypointScriptUrls,
  getScriptUrlsFromStats,
} from "../../src/assets";

const singleStats = (
  assets: Array<string | { name: string }>,
  publicPath = "/",
) => ({
  entrypoints: { main: { assets } },
  publicPath,
});

describe("getEntrypointScriptUrls", () => {
  it("returns public URLs for hashed JavaScript assets", () => {
    const webpackStats = {
      toJson: () =>
        singleStats([{ name: "assets/main.abc123.js" }, { name: "main.css" }]),
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
        singleStats([{ name: "assets/main.js" }], "/static"),
        {
          entrypoint: "main",
        },
      ),
    ).toEqual(["/static/assets/main.js"]);
  });

  it("joins a fully qualified public path", () => {
    expect(
      getScriptUrlsFromStats(
        singleStats([{ name: "assets/main.js" }], "https://cdn.example.com/x"),
        { entrypoint: "main" },
      ),
    ).toEqual(["https://cdn.example.com/x/assets/main.js"]);
  });

  it("throws instead of combining compilations that share an entrypoint", () => {
    expect(() =>
      getScriptUrlsFromStats(
        {
          children: [
            {
              name: "client-a",
              entrypoints: { main: { assets: [{ name: "runtime.js" }] } },
              publicPath: "/",
            },
            {
              name: "client-b",
              entrypoints: { main: { assets: [{ name: "runtime.js" }] } },
              publicPath: "/",
            },
          ],
        },
        { entrypoint: "main" },
      ),
    ).toThrowError(
      'Entrypoint "main" exists in multiple compilations (client-a, client-b). Pass a compilation name to choose one, for example getEntrypointScriptUrls(webpackStats, "main", "client-a").',
    );
  });

  it("selects one compilation by name", () => {
    const webpackStats: MultiStatsLike = {
      toJson: () => ({
        children: [
          {
            name: "client",
            entrypoints: {
              main: { assets: [{ name: "runtime.js" }, { name: "client.js" }] },
            },
            publicPath: "/",
          },
          {
            name: "render",
            entrypoints: { main: { assets: [{ name: "render.js" }] } },
            publicPath: "",
          },
        ],
      }),
    };

    expect(getEntrypointScriptUrls(webpackStats, "main", "client")).toEqual([
      "/runtime.js",
      "/client.js",
    ]);
  });

  it("throws for an unknown compilation and lists the available ones", () => {
    expect(() =>
      getScriptUrlsFromStats(
        {
          children: [
            { name: "client", entrypoints: { main: { assets: [] } } },
            { name: "render", entrypoints: { main: { assets: [] } } },
          ],
        },
        { entrypoint: "main", compilation: "missing" },
      ),
    ).toThrowError(
      'Unable to find compilation "missing" in webpack stats. Available compilations: client, render.',
    );
  });

  it("rejects a compilation name for single-compilation stats", () => {
    expect(() =>
      getScriptUrlsFromStats(singleStats([{ name: "main.js" }]), {
        entrypoint: "main",
        compilation: "client",
      }),
    ).toThrowError("Available compilations: none.");
  });

  it("does not require a compilation name when only one compilation has the entrypoint", () => {
    expect(
      getScriptUrlsFromStats(
        {
          children: [
            {
              name: "client",
              entrypoints: { main: { assets: [{ name: "client.js" }] } },
              publicPath: "/",
            },
            {
              name: "render",
              entrypoints: { server: { assets: [{ name: "render.js" }] } },
              publicPath: "",
            },
          ],
        },
        { entrypoint: "main" },
      ),
    ).toEqual(["/client.js"]);
  });

  it("uses each compilation's public path", () => {
    expect(
      getScriptUrlsFromStats(
        {
          children: [
            {
              name: "client",
              entrypoints: { main: { assets: [{ name: "main.js" }] } },
              publicPath: "https://cdn.example.com/",
            },
          ],
        },
        { entrypoint: "main" },
      ),
    ).toEqual(["https://cdn.example.com/main.js"]);
  });

  it("omits excluded entrypoints", () => {
    expect(
      getScriptUrlsFromStats(
        {
          entrypoints: {
            main: { assets: [{ name: "render-main.js" }] },
            vendor: { assets: [{ name: "vendor.js" }] },
          },
          publicPath: "/",
        },
        { excludeEntrypoints: ["main"] },
      ),
    ).toEqual(["/vendor.js"]);
  });

  it("throws when the entrypoint is missing", () => {
    expect(() =>
      getScriptUrlsFromStats(
        { entrypoints: {}, publicPath: "/" },
        { entrypoint: "missing" },
      ),
    ).toThrowError(
      'Unable to find entrypoint "missing" in webpack stats. Available entrypoints: none.',
    );
  });

  it("lists the available entrypoints in the error", () => {
    expect(() =>
      getScriptUrlsFromStats(
        { entrypoints: { app: { assets: [] } }, publicPath: "/" },
        { entrypoint: "main" },
      ),
    ).toThrowError("Available entrypoints: app.");
  });
});
