import { describe, expect, it } from "vitest";
import webpack from "webpack";

import { createInMemoryFileSystem } from "../../utils/memory-fs";
import { runWebpack } from "../../utils/run-webpack";
import config from "./webpack.config.js";

function getCurrentMemoryUsageInMB() {
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
}

describe("Render multiple times without increasing heap memory", () => {
  it("should not leak memory when memoizing webpackStats", async () => {
    const compiler = webpack(config);
    const initialMemoryUsage = getCurrentMemoryUsageInMB();

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    const stats = await runWebpack(compiler);

    expect(stats.hasErrors()).toBe(false);
    const afterMemoryUsage = getCurrentMemoryUsageInMB();
    expect(afterMemoryUsage - initialMemoryUsage).toBeLessThan(150);
  });
});
