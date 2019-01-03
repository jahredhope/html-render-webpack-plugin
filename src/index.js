const chalk = require("chalk");
const validateOptions = require("schema-utils");

const schema = require("./schemas/HtmlRenderWebpackPlugin.json");
const RenderError = require("./RenderError");
const renderHtml = require("./renderHtml");

const MultiStats = require("webpack/lib/MultiStats");

const returnEmptyObject = () => ({});
const defaultTransformFilePath = ({ route }) => route;

module.exports = class HtmlRenderPlugin {
  constructor(options = {}) {
    validateOptions(schema, options, "HTML Render Webpack Plugin");

    this.mapStatsToParams = options.mapStatsToParams || returnEmptyObject;
    this.renderDirectory = options.renderDirectory || "dist";
    this.renderEntry = options.renderEntry || "main";
    this.routes = options.routes || [""];
    this.transformFilePath =
      options.transformFilePath || defaultTransformFilePath;
    this.verbose = options.verbose || false;
    this.renderConcurrency = options.renderConcurrency || "serial";
    this.compilerToRenderWith = options.compilerToRenderWith;

    this.compilersComplete = 0;
    this.compilersRunning = 0;
    this.compilers = [];
    this.compilations = [];
    this.defaultHookOptions = { name: "HtmlRenderPlugin" };

    this.onRender = this.onRender.bind(this);
    this.logError = this.logError.bind(this);
    this.trace = this.trace.bind(this);
    this.apply = this.apply.bind(this);
    this.render = this.render.bind(this);
  }
  logError(...args) {
    console.log(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
  }
  trace(...args) {
    if (this.verbose) {
      console.log(chalk.blue("HtmlRenderPlugin:"), ...args);
    }
  }
  async onRender(currentCompilation) {
    this.trace(`Starting render`);

    if (!this.renderCompiler) {
      const errorMessage = `Unable to find render compiler. Add \`.render()\` to any one configuration.`;
      this.logError(errorMessage);
      throw new Error(errorMessage);
    }
    if (!this.renderCompilation) {
      const errorMessage = `Unable to find render compilation. Something may have gone wrong during render build.`;
      this.logError(errorMessage);
      throw new Error(errorMessage);
    }

    const renderStats = this.renderCompilation.getStats();

    const webpackStats =
      this.compilations.length > 1
        ? new MultiStats(
            this.compilations.map(compilation => {
              return compilation.getStats();
            })
          )
        : currentCompilation.getStats();

    try {
      await renderHtml({
        mapStatsToParams: this.mapStatsToParams,
        renderConcurrency: this.renderConcurrency,
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
      currentCompilation.errors.push(new RenderError(error));
    }
  }
  applyRenderPlugin(compiler) {
    this.trace("Applying render plugin");
    this.renderCompiler = compiler;

    if (
      this.renderCompiler.options.output &&
      this.renderCompiler.options.output.path
    ) {
      this.renderDirectory =
        this.renderDirectory || this.renderCompiler.options.output.path;
    }
    this.renderCompiler.hooks.emit.tap(this.defaultHookOptions, compilation => {
      this.renderCompilation = compilation;
    });
  }
  applyCompiler(compiler, options = {}) {
    this.compilers.push(compiler);
    const compilerName = compiler.name || compiler.options.name;
    this.trace(`Recieved compiler: ${compilerName}`);

    compiler.hooks.run.tap(this.defaultHookOptions, () => {
      this.compilersRunning++;
    });
    compiler.hooks.watchRun.tap(
      this.defaultHookOptions,
      () => this.compilersRunning++
    );
    compiler.hooks.emit.tap(this.defaultHookOptions, compilation => {
      const index = this.compilers.indexOf(compilation.compiler);
      this.compilations[index] = compilation;
      this.compilersRunning--;
    });

    compiler.hooks.afterEmit.tapPromise(
      this.defaultHookOptions,
      async compilation => {
        this.compilersComplete++;
        if (this.compilersRunning > 0) {
          this.trace(
            `Assets emitted for ${compilerName}. Waiting for ${
              this.compilersRunning
            } other currently running compilers`
          );
          return;
        }
        if (this.compilersComplete < this.compilers.length) {
          this.trace(
            `Assets emitted for ${compilerName}. Waiting for ${this.compilers
              .length -
              this
                .compilersComplete} other compilers to finish their first build.`
          );
          return;
        }
        this.trace(
          `Assets emitted for ${compilerName}. compilersComplete ${
            this.compilersComplete
          }. No. Compilers: ${this.compilers.length}. Compilers running: ${
            this.compilersRunning
          }.`
        );
        return this.onRender(compilation);
      }
    );
    if (
      options.render ||
      (this.compilerToRenderWith && compilerName === this.compilerToRenderWith)
    ) {
      this.applyRenderPlugin(compiler);
    }
  }
  apply(compiler, options = {}) {
    const isMultiCompiler = Boolean(compiler.compilers);
    if (isMultiCompiler) {
      this.trace("Adding MultiCompiler");
      compiler.compilers.forEach(compiler => {
        const compilerName = compiler.name || compiler.options.name;
        const compilerToRenderWith = this.compilerToRenderWith || "render";
        this.applyCompiler(compiler, {
          ...options,
          render: compilerToRenderWith === compilerName
        });
      });
    } else {
      this.trace("Adding Compiler");
      this.applyCompiler(compiler, options);
    }
  }
  render() {
    return compiler => this.apply(compiler, { render: true });
  }
};
