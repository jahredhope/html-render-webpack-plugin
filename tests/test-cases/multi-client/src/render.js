export default function exampleRender({ webpackStats }) {
  return JSON.stringify(
    {
      children: webpackStats.children.map((child) => ({
        name: child.name,
        assets: child.assetsByChunkName.main,
      })),
    },
    null,
    2,
  );
}
