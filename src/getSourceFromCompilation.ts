import { compilation } from "webpack";
import { SourceModules } from "./common-types";

export = function getSourceFromCompilation(comp: compilation.Compilation) {
  const files: SourceModules = {};
  Object.entries(comp.assets).forEach(([assetName, asset]) => {
    // @ts-ignore
    files[assetName] = asset.source();
  });
  return files;
};
