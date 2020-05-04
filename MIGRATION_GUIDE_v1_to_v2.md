# Migration Guide v1.x to v2.x

## WebpackStats nolonger includes the render config by default.

```js
plugins: [htmlRenderPlugin.rendererPlugin];
```

To recreate the previous behaviour pass the stats collector to render config

```js
plugins: [
  htmlRenderPlugin.statsCollectorPlugin,
  htmlRenderPlugin.rendererPlugin,
];
```

Where builds have two configurations (client and render) this will now mean your stats file will be a standard Stats file and not a MultiStats file.

## Remove Support for "Alternative multiple configuration setup"

This method was deprecated in the previous major release and has now been removed.

Example:

```js
new HtmlRenderPlugin().apply(multiCompiler);
```

## Deprecate the calling of `render()` and passing in the plugin directly

This syntax is still supported until the next major release but the prefered syntax is listed below.

**Render**

Before:

```js
htmlRenderPlugin.render();
```

After:

```js
htmlRenderPlugin.rendererPlugin;
```

**Client**

Before:

```js
htmlRenderPlugin;
```

After:

```js
htmlRenderPlugin.statsCollectorPlugin;
```
