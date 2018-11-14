export default async function exampleRender(...params) {
  await new Promise(resolve => setTimeout(resolve, 200));
  return `<html>
<body>
  Rendered with:&nbsp;
  <code>${JSON.stringify(params, null, 2).replace(/\n/g, "\n  ")}</code>
</body>
</html>`;
}
