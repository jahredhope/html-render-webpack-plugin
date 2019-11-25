import express, { Request, Response } from "express";
import { log } from "./logging";
import exceptionFormatter from "exception-formatter";
import {
  OnRendererReady,
  BaseRoute,
  WebpackStats,
  TransformExpressPath
} from "common-types";
import { Stats } from "webpack";

interface Params<Route> {
  routes: Route[];
  onRendererReady: OnRendererReady<Route>;
  transformExpressPath: TransformExpressPath<Route>;
  getClientStats: () => WebpackStats;
}

export = <Route extends BaseRoute>({
  routes,
  onRendererReady,
  transformExpressPath,
  getClientStats
}: Params<Route>) => {
  log("Create dev server");
  const formatErrorResponse = (
    error: string,
    webpackStats: Stats.ToJsonOutput
  ) => {
    let devServerScripts: string[] = [];
    if ("entrypoints" in webpackStats) {
      try {
        const devServerAssets = webpackStats.entrypoints!.main.assets;

        devServerScripts = devServerAssets.map(
          asset => `<script src="${webpackStats.publicPath}${asset}"></script>`
        );
      } catch (err) {
        console.error("Unable to load Dev Server Scripts. Error: ", err);
      }
    }

    return [error, ...devServerScripts].join("\n");
  };

  const devServerRouter = express.Router();

  routes.forEach(route => {
    devServerRouter.get(
      transformExpressPath(route),
      async (req: Request, res: Response) => {
        onRendererReady(async render => {
          log(`Static render for ${route} from ${req.path}`);
          try {
            res.send(await render(route));
          } catch (error) {
            res.status(500).send(
              formatErrorResponse(
                exceptionFormatter(error, {
                  format: "html",
                  inlineStyle: true,
                  basepath: "webpack://static/./"
                }),
                getClientStats().toJson()
              )
            );
          }
        });
      }
    );
  });

  return devServerRouter;
};
