/* global extraError */

const path = require("path");

module.exports = async function render() {
  const dynamic = await import("./dynamic.js");

  return `<html><body>
    dirname:${__dirname}
    filename:${path.basename(__filename)}
    moduleRequire:${module.require("path").sep}
    external:${path.sep}
    extraGlobalIsError:${extraError instanceof Error}
    extraGlobalMessage:${extraError.message}
    dynamic:${dynamic.default}
  </body></html>`;
};
