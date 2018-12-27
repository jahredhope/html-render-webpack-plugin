export default function exampleRender({ webpackStats }) {
  const stats = webpackStats.toJson({});
  return JSON.stringify(
    stats.children.map(childStats => ({
      name: childStats.name,
      assets: childStats.assetsByChunkName
    })),
    null,
    2
  );
}
