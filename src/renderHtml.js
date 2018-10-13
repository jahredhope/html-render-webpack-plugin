const path = require("path")
const chalk = require("chalk")
const createRenderer = require("./createRenderer")

module.exports = async function renderHtml({
  paths,
  compiler,
  clientCompiler,
  renderCompiler,
  renderStats,
  clientStats,
  renderDirectory,
  mapStatsToParams,
  verbose,
  log,
}) {
  const renderFile = renderStats.assetsByChunkName.render
  if (verbose) {
    log("Render file:", { renderFile })
  }

  const renderFunc = createRenderer({
    compiler,
    outputFileSystem: renderCompiler.outputFileSystem,
    inputFileSystem: renderCompiler.inputFileSystem,
    fileName: path.join(renderStats.outputPath, renderFile),
  })
  if (typeof renderFunc !== "function") {
    throw new Error(
      `Unable to find render function. File ${renderFile}. Recieved ${typeof renderFunc}.`
    )
  }
  if (verbose) {
    log(`Renderer craeted`)
  }

  function ensureDirectory(dir) {
    return new Promise(resolve =>
      clientCompiler.outputFileSystem.mkdirp(dir, () => {
        resolve()
      })
    )
  }
  function writeFile(dir, content) {
    return new Promise(resolve =>
      clientCompiler.outputFileSystem.writeFile(dir, content, () => {
        resolve()
      })
    )
  }
  async function render(url) {
    if (verbose) {
      log(`Starting render`, { url })
    }
    const newFilePath = path.join(renderDirectory, url, "index.html")
    const newFileDir = path.dirname(newFilePath)
    let renderResult
    try {
      renderResult = await renderFunc({
        url,
        ...mapStatsToParams({
          clientStats,
          renderStats,
        }),
      })
    } catch (error) {
      console.error(
        `🚨 ${chalk.red("An error occured rending:")} ${chalk.blue(
          renderFile
        )}. See below error.`
      )
      console.error(error)
      ensureDirectory(newFileDir)
      writeFile(newFilePath, error.toString())
      return
    }

    if (typeof renderResult !== "string") {
      throw new Error(
        `Render must return a string. Recieved ${typeof renderResult}.`
      )
    }

    ensureDirectory(newFileDir)
    writeFile(newFilePath, renderResult)
  }
  paths.forEach(render)
}
