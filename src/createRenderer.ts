import evalutateFromFileSystem from "./evalutateFromFileSystem";
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
  return evalutateFromFileSystem(fileName, fileSystem, rootDir, extraGlobals);
};
