const MemoryFS = require("memory-fs");
const webpack = require("webpack");

const config = require("./webpack.config");

function getCurrentMemoryUsage() {
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
}

describe("Render multiple times without increasing heap memory", () => {
  it("should not leak memory when memoizing webpackStats", async (done) => {
    jest.setTimeout(15 * 1000);
    const compiler = webpack(config);
    const initialMemoryUsage = getCurrentMemoryUsage();

    const memoryFs = new MemoryFS();
    compiler.outputFileSystem = memoryFs;

    compiler.run((error) => {
      if (error) {
        throw error;
      }
      const afterMemoryUsage = getCurrentMemoryUsage();
      expect(afterMemoryUsage - initialMemoryUsage).toBeLessThan(100);
      done();
    });
  });
});
