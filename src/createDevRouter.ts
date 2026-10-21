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
import { getScriptUrlsFromStats } from "./assets";
import type { WebpackStatsJson } from "./assets";

interface Params<Route> {
  routes: Route[];
  getRouteFromRequest?: GetRouteFromRequest<Route>;
  onRendererReady: OnRendererReady<Route>;
  transformExpressPath: TransformExpressPath<Route>;
  getClientStats: () => WebpackStats;
  /** Entrypoints to omit from the dev error page, such as the renderer bundle. */
  getExcludedEntrypoints?: () => string[];
}

function loadExpress(): typeof import("express") {
  try {
    // Express is only needed by the dev router. Requiring it lazily keeps it
    // optional for build-only consumers.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("express");
  } catch (error) {
    throw new Error(
      "The HTML render dev router requires Express, which is an optional peer dependency.",
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
  getExcludedEntrypoints,
}: Params<Route>): Router => {
  log("Create dev server");
  const express = loadExpress();

  const formatErrorResponse = (
    error: string,
    webpackStats: WebpackStatsJson,
  ) => {
    const devServerScripts = getScriptUrlsFromStats(webpackStats, {
      excludeEntrypoints: getExcludedEntrypoints?.(),
    }).map((url) => `<script src="${url}"></script>`);

    return [error, ...devServerScripts].join("\n");
  };

  const devServerRouter = express.Router();

  // Deduplicate paths to avoid duplicated processing in Express. Routes may be
  // written with or without a leading slash, matching the file paths used by
  // the static build.
  //
  // Returning `undefined` from transformExpressPath excludes a route. An empty
  // result keeps its previous meaning for every route except the default one:
  // the default route is `""` and is served at `/`.
  const routesByExpressPath = new Map<string, Route>();
  routes.forEach((route) => {
    const expressPath = transformExpressPath(route);
    if (expressPath === undefined) {
      return;
    }
    if (expressPath === "" && route.route !== "") {
      return;
    }
    routesByExpressPath.set(normalizeExpressPath(expressPath), route);
  });

  routesByExpressPath.forEach((defaultRoute, expressPath) => {
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
