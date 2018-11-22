import common from "./common";

export default function exampleRender(...params) {
  return `<html>
<body>
  Rendered with:&nbsp;
  common: ${JSON.stringify(common, null, 2)}
  <code>${JSON.stringify(params, null, 2).replace(/\n/g, "\n  ")}</code>
</body>
</html>`;
}
