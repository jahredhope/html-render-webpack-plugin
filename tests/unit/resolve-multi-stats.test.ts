import { describe, expect, it } from "vitest";

import { resolveMultiStats } from "../../src/multiStats";

class FakeMultiStats {}

describe("resolveMultiStats", () => {
  it("loads the stats-scoped path first", () => {
    const seen: string[] = [];

    const resolved = resolveMultiStats((modulePath) => {
      seen.push(modulePath);
      return FakeMultiStats;
    });

    expect(resolved).toBe(FakeMultiStats);
    expect(seen).toEqual(["webpack/lib/stats/MultiStats"]);
  });

  it("falls back to the legacy path on webpack <= 5.111", () => {
    const seen: string[] = [];

    const resolved = resolveMultiStats((modulePath) => {
      seen.push(modulePath);
      if (modulePath === "webpack/lib/stats/MultiStats") {
        throw new Error("Cannot find module");
      }
      return FakeMultiStats;
    });

    expect(resolved).toBe(FakeMultiStats);
    expect(seen).toEqual([
      "webpack/lib/stats/MultiStats",
      "webpack/lib/MultiStats",
    ]);
  });

  it("unwraps a default export", () => {
    const resolved = resolveMultiStats(() => ({ default: FakeMultiStats }));

    expect(resolved).toBe(FakeMultiStats);
  });

  it("throws a clear error when no known path resolves", () => {
    expect(() =>
      resolveMultiStats(() => {
        throw new Error("Cannot find module");
      }),
    ).toThrow(/Unable to load webpack's MultiStats class/);
  });
});
