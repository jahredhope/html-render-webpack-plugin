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
    this.renderEntry = opts.renderEntry || "render";
    this.routes = opts.routes || [""];
    this.verbose = opts.verbose || false;
    this.mapStatsToParams = opts.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = opts.renderDirectory || "";
    this.onDone = this.onDone.bind(this);
  }
  async onDone(renderCompilation) {
    const renderStats = renderCompilation.getStats();
    if (this.verbose) {
      this.log(`Recieved render compilation`);
    }
    const clientStats = this.clientStats;

    try {
      await renderHtml({
        routes: this.routes,
        renderCompilation,
        clientStats: clientStats.toJson(),
        renderStats: renderStats.toJson(),
        renderDirectory: this.renderDirectory,
        renderEntry: this.renderEntry,
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

    this.clientCompiler.hooks.emit.tap(hookOptions, compilation => {
      if (this.verbose) {
        this.log(`Recieved clientStats`);
      }
      this.clientStats = compilation.getStats();
    });
    this.renderCompiler.hooks.emit.tapPromise(hookOptions, this.onDone);
  }
};
