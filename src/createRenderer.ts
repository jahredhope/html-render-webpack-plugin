import evaluateFromFileSystem from "./evaluateFromFileSystem";
import { FileSystem, ExtraGlobals } from "./common-types";

export = function createRenderer({
  fileName,
  fileSystem,
  rootDir,
  extraGlobals,
}: {
  fileName: string;
  fileSystem: FileSystem;
  extraGlobals: ExtraGlobals;
  rootDir: string;
}) {
  if (!fileName) {
    throw new Error("Missing filename");
  }
  if (!fileSystem) {
    throw new Error("Missing source");
  }
  if (!rootDir || typeof rootDir !== "string") {
    throw new Error(`Recieved rootDir as ${typeof rootDir}`);
  }
  return evaluateFromFileSystem(fileName, fileSystem, rootDir, extraGlobals);
};
