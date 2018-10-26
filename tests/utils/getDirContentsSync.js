const path = require("path");

module.exports = function getDirContentsSync(rootDir, { fs = require("fs") }) {
  return fs.readdirSync(rootDir).reduce((acc, dir) => {
    const absoluteDirectory = path.join(rootDir, dir);
    if (fs.statSync(absoluteDirectory).isDirectory()) {
      acc[dir] = getDirContentsSync(absoluteDirectory, { fs });
    } else {
      acc[dir] = fs.readFileSync(absoluteDirectory, "utf8");
    }
    return acc;
  }, {});
};
