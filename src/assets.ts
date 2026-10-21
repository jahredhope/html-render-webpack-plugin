import type { WebpackStats } from "./common-types";

interface StatsAssetLike {
  name?: string;
}

export interface WebpackStatsJson {
  /** Compilation name. `MultiStats.toJson()` sets this on every child. */
  name?: string;
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
  toJson(options?: unknown): WebpackStatsJson;
}

export interface ScriptUrlOptions {
  entrypoint?: string;
  /** Compilation name. Required when several children share an entrypoint. */
  compilation?: string;
  /** Entrypoint names to omit, for example the renderer entry on an error page. */
  excludeEntrypoints?: string[];
}

function getCompilations(stats: WebpackStatsJson): WebpackStatsJson[] {
  return stats.children && stats.children.length > 0 ? stats.children : [stats];
}

function describeCompilations(compilations: WebpackStatsJson[]): string {
  const names = compilations
    .map((compilation) => compilation.name)
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : "none";
}

function selectCompilations(
  stats: WebpackStatsJson,
  entrypoint: string | undefined,
  compilation: string | undefined,
): WebpackStatsJson[] {
  const compilations = getCompilations(stats);

  if (compilation !== undefined) {
    const match = compilations.filter((child) => child.name === compilation);
    if (match.length === 0) {
      throw new Error(
        `Unable to find compilation "${compilation}" in webpack stats. Available compilations: ${describeCompilations(
          compilations,
        )}.`,
      );
    }
    return match;
  }

  if (entrypoint === undefined) {
    return compilations;
  }

  const withEntrypoint = compilations.filter(
    (child) => child.entrypoints?.[entrypoint] !== undefined,
  );
  if (withEntrypoint.length > 1) {
    const example = withEntrypoint.find((child) => child.name)?.name;
    const hint = example
      ? ` Pass a compilation name to choose one, for example getEntrypointScriptUrls(webpackStats, "${entrypoint}", "${example}").`
      : " Pass a compilation name to choose one.";
    throw new Error(
      `Entrypoint "${entrypoint}" exists in multiple compilations (${describeCompilations(
        withEntrypoint,
      )}).${hint}`,
    );
  }

  return withEntrypoint.length === 1 ? withEntrypoint : compilations;
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

function getAssetNames(
  stats: WebpackStatsJson,
  entrypoint: string | undefined,
  excludeEntrypoints: string[],
): string[] {
  const entries = Object.entries(stats.entrypoints ?? {}).filter(
    ([name]) => !excludeEntrypoints.includes(name),
  );
  const groups =
    entrypoint === undefined
      ? entries
      : entries.filter(([name]) => name === entrypoint);

  return groups
    .flatMap(([, group]) => group?.assets ?? [])
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
 * Works with single and multi-compilation stats. When more than one compilation
 * defines the entrypoint, pass `compilation` to choose between them; combining
 * several compilations' scripts is never implicit. An unknown entrypoint or
 * compilation name throws rather than returning an empty list.
 */
export function getScriptUrlsFromStats(
  stats: WebpackStatsJson,
  { entrypoint, compilation, excludeEntrypoints = [] }: ScriptUrlOptions = {},
): string[] {
  const selected = selectCompilations(stats, entrypoint, compilation);
  if (entrypoint !== undefined) {
    assertEntrypointExists(selected, entrypoint);
  }

  const urls = selected.flatMap((statsJson) => {
    const publicPath = getPublicPath(statsJson);
    return getAssetNames(statsJson, entrypoint, excludeEntrypoints).map(
      (name) => joinPublicPath(publicPath, name),
    );
  });

  return [...new Set(urls)];
}

/**
 * Get the public URLs of the JavaScript assets for an entrypoint.
 *
 * Inside `mapStatsToParams` the stats are already client-only: the plugin only
 * collects compilations that use `statsCollectorPlugin`. The stats webpack
 * passes to its build callback include every compilation, including the
 * renderer, so pass a compilation name there.
 *
 * @example
 * mapStatsToParams: ({ webpackStats }) => ({
 *   scripts: getEntrypointScriptUrls(webpackStats),
 * })
 */
export function getEntrypointScriptUrls(
  webpackStats: WebpackStats | MultiStatsLike,
  entrypoint = "main",
  compilation?: string,
): string[] {
  const statsJson = webpackStats.toJson({
    all: false,
    entrypoints: true,
    publicPath: true,
  });

  return getScriptUrlsFromStats(statsJson as WebpackStatsJson, {
    entrypoint,
    compilation,
  });
}
