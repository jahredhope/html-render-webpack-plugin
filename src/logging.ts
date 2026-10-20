import debug from "debug";
import pc from "picocolors";

export const log = debug("HTMLRenderPlugin");

export const logError = (...args: any[]) => {
  console.log(pc.red("🚨 HtmlRenderPlugin:"), ...args);
};
