import HtmlRenderPlugin from "../../../src";

describe("dev-server", () => {
  it("should not return a dev server", async () => {
    const htmlRenderPlugin = new HtmlRenderPlugin({
      useDevServer: false
    });

    expect(htmlRenderPlugin.devServerRouter).toBeUndefined();
  });
  it("should return a dev server when configured", async () => {
    const htmlRenderPlugin = new HtmlRenderPlugin({
      useDevServer: true
    });

    expect(htmlRenderPlugin.devServerRouter).toEqual(expect.any(Function));
  });
});
