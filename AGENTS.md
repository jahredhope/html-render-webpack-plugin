# AGENTS.md

Guidance for working in this repository.

## What this is

`html-render-webpack-plugin` renders static HTML from a multi-config webpack
build. A renderer compilation emits a Node bundle; the plugin evaluates that
bundle against the compiler's output file system and writes rendered HTML. It
also exposes an Express router for just-in-time rendering in development.

## Architecture

- `src/index.ts` — plugin entry. `statsCollectorPlugin` records client
  compilations; `rendererPlugin` waits for all compilations, creates the
  renderer, and renders every configured route.
- `src/createRenderer.ts` and `src/evaluateFromFileSystem.ts` — evaluate the
  emitted renderer bundle with `vm.compileFunction` in the current context,
  passing the CommonJS wrapper, `__dirname`/`__filename`, `extraGlobals`, and a
  `require` linker that reads assets from the compiler's output file system.
- `src/renderRoutes.ts` — resolves output paths, renders each route, and writes
  the HTML files.
- `src/createDevRouter.ts` — Express middleware built on `renderWhenReady`.
- `src/multiStats.ts` — resolves webpack's private `MultiStats` class across
  webpack 5.x module locations.
- `src/common-types.ts` — shared and public types.

Tests live in `tests/test-cases/*` (integration fixtures), `tests/unit/*`
(focused unit tests), and `tests/utils/*` (memfs, fixture build helper that
closes compilers, and directory snapshots). Test `.ts` files are type-checked
separately through `tsconfig.test.json`; the `.js` fixtures are not.

## Commands

| Command                 | Purpose                       |
| ----------------------- | ----------------------------- |
| `pnpm install`          | Install dependencies          |
| `pnpm test`             | Run Vitest once               |
| `pnpm test:watch`       | Run Vitest in watch mode      |
| `pnpm build`            | Emit `dist/` and declarations |
| `pnpm lint`             | ESLint and Prettier checks    |
| `pnpm typecheck`        | Type-check the test suite     |
| `pnpm changeset`        | Add a release note            |
| `pnpm changeset status` | Show the pending release      |

Before committing, run `pnpm build`, `pnpm lint`, `pnpm typecheck`, and
`pnpm test`.
`npm pack --dry-run` verifies the published file list.

## Toolchain

- Node 22 (`.nvmrc`) and pnpm 12 (`packageManager`). CI and releases run the
  same version, which is the `engines` floor. Do not commit a `mise.toml`.
- TypeScript emits CommonJS into `dist/`. Only `dist/` is published.
- Vitest, not Jest. Test files and webpack fixture configs are ESM.
- ESLint uses flat config (`eslint.config.mjs`); Prettier 3 formats the repo.
- Tests use `memfs`; builds must not write to the real `dist/`.

## Invariants and landmines

- **This is a CommonJS package.** Do not add an ESM-only runtime dependency.
  Color output uses Node's built-in `util.styleText`; prefer that over adding a
  color package.
- **Webpack internals are private.** `MultiStats` moved from
  `webpack/lib/MultiStats` to `webpack/lib/stats/MultiStats` in webpack 5.112
  with no re-export. If you touch internals, resolve every supported location
  and fail with a clear error; see `src/multiStats.ts`.
- `compiler.outputFileSystem` is nullable in webpack's types. Check it before
  use; see `renderRoutes.ts`.
- **Renderer bundles are not sandboxed.** `evaluateFromFileSystem` runs them in
  the host realm with `vm.compileFunction`, so the bundle can mutate globals and
  prototypes and is not isolated from the build process. That is a deliberate
  trade for `require`-like fidelity; do not treat it as a security boundary.
- The `MultiStats` branch is only used when there is more than one client
  compilation. Keep the multi-client fixture passing when changing stats code.
- Snapshots are meaningful. Inspect snapshot changes; never run a blanket
  update without reviewing the diff.
- Keep the public API stable. A user-facing breaking change needs a major
  changeset.

## Releasing

Releases use Changesets. Add a changeset for any consumer-facing change. The
`Release` workflow on `master` opens a "Version Packages" pull request; merging
that pull request publishes to npm and creates the GitHub release.

Do not run `npm publish` or bump versions by hand.

Current baseline is `3.0.2`; pending changesets determine the next version.

## Supported versions

- Node >= 22.13
- webpack ^5.0.0
- Express >= 4 (used by `createDevRouter`)
