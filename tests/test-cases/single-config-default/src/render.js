export default function render({ route, webpackStats }) {
  return `<html>
<body>
  route:${route}
  stats:${webpackStats ? "available" : "missing"}
</body>
</html>`;
}
