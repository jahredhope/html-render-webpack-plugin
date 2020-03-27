import path from "path";
import chalk from "chalk";
import { RenderConcurrency, TransformPath, Render } from "common-types";
import { compilation } from "webpack";
import { log } from "./logging";

interface Params<Route> {
  render: Render<Route>;
  renderConcurrency: RenderConcurrency;
  routes: Route[];
  renderEntry: string;
  renderDirectory: string;
  renderCompilation: compilation.Compilation;
  transformFilePath: TransformPath<Route>;
}

export default async function renderRoutes<Route>({
  render: performRender,
  renderConcurrency,
  routes,
  renderDirectory,
  renderCompilation,
  transformFilePath,
}: Params<Route>) {
  log(`Starting render of ${routes.length} routes`);
  async function emitFile(dir: string, content: string) {
    log("Emitting file to", dir);
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
        (error) => {
          if (error) {
            reject(error);
          }

          resolve();
        }
      )
    );
  }

  async function render(route: Route) {
    const relativeFilePath = transformFilePath(route);
    const includesHtmlInFilePath = relativeFilePath.substr(-5) === ".html";
    if (!path.isAbsolute(renderDirectory)) {
      renderDirectory = path.resolve(renderDirectory);
    }
    const newFilePath = includesHtmlInFilePath
      ? path.join(renderDirectory, relativeFilePath)
      : path.join(renderDirectory, relativeFilePath, "index.html");

    let renderResult;
    try {
      renderResult = await performRender(route);
    } catch (error) {
      console.error(
        `🚨 ${chalk.red(`An error occured rendering "`)}". Exiting render.`
      );
      throw error;
    }

    if (typeof renderResult !== "string") {
      throw new Error(
        `Render must return a string. Received "${typeof renderResult}".`
      );
    }

    await emitFile(newFilePath, renderResult);
    log(`Successfully emitted ${newFilePath}`);
  }
  if (renderConcurrency === "parallel") {
    log("Rendering parallel");
    return Promise.all(routes.map(render));
  }
  log("Rendering Serial");
  for (const route of routes) {
    await render(route);
  }
  return;
}
