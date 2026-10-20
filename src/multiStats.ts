import type { Stats } from "webpack";
import type { WebpackStats } from "./common-types";

type LoadModule = (id: string) => unknown;
type MultiStatsConstructor = new (stats: Stats[]) => WebpackStats;

// webpack 5.112 moved MultiStats from lib/ to lib/stats/. Both are private
// paths, so load whichever one exists instead of pinning to a single release.
const MULTI_STATS_MODULE_PATHS = [
  "webpack/lib/stats/MultiStats", // webpack >= 5.112.0
  "webpack/lib/MultiStats", // webpack <= 5.111.x
];

function getWebpackVersion(loadModule: LoadModule) {
  try {
    return (loadModule("webpack/package.json") as { version: string }).version;
  } catch {
    return "unknown";
  }
}

export function resolveMultiStats(
  loadModule: LoadModule = require
): MultiStatsConstructor {
  const failures: string[] = [];

  for (const modulePath of MULTI_STATS_MODULE_PATHS) {
    try {
      const loaded = loadModule(modulePath) as
        | MultiStatsConstructor
        | { default: MultiStatsConstructor };

      return (
        (loaded as { default?: MultiStatsConstructor }).default ??
        (loaded as MultiStatsConstructor)
      );
    } catch (error) {
      failures.push(
        `${modulePath}: ${error instanceof Error ? error.message : error}`
      );
    }
  }

  throw new Error(
    `Unable to load webpack's MultiStats class. Installed webpack: ${getWebpackVersion(
      loadModule
    )}. Tried ${failures.join(", ")}.`
  );
}
