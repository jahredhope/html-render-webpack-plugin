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
    this.routes = opts.routes || [""];
    this.verbose = opts.verbose || false;
    this.mapStatsToFilesToRead = opts.files || returnEmptyObject;
    this.mapStatsToParams = opts.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = opts.renderDirectory;
    this.fs = opts.fs || require("fs");
    this.onDone = this.onDone.bind(this);
    this.clientDone = this.clientDone.bind(this);
    this.renderDone = this.renderDone.bind(this);
  }

  async clientDone(clientStats) {
    this.clientStats = clientStats;

    if (this.renderStats) {
      await this.onDone();
      return;
    }

    return Promise.resolve();
  }

  async renderDone(renderStats) {
    this.renderStats = renderStats;

    if (this.clientStats) {
      await this.onDone();
      return;
    }

    return Promise.resolve();
  }

  async onDone() {
    if (this.verbose) {
      this.log(`Recieved stats`);
    }

    if (!this.clientStats) {
      throw new Error(
        `Unable to find client compilation. Ensure a config exists with name 'client'.`
      );
    }

    if (!this.renderStats) {
      throw new Error(
        `Unable to find render compilation. Ensure a config exists with name 'render'.`
      );
    }
    try {
      await renderHtml({
        routes: this.routes,
        clientCompiler: this.clientCompiler,
        renderCompiler: this.renderCompiler,
        clientStats: this.clientStats.toJson(),
        renderStats: this.renderStats.toJson(),
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

    this.clientCompiler.hooks.done.tapPromise(hookOptions, this.clientDone);
    this.renderCompiler.hooks.done.tapPromise(hookOptions, this.renderDone);
  }
};
