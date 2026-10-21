import debug from "debug";
import { styleText } from "node:util";

export const log = debug("HTMLRenderPlugin");

export const logError = (...args: any[]) => {
  console.log(styleText("red", "🚨 HtmlRenderPlugin:"), ...args);
};

export const logWarning = (...args: any[]) => {
  // stderr keeps machine-readable build output such as `webpack --json` valid.
  console.error(styleText("yellow", "HtmlRenderPlugin:"), ...args);
};
