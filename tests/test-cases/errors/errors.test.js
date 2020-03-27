const MemoryFS = require("memory-fs");
const webpack = require("webpack");

describe("Render HTML from in-config Plugin", () => {
  it("should render a HTML file", async (done) => {
    const compiler = webpack(require("./webpack.errors.config"));

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error, result) => {
      // Render errors do not show up as build errors
      expect(error).toBe(null);
      // Errors show up in compilation
      expect(result.toJson({ all: false, errors: true }).errors).toEqual(
        expect.arrayContaining([expect.stringContaining("Example error")])
      );
      done();
    });
  });
});
