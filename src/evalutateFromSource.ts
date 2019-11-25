import path from "path";
import evaluate from "eval";
import { SourceModules, ExtraGlobals } from "common-types";

import { log } from "./logging";

function getFromSourceModules(specifier: string, sourceModules: SourceModules) {
  const sourceModuleSpecifier = specifier.replace(/^\.\//, "");
  return sourceModules[sourceModuleSpecifier];
}

function evalutateFromSource(
  specifier: string,
  sourceModules: SourceModules,
  extraGlobals: ExtraGlobals
) {
  log("Evaluating source for", specifier);
  let source;
  try {
    source = getFromSourceModules(specifier, sourceModules);
  } catch (error) {
    throw new Error(`Error reading "${specifier}". Error: ${error}`);
  }
  return evaluate(
    source,
    /* filename: */ specifier,
    /* scope: */ {
      console,
      process,
      ...(extraGlobals || {}),
      require: createLinker(specifier, sourceModules, extraGlobals)
    },
    /* includeGlobals: */ true
  );
}

function createLinker(
  parentModulePath: string,
  sourceModules: SourceModules,
  extraGlobals: ExtraGlobals
) {
  log("Creating linker for", parentModulePath);
  return function linker(specifier: string) {
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!getFromSourceModules(specifier, sourceModules)) {
      log(`Using external require for ${specifier} from ${parentModulePath}`);
      return require(specifier);
    }
    log(`Linking ${parentModulePath} to asset ${specifier}`);
    return evalutateFromSource(absPath, sourceModules, extraGlobals);
  };
}

export = evalutateFromSource;
