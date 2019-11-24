import { Stats } from "webpack";

export type RouteObj = { route: string };
export type RouteStr = string;
export type Route = RouteObj | RouteStr;
export type Trace = (...values: any[]) => void;
export type Specifier = string;
export type ExtraGlobals = Record<string, any>;
export type RenderConcurrency = "parallel" | "serial";
export type MapStatsToParams = ({
  webpackStats
}: {
  webpackStats: Stats;
}) => any;
export type TransformPath = (route: RouteObj) => string;
