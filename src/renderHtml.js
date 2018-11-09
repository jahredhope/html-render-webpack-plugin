const RawSource = require("webpack-sources/lib/RawSource");
const path = require("path");
const chalk = require("chalk");
const createRenderer = require("./createRenderer");

module.exports = async function renderHtml({
  routes,
  renderEntry,
  renderDirectory,
  renderStats,
  clientStats,
  renderCompilation,
  mapStatsToParams,
  verbose,
  log
}) {
  const renderFile = renderStats.assetsByChunkName[renderEntry];
  if (verbose) {
    log("Render file:", { renderFile });
  }
  if (!renderFile) {
    throw new Error(
      `Unable to find renderEntry ${renderEntry} in assets ${Object.keys(
        renderStats.assetsByChunkName
      )}.`
    );
  }

  const renderFunc = createRenderer({
    renderCompilation,
    fileName: renderFile
  });
  if (typeof renderFunc !== "function") {
    throw new Error(
      `Unable to find render function. File ${renderFile}. Recieved ${typeof renderFunc}.`
    );
  }
  if (verbose) {
    log(`Renderer created`);
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
      renderCompilation.assets[newFilePath] = new RawSource(error.toString());
      return;
    }

    if (typeof renderResult !== "string") {
      throw new Error(
        `Render must return a string. Recieved ${typeof renderResult}.`
      );
    }

    renderCompilation.assets[newFilePath] = new RawSource(renderResult);
    if (verbose) {
      log(`Successfully created asset ${newFilePath}`);
    }
  }
  return Promise.all(routes.map(render));
};
