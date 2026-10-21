import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,ts}"],
    pool: "forks",
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
