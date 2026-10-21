---
"html-render-webpack-plugin": minor
---

Add `getEntrypointScriptUrls(webpackStats, entrypoint, compilation)` for turning client stats into script URLs.
It supports single and multi-compilation stats, joins `publicPath` with or without a trailing slash, and throws for an unknown entrypoint or compilation.
