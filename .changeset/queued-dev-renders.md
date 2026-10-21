---
"html-render-webpack-plugin": patch
---

Queue dev-router renders correctly when a request arrives before the build is ready. Queued renders now go through `mapStatsToParams` instead of calling the raw renderer.
