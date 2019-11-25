export default function exampleRender({ webpackStats }) {
  const stats = webpackStats.toJson({});
  return JSON.stringify(
    {
      name: stats.name,
      assets: stats.assetsByChunkName
    },
    null,
    2
  );
}
