import path from "path";
import chalk from "chalk";
import createRenderer from "./createRenderer";
import {
  ExtraGlobals,
  RenderConcurrency,
  Trace,
  Route,
  MapStatsToParams
} from "common-types";
import { Stats, compilation } from "webpack";

const timeSince = (startTime: number) => `${(Date.now() - startTime) / 1000}s`;

interface Params {
  extraGlobals: ExtraGlobals;
  mapStatsToParams: MapStatsToParams;
  renderConcurrency: RenderConcurrency;
  routes: any;
  renderEntry: string;
  renderDirectory: string;
  renderStats: Stats.ToJsonOutput;
  renderCompilation: compilation.Compilation;
  trace: Trace;
  transformFilePath: (route: Route) => string;
  webpackStats: Stats;
}

export default async function renderHtml({
  extraGlobals,
  mapStatsToParams,
  renderConcurrency,
  routes,
  renderEntry,
  renderDirectory,
  renderStats,
  renderCompilation,
  trace,
  transformFilePath,
  webpackStats
}: Params) {
  const asset = renderStats.assetsByChunkName![renderEntry];
  if (!asset) {
    throw new Error(
      `Unable to find renderEntry "${renderEntry}" in assets. Possible entries are: ${Object.keys(
        renderStats.assetsByChunkName!
      ).join(", ")}.`
    );
  }
  const renderFile = typeof asset === "string" ? asset : asset.name;
  trace("Render route:", { renderFile });

  const renderFunc = createRenderer({
    renderCompilation,
    fileName: renderFile.toString(),
    extraGlobals
  });
  if (typeof renderFunc !== "function") {
    throw new Error(
      `Unable to find render function. File "${renderFile}". Recieved ${typeof renderFunc}.`
    );
  }

  async function emitFile(dir: string, content: string) {
    await new Promise((resolve, reject) =>
      renderCompilation.compiler.outputFileSystem.mkdirp(
        path.dirname(dir),
        (error?: Error | null) => {
          if (error) {
            reject(error);
          }
          resolve();
        }
      )
    );
    return new Promise((resolve, reject) =>
      renderCompilation.compiler.outputFileSystem.writeFile(
        dir,
        content,
        error => {
          if (error) {
            reject(error);
          }

          resolve();
        }
      )
    );
  }

  async function render(routeValue: Route) {
    const startRenderTime = Date.now();
    const routeData =
      typeof routeValue === "string" ? { route: routeValue } : routeValue;
    trace(`Starting render`, routeData);
    if (typeof routeData.route !== "string") {
      throw new Error(
        `Missing route in ${JSON.stringify(
          routeData
        )}. Unable to render page without a route.`
      );
    }
    const relativeFilePath = transformFilePath(routeData);
    const includesHtmlInFilePath = relativeFilePath.substr(-5) === ".html";
    if (!path.isAbsolute(renderDirectory)) {
      renderDirectory = path.resolve(renderDirectory);
    }
    const newFilePath = includesHtmlInFilePath
      ? path.join(renderDirectory, relativeFilePath)
      : path.join(renderDirectory, relativeFilePath, "index.html");

    let renderResult;
    try {
      renderResult = await renderFunc({
        ...routeData,
        ...mapStatsToParams({
          ...routeData,
          webpackStats
        })
      });
    } catch (error) {
      console.error(
        `🚨 ${chalk.red(`An error occured rendering "`)} ${chalk.blue(
          renderFile
        )}". Exiting render.`
      );
      throw error;
    }

    if (typeof renderResult !== "string") {
      throw new Error(
        `Render must return a string. Recieved "${typeof renderResult}".`
      );
    }

    await emitFile(newFilePath, renderResult);
    trace(
      `Successfully created ${newFilePath} (${timeSince(startRenderTime)})`
    );
  }
  if (renderConcurrency === "parallel") {
    return Promise.all(routes.map(render));
  }
  for (const route of routes) {
    await render(route);
  }
  return Promise.resolve();
}
