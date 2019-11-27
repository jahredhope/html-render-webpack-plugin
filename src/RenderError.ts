export default class RenderError extends Error {
  constructor(error: Error) {
    super(
      `html-render-webpack-plugin: An error occured during render: \n${error}`
    );

    this.name = "RenderError";

    Error.captureStackTrace(this, this.constructor);
  }
}
