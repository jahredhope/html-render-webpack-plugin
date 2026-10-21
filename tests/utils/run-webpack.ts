import type { Compiler, MultiCompiler, MultiStats, Stats } from "webpack";

type RunnableCompiler = Pick<Compiler, "run"> | Pick<MultiCompiler, "run">;

export function runWebpack(
  compiler: RunnableCompiler,
): Promise<Stats | MultiStats> {
  return new Promise((resolve, reject) => {
    // The Compiler and MultiCompiler run signatures differ only in the stats
    // type, so widening here keeps the helper usable for both.
    (compiler.run as any)((error: Error | null, stats: Stats | MultiStats) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stats);
    });
  });
}
