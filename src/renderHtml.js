const path = require("path");
const chalk = require("chalk");
const createRenderer = require("./createRenderer");

module.exports = async function renderHtml({
  routes,
  compiler,
  clientCompiler,
  renderCompiler,
  renderStats,
  clientStats,
  renderDirectory,
  mapStatsToParams,
  verbose,
  log
}) {
  const renderFile = renderStats.assetsByChunkName.render;
  if (verbose) {
    log("Render file:", { renderFile });
  }

  const renderFunc = createRenderer({
    compiler,
    outputFileSystem: renderCompiler.outputFileSystem,
    inputFileSystem: renderCompiler.inputFileSystem,
    fileName: path.join(renderStats.outputPath, renderFile)
  });
  if (typeof renderFunc !== "function") {
    throw new Error(
      `Unable to find render function. File ${renderFile}. Recieved ${typeof renderFunc}.`
    );
  }
  if (verbose) {
    log(`Renderer craeted`);
  }

  function ensureDirectory(dir) {
    return new Promise((resolve, reject) =>
      clientCompiler.outputFileSystem.mkdirp(dir, error => {
        if (error) {
          reject(error);
        }
        resolve();
      })
    );
  }
  function writeFile(dir, content) {
    return new Promise((resolve, reject) =>
      clientCompiler.outputFileSystem.writeFile(dir, content, error => {
        if (error) {
          reject(error);
        }

        resolve();
      })
    );
  }
  async function render(routeValue) {
    const routeData =
      typeof routeValue === "string" ? { route: routeValue } : routeValue;
    if (verbose) {
      log(`Starting render`, routeData);
    }
    if (typeof routeData.route !== "string") {
      throw new Error(
        `Missing route in ${JSON.stringify(
          routeData
        )}. Unable to render page without a path`
      );
    }
    const includesFilePath = routeData.route.substr(-5) === ".html";
    const newFilePath = includesFilePath
      ? path.join(renderDirectory, routeData.route)
      : path.join(renderDirectory, routeData.route, "index.html");
    const newFileDir = path.dirname(newFilePath);
    let renderResult;
    try {
      renderResult = await renderFunc({
        ...routeData,
        ...mapStatsToParams({
          ...routeData,
          clientStats,
          renderStats
        })
      });
    } catch (error) {
      console.error(
        `🚨 ${chalk.red("An error occured rending:")} ${chalk.blue(
          renderFile
        )}. See below error.`
      );
      console.error(error);
      ensureDirectory(newFileDir);
      writeFile(newFilePath, error.toString());
      return;
    }

    if (typeof renderResult !== "string") {
      throw new Error(
        `Render must return a string. Recieved ${typeof renderResult}.`
      );
    }

    await ensureDirectory(newFileDir);
    await writeFile(newFilePath, renderResult);
  }
  return Promise.all(routes.map(render));
};
