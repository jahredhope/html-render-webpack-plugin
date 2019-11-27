import evalutateFromSource from "./evalutateFromSource";
import { SourceModules, ExtraGlobals } from "common-types";

export = function createRenderer({
  fileName,
  source,
  extraGlobals
}: {
  fileName: string;
  source: SourceModules;
  extraGlobals: ExtraGlobals;
}) {
  if (!fileName) {
    throw new Error("Missing filename");
  }
  if (!source) {
    throw new Error("Missing source");
  }
  return evalutateFromSource(fileName, source, extraGlobals);
};
