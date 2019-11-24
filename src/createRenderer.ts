import path from "path";
// @ts-ignore: No types available
import evaluate from "eval";
import { compilation } from "webpack";

import { Specifier, ExtraGlobals } from "./common-types";

function fileExistsInCompilation(
  specifier: Specifier,
  compilation: compilation.Compilation
) {
  const fileName = path.basename(specifier);
  return Boolean(compilation.assets[fileName]);
}

function getFileSourceFromCompilation(
  specifier: Specifier,
  compilation: compilation.Compilation
) {
  const fileName = path.basename(specifier);
  const asset = compilation.assets[fileName];
  return asset.source();
}

function evalutateFromSource(
  specifier: Specifier,
  compilation: compilation.Compilation,
  extraGlobals: ExtraGlobals
) {
  let source;
  try {
    source = getFileSourceFromCompilation(specifier, compilation);
  } catch (error) {
    throw new Error(`Error reading "${specifier}". Error: ${error}`);
  }
  return evaluate(
    source,
    /* filename: */ specifier,
    /* scope: */ {
      require: createLinker(specifier, compilation, extraGlobals),
      console,
      ...extraGlobals
    },
    /* includeGlobals: */ true
  );
}

function createLinker(
  parentModulePath: Specifier,
  compilation: compilation.Compilation,
  extraGlobals: ExtraGlobals
) {
  return function linker(specifier: Specifier) {
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!fileExistsInCompilation(specifier, compilation)) {
      return require(specifier);
    }
    return evalutateFromSource(absPath, compilation, extraGlobals);
  };
}

export default function createRenderer({
  fileName,
  renderCompilation,
  extraGlobals
}: {
  fileName: string;
  renderCompilation: compilation.Compilation;
  extraGlobals: ExtraGlobals;
}) {
  return evalutateFromSource(fileName, renderCompilation, extraGlobals);
}
