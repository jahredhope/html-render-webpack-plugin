export default function exampleRender({ webpackStats, scripts }) {
  return JSON.stringify(
    {
      scripts,
      children: webpackStats.children.map((child) => ({
        name: child.name,
        assets: child.assetsByChunkName.main,
      })),
    },
    null,
    2,
  );
}
