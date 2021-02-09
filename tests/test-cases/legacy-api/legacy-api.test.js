const { createInMemoryFileSystem } = require("../../utils/memory-fs");
const webpack = require("webpack");
const path = require("path");

const config = require("./webpack.config");

describe("Use legacy api", () => {
  it("should render a HTML file", async (done) => {
    const compiler = webpack(config);

    const memoryFs = createInMemoryFileSystem();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      expect(error).toBe(null);
      const contents = memoryFs.readFileSync(
        path.join(process.cwd(), "dist", "index.html"),
        "utf8"
      );
      expect(contents).toMatchSnapshot();
      done();
    });
  });
});
