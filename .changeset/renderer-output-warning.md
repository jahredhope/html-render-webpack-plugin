---
"html-render-webpack-plugin": patch
---

Warn once when the renderer compilation's `output.path` is at or inside `renderDirectory`, since the renderer bundle would then be published with the static files.
