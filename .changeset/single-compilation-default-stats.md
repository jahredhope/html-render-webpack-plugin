---
"html-render-webpack-plugin": patch
---

Render single-compilation builds with the default `mapStatsToParams`. The renderer's own stats are used when there is no client compilation, instead of calling `MultiStats.toJson()` with an empty list.
