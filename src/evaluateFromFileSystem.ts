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
  if (!fsModule.existsSync(path.resolve(rootDir, sourceModuleSpecifier))) {
    log(
      `Unable to find file specifier ${sourceModuleSpecifier}. Root: ${rootDir}.`
    );
    return undefined;
  }
  return fsModule.readFileSync(path.resolve(rootDir, sourceModuleSpecifier));
}

function evaluateFromFileSystem(
  specifier: string,
  fsModule: FileSystem,
  rootDir: string,
  extraGlobals: ExtraGlobals
) {
  log(
    `Evaluating source for ${specifier}". From root directory: "${rootDir}".`
  );
  let source;
  try {
    source = getFromSourceModules(specifier, fsModule, rootDir);
  } catch (error) {
    throw new Error(`An error reading "${specifier}". Error: ${error}`);
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
    return evaluateFromFileSystem(absPath, fsModule, rootDir, extraGlobals);
  };
}

export = evaluateFromFileSystem;
