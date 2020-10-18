import { Stats } from "webpack";
import { Request } from "express";

// No current type definition for MultiStats. Ignore and hope nothing breaks.
// export type WebpackStats = Stats | MultiStats;
export type WebpackStats = Stats;
export type BaseRoute = { route: string };
export type Render<Route = BaseRoute> = (route: Route) => Promise<string>;
export type OnRendererReady<Route = BaseRoute> = (
  callback: (render: Render<Route>) => Promise<void>
) => void;

export type Renderer = (...params: any[]) => Promise<string>;
export type SourceModules = Record<string, string>;
export type RouteInput<Route = BaseRoute> = Route | string;
export type Trace = (...values: any[]) => void;
export type Specifier = string;
export type ExtraGlobals = Record<string, unknown>;
export type RenderConcurrency = "parallel" | "serial";
export type MapStatsToParams = ({
  webpackStats,
}: {
  webpackStats: WebpackStats;
}) => Record<string, unknown>;
export type TransformPath<Route = BaseRoute> = (route: Route) => string;
export type TransformExpressPath<Route = BaseRoute> = (route: Route) => string;
export type GetRouteFromRequest<Route> = (
  req: Request,
  routes: Route[]
) => Route;

import originalFs from "fs";

export type FileSystem = typeof originalFs;
