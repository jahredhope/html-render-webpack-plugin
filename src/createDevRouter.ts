import type { NextFunction, Request, Response, Router } from "express";
import { log, logError } from "./logging";
import exceptionFormatter from "exception-formatter";
import {
  OnRendererReady,
  BaseRoute,
  WebpackStats,
  TransformExpressPath,
  GetRouteFromRequest,
} from "./common-types";
import { getScriptUrlsFromStats, WebpackStatsJson } from "./assets";

interface Params<Route> {
  routes: Route[];
  getRouteFromRequest?: GetRouteFromRequest<Route>;
  onRendererReady: OnRendererReady<Route>;
  transformExpressPath: TransformExpressPath<Route>;
  getClientStats: () => WebpackStats;
}

function loadExpress(): typeof import("express") {
  try {
    // Express is only needed by the dev router. Requiring it lazily keeps it
    // optional for build-only consumers.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("express");
  } catch (error) {
    throw new Error(
      "The HTML render dev router requires Express. Install it with `npm install express`.",
      { cause: error },
    );
  }
}

function normalizeExpressPath(expressPath: string) {
  if (!expressPath) {
    return "/";
  }
  return expressPath.startsWith("/") ? expressPath : `/${expressPath}`;
}

export = <Route extends BaseRoute>({
  routes,
  getRouteFromRequest,
  onRendererReady,
  transformExpressPath,
  getClientStats,
}: Params<Route>): Router => {
  log("Create dev server");
  const express = loadExpress();

  const formatErrorResponse = (
    error: string,
    webpackStats: WebpackStatsJson,
  ) => {
    const devServerScripts = getScriptUrlsFromStats(webpackStats).map(
      (url) => `<script src="${url}"></script>`,
    );

    return [error, ...devServerScripts].join("\n");
  };

  const devServerRouter = express.Router();

  const routesByExpressPath: Record<string, Route> = {};

  // Deduplicate paths to avoid duplicated processing in Express. Routes are
  // allowed without a leading slash, matching how they are written to disk.
  // A falsy transform result keeps its previous meaning: exclude the route
  // from the dev router. The default route is "" and is served at "/".
  routes.forEach((route) => {
    const expressPath = transformExpressPath(route);
    if (expressPath) {
      routesByExpressPath[normalizeExpressPath(expressPath)] = route;
      return;
    }
    if (expressPath === "" && route.route === "") {
      routesByExpressPath["/"] = route;
    }
  });

  Object.entries(routesByExpressPath).forEach(([expressPath, defaultRoute]) => {
    devServerRouter.get(
      expressPath,
      async (req: Request, res: Response, next: NextFunction) => {
        onRendererReady(async (render) => {
          const route = getRouteFromRequest
            ? getRouteFromRequest(req, routes)
            : defaultRoute;
          if (!route) {
            next();
            return;
          }
          if (!routes.includes(route)) {
            const errorMessage =
              "Returned route was not an existing route. Ensure return value from getRouteFromRequest is route";
            logError(errorMessage);
            next(new Error(errorMessage));
            return;
          }
          log(`Static render for ${route} from ${req.path}`);
          try {
            res.send(await render(route));
          } catch (error: any) {
            res.status(500).send(
              formatErrorResponse(
                exceptionFormatter(error, {
                  format: "html",
                  inlineStyle: true,
                  basepath: "webpack://static/./",
                }),
                getClientStats().toJson(),
              ),
            );
          }
        });
      },
    );
  });

  return devServerRouter;
};
