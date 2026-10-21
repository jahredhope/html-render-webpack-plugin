import path from "path";
import { compileFunction } from "node:vm";
import { ExtraGlobals, FileSystem, Renderer } from "./common-types";

import { log } from "./logging";

// The wrapper Node uses for CommonJS modules. `extraGlobals` are appended as
// further parameters so module assets can read them as free variables.
const moduleParameters = [
  "exports",
  "require",
  "module",
  "__filename",
  "__dirname",
];

const identifierPattern = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function getFromSourceModules(
  specifier: string,
  fsModule: FileSystem,
  rootDir: string,
) {
  const sourceModuleSpecifier = specifier.replace(/^\.\//, "");
  if (!fsModule.existsSync(path.resolve(rootDir, sourceModuleSpecifier))) {
    log(
      `Unable to find file specifier ${sourceModuleSpecifier}. Root: ${rootDir}.`,
    );
    return undefined;
  }
  return fsModule.readFileSync(path.resolve(rootDir, sourceModuleSpecifier));
}

function getExtraGlobalNames(extraGlobals: ExtraGlobals) {
  const names = Object.keys(extraGlobals || {});
  for (const name of names) {
    if (moduleParameters.includes(name)) {
      throw new Error(`extraGlobals cannot use the reserved name "${name}".`);
    }
    if (!identifierPattern.test(name)) {
      throw new Error(
        `extraGlobals key "${name}" is not a valid JavaScript identifier.`,
      );
    }
  }
  return names;
}

function evaluateFromFileSystem(
  specifier: string,
  fsModule: FileSystem,
  rootDir: string,
  extraGlobals: ExtraGlobals,
): Renderer {
  log(
    `Evaluating source for ${specifier}". From root directory: "${rootDir}".`,
  );
  let source;
  try {
    source = getFromSourceModules(specifier, fsModule, rootDir);
  } catch (error) {
    throw new Error(`An error reading "${specifier}". Error: ${error}`, {
      cause: error,
    });
  }
  if (!source) {
    throw new Error(`Unable to find source for "${specifier}".`);
  }

  const filename = specifier;
  const extraGlobalNames = getExtraGlobalNames(extraGlobals);
  const module = {
    exports: {} as unknown,
    id: filename,
    filename,
    loaded: false,
  };

  // Compiling in the current context keeps Node's globals (Buffer, process,
  // console, ...) and built-in object identities intact, so values crossing
  // into the module still satisfy `instanceof` checks.
  const compiled = compileFunction(
    source.toString(),
    [...moduleParameters, ...extraGlobalNames],
    { filename },
  );

  compiled.call(
    module.exports,
    module.exports,
    createLinker(specifier, fsModule, rootDir, extraGlobals),
    module,
    filename,
    path.dirname(filename),
    ...extraGlobalNames.map((name) => extraGlobals[name]),
  );

  module.loaded = true;
  return module.exports as Renderer;
}

function createLinker(
  parentModulePath: string,
  fsModule: FileSystem,
  rootDir: string,
  extraGlobals: ExtraGlobals,
) {
  log("Creating linker for", parentModulePath);
  return function linker(specifier: string) {
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!getFromSourceModules(specifier, fsModule, rootDir)) {
      log(`Using external require for ${specifier} from ${parentModulePath}`);
      const resolvedPath = require.resolve(specifier, { paths: [rootDir] });
      log(`Resolved ${specifier} as external package to ${resolvedPath}`);
      // External packages are resolved from the consumer's webpack root.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(resolvedPath);
    }
    log(`Linking ${parentModulePath} to asset ${specifier}`);
    return evaluateFromFileSystem(absPath, fsModule, rootDir, extraGlobals);
  };
}

export = evaluateFromFileSystem;
