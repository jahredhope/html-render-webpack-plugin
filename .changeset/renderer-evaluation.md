---
"html-render-webpack-plugin": minor
---

Evaluate renderer bundles with Node's `vm.compileFunction` instead of the `eval` package. `require` and `module.require` continue to resolve assets from the compiler's output file system.

This changes some details of the rendering behaviour:

- Values crossing into a bundle now satisfy `instanceof`. Bundles previously ran in a fresh `vm` context, so arrays, errors and promises created outside it failed checks like `value instanceof Array`.
- `__dirname` and `__filename` are now defined, pointing at the evaluated asset and its directory in the compiler's output. Both were `undefined` before.
- Dynamic `import()` now works. It previously threw `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`, since a `vm` context has no import callback.

Note: bundles are no longer isolated from the build process. Writes to globals, prototypes or undeclared variables used to die with each asset's `vm` context; they now persist for the build and are visible to other assets and the plugin. `extraGlobals` are module-scope bindings, so `globalThis.<name>` no longer resolves. As before, this is not a security boundary.
