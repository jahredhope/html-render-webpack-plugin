import nodeFs from "node:fs";
import path from "node:path";

interface ReadableFileSystem {
  readdirSync(rootDir: string): unknown[];
  statSync(filePath: string): { isDirectory(): boolean };
  readFileSync(filePath: string, encoding: "utf8"): unknown;
}

export default function getDirContentsSync(
  rootDir: string,
  { fs = nodeFs }: { fs?: ReadableFileSystem } = {},
): Record<string, unknown> {
  return fs
    .readdirSync(rootDir)
    .reduce<Record<string, unknown>>((acc, entry) => {
      const dir = String(entry);
      const absoluteDirectory = path.join(rootDir, dir);
      if (fs.statSync(absoluteDirectory).isDirectory()) {
        acc[dir] = getDirContentsSync(absoluteDirectory, { fs });
      } else {
        acc[dir] = String(fs.readFileSync(absoluteDirectory, "utf8"));
      }
      return acc;
    }, {});
}
