import { describe, expect, it } from "vitest";

import { buildFixture } from "../../utils/build-fixture";
import config from "./webpack.errors.config.js";

describe("Errors when rendering", () => {
  it("should create an error in the compiler", async () => {
    const { stats } = await buildFixture(config);
    const errors = stats.toJson({ all: false, errors: true }).errors;

    // Render errors do not show up as build errors, they show up in the compilation
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("Example error"),
        }),
      ]),
    );
    expect(errors[0].message).toContain("html-render-webpack-plugin");
  });
});
