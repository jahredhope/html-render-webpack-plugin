const renderHtml = require("./renderHtml");
const chalk = require("chalk");

const returnEmptyObject = () => ({});
module.exports = class MultiStaticRenderPlugin {
  constructor(opts) {
    this.log = (...args) =>
      (opts.log || console.log)(
        chalk.blue("MultiStaticRenderPlugin:"),
        ...args
      );
    this.logError = (...args) =>
      (opts.log || console.log)(
        chalk.red("🚨 MultiStaticRenderPlugin:"),
        ...args
      );
    this.paths = opts.paths;
    this.verbose = opts.verbose || false;
    this.mapStatsToFilesToRead = opts.files || returnEmptyObject;
    this.mapStatsToParams = opts.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = opts.renderDirectory;
    this.fs = opts.fs || require("fs");
    this.onDone = this.onDone.bind(this);
  }
  async onDone(multiStats) {
    if (this.verbose) {
      this.log(`Recieved stats`);
    }
    const clientStats = multiStats.stats.find(
      stat => stat.compilation.name === "client"
    );
    if (!clientStats) {
      throw new Error(
        `Unable to find client compilation. Ensure a config exists with name 'client'.`
      );
    }
    const renderStats = multiStats.stats.find(
      stat => stat.compilation.name === "render"
    );
    if (!renderStats) {
      throw new Error(
        `Unable to find render compilation. Ensure a config exists with name 'render'.`
      );
    }
    try {
      await renderHtml({
        paths: this.paths,
        clientCompiler: this.clientCompiler,
        renderCompiler: this.renderCompiler,
        clientStats: clientStats.toJson(),
        renderStats: renderStats.toJson(),
        renderDirectory: this.renderDirectory,
        fs: this.fs,
        getCompiler: this.getCompiler,
        mapStatsToParams: this.mapStatsToParams,
        verbose: this.verbose,
        log: this.log
      });
    } catch (error) {
      this.logError("An error occured rendering HTML", error);
    }
  }
  apply(compiler) {
    this.clientCompiler = compiler.compilers.find(
      childCompiler => childCompiler.name === "client"
    );
    if (!this.clientCompiler) {
      const errorMessage = `Unable to find client compiler. Ensure a config exists with name 'client'.`;
      this.logError(errorMessage);
      throw new Error(errorMessage);
    }
    this.renderCompiler = compiler.compilers.find(
      childCompiler => childCompiler.name === "render"
    );
    if (!this.renderCompiler) {
      const errorMessage = `Unable to find render compiler. Ensure a config exists with name 'render'.`;
      this.logError(errorMessage);
      throw new Error(errorMessage);
    }
    const hookOptions = { name: "MultiStaticRenderPlugin" };

    compiler.hooks.done.tap(hookOptions, this.onDone);
  }
};
