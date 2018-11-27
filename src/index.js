const renderHtml = require("./renderHtml");
const chalk = require("chalk");

const MultiStats = require("webpack/lib/MultiStats");

const returnEmptyObject = () => ({});
const defaultTransformFilePath = ({ route }) => route;

module.exports = class HtmlRenderPlugin {
  constructor({
    log = console.log,
    parallelRender = false,
    verbose = true,
    routes = [""],
    mapStatsToParams = returnEmptyObject,
    renderDirectory = "dist",
    transformFilePath = defaultTransformFilePath,
    renderEntry = "main"
  } = {}) {
    this.log = log;
    this.mapStatsToParams = mapStatsToParams;
    this.parallelRender = parallelRender;
    this.renderDirectory = renderDirectory;
    this.renderEntry = renderEntry;
    this.routes = routes;
    this.transformFilePath = transformFilePath;
    this.verbose = verbose;

    this.onRender = this.onRender.bind(this);
    this.logError = this.logError.bind(this);
    this.trace = this.trace.bind(this);
  }
  logError(...args) {
    this.log(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
  }
  trace(...args) {
    if (this.verbose) {
      this.log(chalk.blue("HtmlRenderPlugin:"), ...args);
    }
  }
  async onRender() {
    this.trace(`Starting render`);

    const renderStats = this.renderCompilation.getStats();

    const webpackStats = new MultiStats(
      this.compilations.map(compilation => {
        return compilation.getStats();
      })
    );

    try {
      await renderHtml({
        mapStatsToParams: this.mapStatsToParams,
        parallelRender: this.parallelRender,
        renderCompilation: this.renderCompilation,
        renderCompiler: this.renderCompiler,
        renderDirectory: this.renderDirectory,
        renderEntry: this.renderEntry,
        renderStats: renderStats.toJson(),
        routes: this.routes,
        trace: this.trace,
        transformFilePath: this.transformFilePath,
        webpackStats
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
          this.clientCompilation = compilation;
          if (compilersRunning > 0 || compilersToRun > 0) {
            this.trace(
              `Assets emitted for ${
                childCompiler.name
              }. Waiting for ${compilersRunning ||
                compilersToRun} other compilers`
            );
            return;
          }
          this.trace(`Assets emitted for ${childCompiler.name}`);
          return this.onRender();
        }
      );
    });
  }
};
