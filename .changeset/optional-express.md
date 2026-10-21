---
"html-render-webpack-plugin": minor
---

Make the Express peer dependency optional for build-only users. Express is loaded lazily by `createDevRouter`, and the package entry point no longer references Express types: `createDevRouter` returns a structural `DevRouter` type, so build-only TypeScript users do not need `@types/express`.
