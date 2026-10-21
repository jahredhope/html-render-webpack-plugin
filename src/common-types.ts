import type * as originalFs from "fs";
import type { Stats } from "webpack";

export type WebpackStats = Stats;
export type BaseRoute = { route: string };

/**
 * The value returned by `createDevRouter`. It is an Express router at runtime,
 * but this structural type keeps Express out of the package entry point, so
 * build-only TypeScript users do not need Express types.
 */
export interface DevRouter {
  (req: any, res: any, next: any): void;
  use: (...args: any[]) => any;
}

export type Render<Route = BaseRoute> = (route: Route) => Promise<string>;
export type OnRendererReady<Route = BaseRoute> = (
  callback: (render: Render<Route>) => Promise<void>,
) => void;

export type Renderer = (...params: any[]) => Promise<string>;
export type SourceModules = Record<string, string>;
export type RouteInput<Route = BaseRoute> = Route | string;
export type Trace = (...values: any[]) => void;
export type Specifier = string;
export type ExtraGlobals = Record<string, unknown>;
export type RenderConcurrency = "parallel" | "serial";
export type MapStatsToParams<Route extends BaseRoute = BaseRoute> = (
  params: { webpackStats: WebpackStats } & Route,
) => Record<string, unknown>;
export type TransformPath<Route = BaseRoute> = (route: Route) => string;
/**
 * Build the Express path for a route. Paths are normalized to a leading slash.
 * Return `undefined` to exclude a route from the dev router.
 */
export type TransformExpressPath<Route = BaseRoute> = (
  route: Route,
) => string | undefined;
export type GetRouteFromRequest<Route> = (
  /**
   * An Express request. Typed as `any` so the main entry point does not depend
   * on Express's types; annotate it with `Request` from `express` if you want
   * the full type.
   */
  req: any,
  routes: Route[],
) => Route | undefined;

export type FileSystem = typeof originalFs;
