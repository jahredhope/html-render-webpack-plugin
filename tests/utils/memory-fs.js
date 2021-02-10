const { Volume } = require("memfs");
const path = require("path");

function createInMemoryFileSystem() {
  const memoryFs = Volume.fromJSON({});

  // Webpack 4 expects outputFileSystem to contain it's own join function
  memoryFs.join = path.join.bind(path.join);
  return memoryFs;
}

module.exports = { createInMemoryFileSystem };
