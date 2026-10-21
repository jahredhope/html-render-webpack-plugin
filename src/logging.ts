import debug from "debug";
import { styleText } from "node:util";

export const log = debug("HTMLRenderPlugin");

export const logError = (...args: any[]) => {
  console.log(styleText("red", "🚨 HtmlRenderPlugin:"), ...args);
};
