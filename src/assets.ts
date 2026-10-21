import type { WebpackStats } from "./common-types";

interface StatsAssetLike {
  name?: string;
}

export interface WebpackStatsJson {
  entrypoints?: Record<
    string,
    { assets?: Array<string | StatsAssetLike> } | undefined
  >;
  publicPath?: string;
}

function getAssetName(asset: string | StatsAssetLike): string | undefined {
  return typeof asset === "string" ? asset : asset.name;
}

/**
 * Get the public URLs of the JavaScript assets for one entrypoint.
 *
 * Pass `undefined` to collect scripts from every entrypoint, which is useful
 * for an error page that does not know which client entry failed.
 */
export function getScriptUrlsFromStats(
  stats: WebpackStatsJson,
  entrypoint?: string,
): string[] {
  const entrypoints = stats.entrypoints ?? {};
  const groups =
    entrypoint === undefined
      ? Object.values(entrypoints)
      : [entrypoints[entrypoint]];

  const names = groups
    .flatMap((group) => group?.assets ?? [])
    .map(getAssetName)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.endsWith(".js"),
    );

  const publicPath =
    typeof stats.publicPath === "string" && stats.publicPath !== "auto"
      ? stats.publicPath
      : "/";

  return [...new Set(names)].map((name) => `${publicPath}${name}`);
}

/**
 * Get the public URLs of the JavaScript assets for an entrypoint.
 *
 * This is the common bridge from client stats to a renderer: the renderer can
 * emit script tags without receiving the whole webpack stats object.
 *
 * @example
 * mapStatsToParams: ({ webpackStats }) => ({
 *   scripts: getEntrypointScriptUrls(webpackStats, "main"),
 * })
 */
export function getEntrypointScriptUrls(
  webpackStats: WebpackStats,
  entrypoint = "main",
): string[] {
  return getScriptUrlsFromStats(
    webpackStats.toJson({
      all: false,
      entrypoints: true,
      publicPath: true,
    }),
    entrypoint,
  );
}
