declare module "eval";
declare module "schema-utils";

declare module "webpack/lib/MultiStats" {
  import { Stats } from "webpack";
  export default class MultiStats {
    stats: Stats[];
    hash?: string;
    constructor(stats: Stats[]);
    /**
     * Returns the default json options from the stats preset.
     * @param preset The preset to be transformed into json options.
     */
    static presetToOptions(preset?: Stats.Preset): Stats.ToJsonOptionsObject;
    /** Returns true if there were errors while compiling. */
    hasErrors(): boolean;
    /** Returns true if there were warnings while compiling. */
    hasWarnings(): boolean;
    /** Returns compilation information as a JSON object. */
    toJson(
      options?: Stats.ToJsonOptions,
      forToString?: boolean
    ): Stats.ToJsonOutput;
    /** Returns a formatted string of the compilation information (similar to CLI output). */
    toString(options?: Stats.ToStringOptions): string;
  }
}
