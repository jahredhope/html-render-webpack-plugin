- WebpackStats nolonger includes the render config by default.

```js
plugins: [htmlRenderPlugin.render];
```

To recreate the previous behaviour pass the stats collector to render config

```js
plugins: [htmlRenderPlugin.collectStats, htmlRenderPlugin.render];
```

Where builds have two configurations (client and render) this will now mean your stats file will be a standard Stats file and not a MultiStats file.
