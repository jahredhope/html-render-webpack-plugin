export default function exampleRender(...params) {
  return `<html>
<body>
  Rendered with:&nbsp;
  <code>${JSON.stringify(params, null, 2).replace(/\n/g, "\n  ")}</code>
</body>
</html>`;
}
