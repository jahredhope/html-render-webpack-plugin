import path from "path";
import evaluate from "eval";
import { ExtraGlobals, FileSystem } from "./common-types";

import { log } from "./logging";

function getFromSourceModules(
  specifier: string,
  fsModule: FileSystem,
  rootDir: string
) {
  const sourceModuleSpecifier = specifier.replace(/^\.\//, "");
  return fsModule.readFileSync(path.resolve(rootDir, sourceModuleSpecifier));
}

function evalutateFromFileSystem(
  specifier: string,
  fsModule: FileSystem,
  rootDir: string,
  extraGlobals: ExtraGlobals
) {
  log("Evaluating source for", specifier);
  let source;
  try {
    source = getFromSourceModules(specifier, fsModule, rootDir);
  } catch (error) {
    throw new Error(`An (S) Error reading "${specifier}". Error: ${error}`);
  }
  return evaluate(
    source,
    /* filename: */ specifier,
    /* scope: */ {
      console,
      process,
      ...(extraGlobals || {}),
      require: createLinker(specifier, fsModule, rootDir, extraGlobals),
    },
    /* includeGlobals: */ true
  );
}

function createLinker(
  parentModulePath: string,
  fsModule: FileSystem,
  rootDir: string,
  extraGlobals: ExtraGlobals
) {
  log("Creating linker for", parentModulePath);
  return function linker(specifier: string) {
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!getFromSourceModules(specifier, fsModule, rootDir)) {
      log(`Using external require for ${specifier} from ${parentModulePath}`);
      return require(specifier);
    }
    log(`Linking ${parentModulePath} to asset ${specifier}`);
    return evalutateFromFileSystem(absPath, fsModule, rootDir, extraGlobals);
  };
}

export = evalutateFromFileSystem;
