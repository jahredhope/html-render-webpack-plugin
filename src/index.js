const renderHtml = require("./renderHtml");
const chalk = require("chalk");

const MultiStats = require("webpack/lib/MultiStats");

const returnEmptyObject = () => ({});
const defaultTransformFilePath = ({ route }) => route;

module.exports = class HtmlRenderPlugin {
  constructor(opts = {}) {
    this.clientBuilding = false;
    this.renderBuilding = false;
    this.log = (...args) =>
      (opts.log || console.log)(chalk.blue("HtmlRenderPlugin:"), ...args);
    this.logError = (...args) =>
      (opts.log || console.log)(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
    this.renderEntry = opts.renderEntry || "render";
    this.routes = opts.routes || [""];
    this.verbose = opts.verbose || false;
    this.transformFilePath = opts.transformFilePath || defaultTransformFilePath;
    this.mapStatsToParams = opts.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = opts.renderDirectory || "dist";
    this.onRender = this.onRender.bind(this);
  }
  async onRender() {
    if (this.verbose) {
      this.log(`Starting render`);
    }

    const renderStats = this.renderCompilation.getStats();

    const webpackStats = new MultiStats(
      this.compilations.map(compilation => {
        return compilation.getStats();
      })
    );

    try {
      await renderHtml({
        routes: this.routes,
        renderCompilation: this.renderCompilation,
        webpackStats,
        renderStats: renderStats.toJson(),
        transformFilePath: this.transformFilePath,
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
    this.compilers = compiler.compilers || [compiler];
    this.renderCompiler =
      this.compilers.length === 1
        ? this.compilers[0]
        : this.compilers.find(childCompiler => childCompiler.name === "render");
    if (!this.renderCompiler) {
      const errorMessage = `Unable to find render compiler. Ensure a config exists with name 'render'.`;
      this.logError(errorMessage);
      throw new Error(errorMessage);
    }

    if (
      this.renderCompiler.options.output &&
      this.renderCompiler.options.output.path
    ) {
      this.renderDirectory =
        this.renderDirectory || this.renderCompiler.options.output.path;
    }
    const hookOptions = { name: "HtmlRenderPlugin" };
    this.renderCompiler.hooks.emit.tap(hookOptions, compilation => {
      this.renderCompilation = compilation;
    });

    this.compilations = [];
    let compilersToRun = this.compilers.length;
    let compilersRunning = 0;
    this.compilers.forEach((childCompiler, index) => {
      childCompiler.hooks.run.tap(hookOptions, () => compilersRunning++);
      childCompiler.hooks.watchRun.tap(hookOptions, () => compilersRunning++);
      childCompiler.hooks.emit.tap(hookOptions, compilation => {
        this.compilations[index] = compilation;
        compilersRunning--;
        compilersToRun--;
      });

      childCompiler.hooks.afterEmit.tapPromise(
        hookOptions,
        async compilation => {
          if (this.verbose) {
            this.log(`Compiler emitted assets for ${childCompiler.name}`);
          }
          this.clientCompilation = compilation;
          if (compilersRunning > 0 || compilersToRun > 0) {
            if (this.verbose) {
              this.log(
                `Assets emitted for ${
                  childCompiler.name
                }. Waiting for ${compilersRunning ||
                  compilersToRun} other compilers`
              );
            }
            return;
          }
          return this.onRender();
        }
      );
    });
  }
};
