const path = require("path");
const evaluate = require("eval");

function fileExistsInCompilation(specifier, compilation) {
  const fileName = path.basename(specifier);
  return Boolean(compilation.assets[fileName]);
}

function getFileSourceFromCompilation(specifier, compilation) {
  const fileName = path.basename(specifier);
  const asset = compilation.assets[fileName];
  return asset.source();
}

function evalutateFromSource(specifier, compilation, extraGlobals) {
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

function createLinker(parentModulePath, compilation, extraGlobals) {
  return function linker(specifier) {
    const absPath = path.join(path.dirname(parentModulePath), specifier);
    if (!fileExistsInCompilation(specifier, compilation)) {
      return require(specifier);
    }
    return evalutateFromSource(absPath, compilation, extraGlobals);
  };
}

module.exports = function createRenderer({
  fileName,
  renderCompilation,
  extraGlobals
}) {
  return evalutateFromSource(fileName, renderCompilation, extraGlobals);
};
