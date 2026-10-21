---
"html-render-webpack-plugin": patch
---

Evaluate renderer bundles with Node's `vm.compileFunction` instead of the `eval` package. Renderers now run with the host realm's globals and built-in identities, so values arriving from `extraGlobals` or a resolved dependency satisfy `instanceof`, `__dirname` and `__filename` resolve to the compiler's output directory, `module.require` is available, and dynamic `import()` works.

This also means a renderer bundle is no longer isolated from the build process: globals or prototypes it mutates persist, and `extraGlobals` are module-scope bindings rather than properties on `globalThis`.
