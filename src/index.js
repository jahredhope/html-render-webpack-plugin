const renderHtml = require("./renderHtml");
const chalk = require("chalk");
const path = require("path");

const returnEmptyObject = () => ({});
module.exports = class HtmlRenderPlugin {
  constructor(opts) {
    this.log = (...args) =>
      (opts.log || console.log)(chalk.blue("HtmlRenderPlugin:"), ...args);
    this.logError = (...args) =>
      (opts.log || console.log)(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
    this.renderEntry = opts.renderEntry || "render";
    this.routes = opts.routes || [""];
    this.verbose = opts.verbose || false;
    this.mapStatsToParams = opts.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = opts.renderDirectory || "";
    if (!path.isAbsolute(opts.renderDirectory)) {
      const errorMessage = `Unable to create HtmlRenderPlugin. renderDirectory must be an absolute path. Recieved: ${
        opts.renderDirectory
      }`;
      this.logError(errorMessage);
      throw errorMessage;
    }
    this.onRender = this.onRender.bind(this);
  }
  async onRender() {
    if (this.verbose) {
      this.log(`Recieved render compilation`);
    }

    const renderStats = this.renderCompilation.getStats();
    const clientStats = this.clientCompilation.getStats();

    try {
      await renderHtml({
        routes: this.routes,
        renderCompilation: this.renderCompilation,
        clientStats: clientStats.toJson(),
        renderStats: renderStats.toJson(),
        renderCompiler: this.renderCompiler,
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
    const hookOptions = { name: "HtmlRenderPlugin" };

    // this.renderCompiler.hooks.beforeRun.tapPromise(hookOptions, compiler => {});
    // this.clientCompiler.hooks.beforeRun.tapPromise(hookOptions, compiler => {});
    // this.renderCompiler.hooks.afterEmit.watchRun(hookOptions, compiler => {});
    // this.clientCompiler.hooks.afterEmit.watchRun(hookOptions, compiler => {});
    this.renderCompiler.hooks.afterEmit.tapPromise(
      hookOptions,
      async compilation => {
        if (this.verbose) {
          this.log("Render compiler emit assets");
        }
        this.renderCompilation = compilation;
        if (!this.clientCompilation || this.clientCompiler.running) {
          if (this.verbose) {
            this.log("Render assets emited. Waiting for client.");
          }
          return;
        }
        return this.onRender();
      }
    );
    this.clientCompiler.hooks.afterEmit.tapPromise(
      hookOptions,
      async compilation => {
        if (this.verbose) {
          this.log("Client compiler emit assets");
        }
        this.clientCompilation = compilation;
        if (!this.renderCompilation || this.renderCompiler.running) {
          if (this.verbose) {
            this.log("Client assets emited. Waiting for render.");
          }
          return;
        }
        return this.onRender();
      }
    );
  }
};
