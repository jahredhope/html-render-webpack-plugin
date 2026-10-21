export default async function render(params) {
  if (params.forceError) {
    throw new Error("Dev server render error");
  }

  const scripts = (params.scripts ?? [])
    .map((src) => `<script src="${src}"></script>`)
    .join("");

  return `<html><body>route:${params.route}${scripts}</body></html>`;
}
