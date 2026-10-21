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
  /** Present on the object returned by `MultiStats.toJson()`. */
  children?: WebpackStatsJson[];
}

/**
 * The parts of `webpack.MultiStats` this module uses. webpack does not export a
 * public type for `MultiStats`.
 */
export interface MultiStatsLike {
  toJson(options?: unknown): WebpackStatsJson | WebpackStatsJson[];
}

type StatsJsonInput = WebpackStatsJson | WebpackStatsJson[];

function getStatsList(stats: StatsJsonInput): WebpackStatsJson[] {
  if (Array.isArray(stats)) {
    return stats;
  }
  if (stats.children && stats.children.length > 0) {
    return stats.children;
  }
  return [stats];
}

function getAssetName(asset: string | StatsAssetLike): string | undefined {
  return typeof asset === "string" ? asset : asset.name;
}

function getPublicPath(stats: WebpackStatsJson): string {
  return typeof stats.publicPath === "string" && stats.publicPath !== "auto"
    ? stats.publicPath
    : "/";
}

function joinPublicPath(publicPath: string, assetName: string): string {
  const base =
    publicPath === "" || publicPath.endsWith("/")
      ? publicPath
      : `${publicPath}/`;
  return `${base}${assetName.replace(/^\/+/, "")}`;
}

function getAssetNames(stats: WebpackStatsJson, entrypoint?: string): string[] {
  const entrypoints = stats.entrypoints ?? {};
  const groups =
    entrypoint === undefined
      ? Object.values(entrypoints)
      : [entrypoints[entrypoint]];

  return groups
    .flatMap((group) => group?.assets ?? [])
    .map(getAssetName)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.endsWith(".js"),
    );
}

function assertEntrypointExists(
  statsList: WebpackStatsJson[],
  entrypoint: string,
) {
  const available = new Set(
    statsList.flatMap((stats) => Object.keys(stats.entrypoints ?? {})),
  );
  if (!available.has(entrypoint)) {
    const known = available.size > 0 ? [...available].join(", ") : "none";
    throw new Error(
      `Unable to find entrypoint "${entrypoint}" in webpack stats. Available entrypoints: ${known}.`,
    );
  }
}

/**
 * Get the public URLs of the JavaScript assets for one entrypoint.
 *
 * Accepts a single stats JSON object or an array of them. The object returned
 * by `MultiStats.toJson()` for builds with more than one client compilation is
 * supported through its `children` array.
 *
 * Pass `undefined` as the entrypoint to collect scripts from every entrypoint,
 * which is useful for an error page that does not know which client entry failed.
 * An unknown entrypoint name throws rather than returning an empty list.
 */
export function getScriptUrlsFromStats(
  stats: StatsJsonInput,
  entrypoint?: string,
): string[] {
  const statsList = getStatsList(stats);
  if (entrypoint !== undefined) {
    assertEntrypointExists(statsList, entrypoint);
  }

  const urls = statsList.flatMap((statsJson) => {
    const publicPath = getPublicPath(statsJson);
    return getAssetNames(statsJson, entrypoint).map((name) =>
      joinPublicPath(publicPath, name),
    );
  });

  return [...new Set(urls)];
}

/**
 * Get the public URLs of the JavaScript assets for an entrypoint.
 *
 * This is the common bridge from client stats to a renderer: the renderer can
 * emit script tags without receiving the whole webpack stats object. It works
 * for a single client compilation and for multiple client compilations.
 *
 * @example
 * mapStatsToParams: ({ webpackStats }) => ({
 *   scripts: getEntrypointScriptUrls(webpackStats, "main"),
 * })
 */
export function getEntrypointScriptUrls(
  webpackStats: WebpackStats | MultiStatsLike,
  entrypoint = "main",
): string[] {
  const statsJson = webpackStats.toJson({
    all: false,
    entrypoints: true,
    publicPath: true,
  });

  return getScriptUrlsFromStats(statsJson as StatsJsonInput, entrypoint);
}
