import express, { Request, Response, NextFunction } from "express";
import { log, logError } from "./logging";
import exceptionFormatter from "exception-formatter";
import {
  OnRendererReady,
  BaseRoute,
  WebpackStats,
  TransformExpressPath,
  GetRouteFromRequest
} from "common-types";
import { Stats } from "webpack";

interface Params<Route> {
  routes: Route[];
  getRouteFromRequest?: GetRouteFromRequest<Route>;
  onRendererReady: OnRendererReady<Route>;
  transformExpressPath: TransformExpressPath<Route>;
  getClientStats: () => WebpackStats;
}

export = <Route extends BaseRoute>({
  routes,
  getRouteFromRequest,
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

  const routesByExpressPath: Record<string, Route> = {};

  // Deduplicate paths to avoid duplicated processing in Express
  routes.forEach(route => {
    const expressPath = transformExpressPath(route);
    if (expressPath) {
      routesByExpressPath[expressPath] = route;
    }
  });

  Object.entries(routesByExpressPath).forEach(([expressPath, defaultRoute]) => {
    devServerRouter.get(
      expressPath,
      async (req: Request, res: Response, next: NextFunction) => {
        onRendererReady(async render => {
          const route = getRouteFromRequest
            ? getRouteFromRequest(req, routes)
            : defaultRoute;
          if (!route) {
            next();
          }
          if (!routes.includes(route)) {
            const errorMessage =
              "Returned route was not an existing route. Ensure return value from getRouteFromRequest is route";
            logError(errorMessage);
            throw new Error(errorMessage);
          }
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
