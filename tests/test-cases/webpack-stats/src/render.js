export default function exampleRender({ webpackStats }) {
  return JSON.stringify(
    {
      name: webpackStats.name,
      assets: webpackStats.assetsByChunkName
    },
    null,
    2
  );
}
