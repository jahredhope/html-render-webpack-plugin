import chalk from "chalk";
import debug from "debug";

export const log = debug("HTMLRenderPlugin");

export const logError = (...args: any[]) => {
  console.log(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
};
