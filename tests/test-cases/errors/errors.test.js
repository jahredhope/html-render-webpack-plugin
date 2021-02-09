const { createInMemoryFileSystem } = require("../../utils/memory-fs");
const webpack = require("webpack");
const path = require("path");

describe("Errors when rendering", () => {
  it("should create an error in the compiler", async (done) => {
    const compiler = webpack(require("./webpack.errors.config"));

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error, result) => {
      // Render errors do not show up as build errors
      expect(error).toBe(null);
      // Errors show up in compilation
      expect(result.toJson({ all: false, errors: true }).errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("Example error"),
          }),
        ])
      );
      done();
    });
  });
});
