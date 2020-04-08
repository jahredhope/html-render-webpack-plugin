import validateOptions from "schema-utils";

import schema from "./schemas/HtmlRenderWebpackPlugin.json";
import RenderError from "./RenderError";
import renderRoutes from "./renderRoutes";
import { log, logError } from "./logging";
import MultiStats from "webpack/lib/MultiStats";
import createDevRouter from "./createDevRouter";
import {
  BaseRoute,
  ExtraGlobals,
  MapStatsToParams,
  RenderConcurrency,
  Renderer,
  Render,
  RouteInput,
  OnRendererReady,
  TransformExpressPath,
  TransformPath,
  WebpackStats,
  GetRouteFromRequest,
} from "./common-types";
import { Compiler, compilation, Stats } from "webpack";
import getSourceFromCompilation from "./getSourceFromCompilation";
import createRenderer from "./createRenderer";
import { Router } from "express";

const timeSince = (startTime: number) => `${(Date.now() - startTime) / 1000}s`;
const defaultMapStats = ({ webpackStats }: { webpackStats: WebpackStats }) =>
  webpackStats ? { webpackStats: webpackStats.toJson() } : {};
const defaultTransform: TransformPath = <Route extends BaseRoute>(
  route: Route
) => route.route;

interface Options<Route extends BaseRoute = BaseRoute> {
  skipAssets?: boolean;
  getRouteFromRequest?: GetRouteFromRequest<Route>;
  routes?: RouteInput<Route>[];
  mapStatsToParams?: MapStatsToParams;
  renderDirectory?: string;
  renderConcurrency?: RenderConcurrency;
  transformFilePath?: TransformPath<Route>;
  transformExpressPath?: TransformExpressPath<Route>;
  renderEntry?: string;
  extraGlobals?: ExtraGlobals;
}

interface CompilationStatus {
  compilation: compilation.Compilation | null;
  isReady: boolean;
}

export = class HtmlRenderPlugin<Route extends BaseRoute = BaseRoute> {
  constructor(options: Options<Route> = {}) {
    validateOptions(schema, options || {}, "HTML Render Webpack Plugin");

    const pluginName = "HtmlRenderPlugin";

    const {
      extraGlobals = {},
      skipAssets = false,
      mapStatsToParams = defaultMapStats,
      renderEntry = "main",
      getRouteFromRequest,
      transformFilePath = defaultTransform,
      transformExpressPath = defaultTransform,
      renderConcurrency = "serial",
    } = options;

    const routes: Route[] = (options.routes || [""]).map((route) =>
      typeof route === "string" ? ({ route } as Route) : route
    );

    const renderDirectory = options.renderDirectory || "dist";

    const clientCompilations: CompilationStatus[] = [];
    let rendererCompilation: CompilationStatus;

    let renderer: Renderer;
    let lastClientStats: MultiStats | Stats | null = null;

    const isBuildReady = () =>
      rendererCompilation &&
      rendererCompilation.isReady &&
      clientCompilations.every(
        (compilationStatus) => compilationStatus.isReady
      );
    const isRendererReady = () => isBuildReady() && renderer;

    const renderQueue: Array<() => void> = [];
    const flushRenderQueue = async () => {
      if (isRendererReady() && renderQueue.length > 0) {
        await renderQueue.shift()!();
        flushRenderQueue();
      }
    };

    const render: Render<Route> = async (route: Route) => {
      const startRenderTime = Date.now();
      log(`Starting render`, route);
      const webpackStats = getClientStats();
      const renderParams = {
        ...route,
        ...mapStatsToParams({
          ...route,
          webpackStats,
        }),
      };
      try {
        const result = await renderer(renderParams);

        log(
          `Successfully rendered ${route.route} (${timeSince(startRenderTime)})`
        );
        return result;
      } catch (error) {
        error.webpackStats = webpackStats;
        throw error;
      }
    };

    const onRenderAll = async (currentCompilation: compilation.Compilation) => {
      log(`Starting routes render`);

      if (!rendererCompilation.compilation) {
        const errorMessage = `Unable to find render compilation. Something may have gone wrong during render build.`;
        logError(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        await renderRoutes({
          render,
          renderConcurrency,
          renderCompilation: rendererCompilation.compilation,
          renderDirectory,
          renderEntry,
          routes,
          transformFilePath,
        });
      } catch (error) {
        logError("An error occured rendering HTML", error);
        currentCompilation.errors.push(new RenderError(error));
      }
      log(`Ending routes render`);
    };

    const getRenderEntry = (compilation: compilation.Compilation) => {
      const renderStats = compilation.getStats().toJson();

      const asset = renderStats.assetsByChunkName![renderEntry];
      if (!asset) {
        throw new Error(
          `Unable to find renderEntry "${renderEntry}" in assets. Possible entries are: ${Object.keys(
            renderStats.assetsByChunkName!
          ).join(", ")}.`
        );
      }

      let renderFile: any = asset;
      if (Array.isArray(renderFile)) {
        renderFile = renderFile[0];
      }
      if (renderFile && typeof renderFile === "object") {
        renderFile = renderFile.name;
      }

      return renderFile as string;
    };

    const renderCallbacks: any[] = [];

    const getClientStats = () => {
      if (lastClientStats) {
        return lastClientStats;
      }
      const clientStats =
        clientCompilations.length === 1
          ? clientCompilations[0].compilation!.getStats()
          : new MultiStats(
              clientCompilations
                .map((compilationStatus) => compilationStatus.compilation)
                .filter(Boolean)
                .map((compilation) => compilation!.getStats())
            );

      lastClientStats = clientStats;
      return clientStats;
    };

    const flushQueuedRenders = () => {
      if (isRendererReady() && renderCallbacks.length > 0) {
        renderCallbacks.shift()(renderer, getClientStats());
        flushQueuedRenders();
      }
    };

    const onRendererReady: OnRendererReady<Route> = (cb) => {
      if (isRendererReady()) {
        cb(render);
      } else {
        renderCallbacks.push(cb);
      }
    };

    const createRendererIfReady = async (
      currentCompilation: compilation.Compilation
    ) => {
      if (!isBuildReady()) {
        return;
      }
      const renderCompilation = rendererCompilation.compilation!;
      const renderEntry = getRenderEntry(renderCompilation);
      log("Render route:", { renderEntry });
      const source = getSourceFromCompilation(renderCompilation);
      renderer = createRenderer({
        source,
        fileName: renderEntry,
        extraGlobals,
      });

      if (typeof renderer !== "function") {
        throw new Error(
          `Unable to find render function. File "${renderEntry}". Received ${typeof renderer}.`
        );
      }
      flushQueuedRenders();
      flushRenderQueue();
      if (!skipAssets) {
        await onRenderAll(currentCompilation);
      }
    };

    const apply = (compiler: Compiler, isRenderer: boolean) => {
      const compilerName = compiler.name || compiler.options.name;

      const compilationStatus: CompilationStatus = {
        compilation: null,
        isReady: false,
      };

      if (isRenderer) {
        log(`Received render compiler: ${compilerName}`);
      } else {
        log(`Received compiler: ${compilerName}`);
      }

      if (isRenderer) {
        if (rendererCompilation) {
          throw new Error("Error. Unable to apply a second renderer");
        }
        rendererCompilation = compilationStatus;
      } else {
        clientCompilations.push(compilationStatus);
      }

      compiler.hooks.watchRun.tap(pluginName, () => {
        log(`Build started for for ${compilerName}.`);
        compilationStatus.isReady = false;
      });

      compiler.hooks.afterEmit.tapPromise(pluginName, async (compilation) => {
        log(`Assets emitted for ${compilerName}.`);
        compilationStatus.compilation = compilation;
        lastClientStats = null;
        compilationStatus.isReady = true;
        try {
          await createRendererIfReady(compilation);
        } catch (error) {
          compilation.errors.push(error);
        }
      });
    };
    this.statsCollectorPlugin = (compiler: Compiler) => apply(compiler, false);
    this.rendererPlugin = (compiler?: Compiler) => {
      // Support legacy behaviour of calling '.render()' until next breaking change
      if (!compiler) {
        console.warn(
          "Warning. Calling render nolonger required. Change htmlRenderPlugin.render() to htmlRenderPlugin.render"
        );
        return (compiler: Compiler) => apply(compiler, true);
      }
      return apply(compiler, true);
    };
    this.apply = (compiler: Compiler) => {
      console.warn(
        "Warning. Attempted to apply directly to webpack. Use htmlRenderPlugin.statsCollectorPlugin instead."
      );
      this.statsCollectorPlugin(compiler);
    };
    this.render = () => this.rendererPlugin;
    this.createDevRouter = () =>
      createDevRouter<Route>({
        transformExpressPath,
        getRouteFromRequest,
        onRendererReady,
        getClientStats,
        routes,
      });

    this.renderWhenReady = (route: Route) =>
      new Promise((resolve, reject) => {
        const onRender = () => {
          log("Rendering renderWhenReady onRender");
          try {
            resolve(render(route));
          } catch (error) {
            reject(error);
          }
        };
        if (isRendererReady()) {
          onRender();
        } else {
          renderQueue.push(onRender);
        }
      });
  }
  renderWhenReady: (route: Route) => Promise<string>;
  statsCollectorPlugin: (compiler: Compiler) => void;
  rendererPlugin: (compiler: Compiler) => void;
  render: () => (compiler: Compiler) => void;
  apply: (compiler: Compiler) => void;
  createDevRouter: () => Router;
};
