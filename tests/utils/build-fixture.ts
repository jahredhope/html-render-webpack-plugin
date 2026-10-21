import webpack, { type Configuration } from "webpack";

import { createInMemoryFileSystem } from "./memory-fs";
import { runWebpack } from "./run-webpack";

function closeCompiler(compiler: {
  close: (callback: (error?: Error) => void) => void;
}) {
  return new Promise<void>((resolve) => compiler.close(() => resolve()));
}

/**
 * Run a fixture through webpack against an in-memory output file system.
 * The compiler is always closed so watch handles and file descriptors do not
 * leak between test files.
 */
export async function buildFixture(config: Configuration | Configuration[]) {
  const compiler = webpack(config as unknown as Configuration);
  const memoryFs = createInMemoryFileSystem();
  // Compiler and MultiCompiler both expose outputFileSystem at runtime, but
  // the type union does not allow assigning it without narrowing.
  (compiler as any).outputFileSystem = memoryFs;

  try {
    const stats = await runWebpack(compiler as any);
    return { stats, memoryFs };
  } finally {
    await closeCompiler(compiler as any);
  }
}
