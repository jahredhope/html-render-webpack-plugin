---
"html-render-webpack-plugin": minor
---

Evaluate renderer bundles with Node's `vm.compileFunction` instead of the `eval` package. `require` and `module.require` continue to resolve assets from the compiler's output file system and fall back to the build's own dependencies.

This changes some details of the rendering behaviour:

- `instanceof` checks now pass for values that cross into a bundle. Previously each asset ran in a fresh `vm` context, so an array, error or promise created outside it (through `extraGlobals` or a dependency resolved by `require`) failed checks such as `value instanceof Array` or `error instanceof Error`. Bundles now share the host realm, so these behave as they do in a normal Node module.
- `__dirname` and `__filename` now resolve to the evaluated asset and its directory, resolved against the compiler's output directory. Both were previously `undefined`, so a bundle that read either got no value at all.
- Dynamic `import()` now works. Previously it threw `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, because a `vm` context cannot host an import without an explicit callback. It now resolves relative to the evaluated asset.

Note: a renderer bundle is no longer isolated from the build process. Previously every asset was compiled into its own `vm` context, and writes to globals, prototypes or undeclared variables were discarded along with it. Those writes now persist for the lifetime of the build and are visible to other renderer assets and to the plugin. `extraGlobals` are also module-scope bindings rather than properties of the sandbox global, so `globalThis.<name>` no longer resolves; reference the name directly. As before, none of this is a security sandbox: renderer bundles are trusted code.
