import path from "node:path";
import { Volume } from "memfs";

export function createInMemoryFileSystem() {
  const memoryFs = Volume.fromJSON({});

  // Webpack expects outputFileSystem to contain its own join function
  memoryFs.join = path.join.bind(path);
  return memoryFs;
}
