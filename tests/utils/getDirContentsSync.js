import nodeFs from "node:fs";
import path from "node:path";

export default function getDirContentsSync(rootDir, { fs = nodeFs } = {}) {
  return fs.readdirSync(rootDir).reduce((acc, dir) => {
    const absoluteDirectory = path.join(rootDir, dir);
    if (fs.statSync(absoluteDirectory).isDirectory()) {
      acc[dir] = getDirContentsSync(absoluteDirectory, { fs });
    } else {
      acc[dir] = fs.readFileSync(absoluteDirectory, "utf8");
    }
    return acc;
  }, {});
}
