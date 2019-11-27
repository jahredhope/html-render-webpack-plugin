import HtmlRenderPlugin from "../../../src";

describe("dev-server", () => {
  it("should create a dev server", async () => {
    const htmlRenderPlugin = new HtmlRenderPlugin();

    expect(htmlRenderPlugin.createDevRouter()).toEqual(expect.any(Function));
  });
});
