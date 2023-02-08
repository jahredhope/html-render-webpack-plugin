import path from "path";
import chalk from "chalk";
import {
  RenderConcurrency,
  TransformPath,
  Render,
  FileSystem,
  BaseRoute,
} from "./common-types";
import { Compilation } from "webpack";
import { log } from "./logging";

interface Params<Route> {
  render: Render<Route>;
  renderConcurrency: RenderConcurrency;
  routes: Route[];
  renderEntry: string;
  renderDirectory: string;
  renderCompilation: Compilation;
  transformFilePath: TransformPath<Route>;
}

function safeMkdir(fileSystem: FileSystem, dir: string) {
  // @ts-expect-error Allow looking for invalid field mkdirp
  if (fileSystem.mkdirp) {
    log("Found mkdirp method on fileSystem. Assuming older mock fs system.");
    return new Promise<void>((resolve, reject) => {
      // @ts-expect-error Allow calling for invalid field mkdirp
      return fileSystem.mkdirp(dir, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
  return new Promise<void>((resolve, reject) => {
    fileSystem.mkdir(dir, { recursive: true }, (error?: Error | null) => {
      if (error) {
        // @ts-expect-error Looking for code property that shouldn't exist
        if (error.code === "EEXIST") {
          log(
            "Ignoring error when creating folder. Folder already existed. Assuming older mock fs systems."
          );
          resolve();
          return;
        }
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export default async function renderRoutes<Route extends BaseRoute>({
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
    await safeMkdir(
      renderCompilation.compiler.outputFileSystem as FileSystem,
      path.dirname(dir)
    );
    return new Promise<void>((resolve, reject) =>
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
        `🚨 ${chalk.red(
          `An error occurred rendering route: "${route.route}"`
        )}. Exiting render.`
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
