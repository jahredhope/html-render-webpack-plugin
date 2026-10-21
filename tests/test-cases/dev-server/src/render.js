export default async function render(params) {
  if (params.forceError) {
    throw new Error("Dev server render error");
  }

  return `<html><body>route:${params.route}</body></html>`;
}
