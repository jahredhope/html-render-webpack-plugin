import chalk from "chalk";
import validateOptions from "schema-utils";

import schema from "./schemas/HtmlRenderWebpackPlugin.json";
import RenderError from "./RenderError";
import renderHtml from "./renderHtml";

import MultiStats from "webpack/lib/MultiStats";
import {
  ExtraGlobals,
  MapStatsToParams,
  Route,
  TransformPath,
  RenderConcurrency,
  RouteObj
} from "./common-types";
import { Compiler, compilation, MultiCompiler } from "webpack";
const returnEmptyObject = () => ({});
const defaultTransformFilePath: TransformPath = ({ route }: RouteObj) => route;

interface Options {
  verbose?: boolean;
  routes?: Route[];
  mapStatsToParams?: MapStatsToParams;
  renderDirectory?: string;
  renderConcurrency?: RenderConcurrency;
  transformFilePath?: TransformPath;
  renderEntry?: string;
  compilerToRenderWith?: string;
  extraGlobals?: ExtraGlobals;
}

export = class HtmlRenderPlugin {
  extraGlobals: ExtraGlobals;
  mapStatsToParams: MapStatsToParams;
  renderDirectory: string;
  renderEntry: string;
  routes: Route[];

  compilersComplete: number;
  compilersRunning: number;
  compilers: Compiler[];
  compilerToRenderWith?: string;
  compilations: compilation.Compilation[];
  defaultHookOptions = "HtmlRenderPlugin";
  transformFilePath: TransformPath;
  renderConcurrency: RenderConcurrency;
  verbose: boolean;

  renderCompiler?: Compiler;
  renderCompilation?: compilation.Compilation;

  constructor(options: Options) {
    validateOptions(schema, options || {}, "HTML Render Webpack Plugin");

    this.extraGlobals = options.extraGlobals || {};
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

    this.onRender = this.onRender.bind(this);
    this.logError = this.logError.bind(this);
    this.trace = this.trace.bind(this);
    this.apply = this.apply.bind(this);
    this.render = this.render.bind(this);
  }
  logError(...args: any[]) {
    console.log(chalk.red("🚨 HtmlRenderPlugin:"), ...args);
  }
  trace(...args: any[]) {
    if (this.verbose) {
      console.log(chalk.blue("HtmlRenderPlugin:"), ...args);
    }
  }
  async onRender(currentCompilation: compilation.Compilation) {
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
    const webpackStats: any =
      this.compilations.length > 1
        ? new MultiStats(
            this.compilations.map(compilation => {
              return compilation.getStats();
            })
          )
        : currentCompilation.getStats();

    try {
      await renderHtml({
        extraGlobals: this.extraGlobals,
        mapStatsToParams: this.mapStatsToParams,
        renderConcurrency: this.renderConcurrency,
        renderCompilation: this.renderCompilation,
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
  applyRenderPlugin(compiler: Compiler) {
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
  applyCompiler(compiler: Compiler, options: any = {}) {
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
    compiler.hooks.emit.tap(
      this.defaultHookOptions,
      (compilation: compilation.Compilation) => {
        const index = this.compilers.indexOf(compilation.compiler);
        this.compilations[index] = compilation;
        this.compilersRunning--;
      }
    );

    compiler.hooks.afterEmit.tapPromise(
      this.defaultHookOptions,
      async (compilation: compilation.Compilation) => {
        this.compilersComplete++;
        if (this.compilersRunning > 0) {
          this.trace(
            `Assets emitted for ${compilerName}. Waiting for ${this.compilersRunning} other currently running compilers`
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
          `Assets emitted for ${compilerName}. compilersComplete ${this.compilersComplete}. No. Compilers: ${this.compilers.length}. Compilers running: ${this.compilersRunning}.`
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
  apply(compiler: MultiCompiler | Compiler, options: any = {}) {
    if ("compilers" in compiler) {
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
    return (compiler: Compiler) => this.apply(compiler, { render: true });
  }
};
