import type { TradingApi } from "./contract";
import { httpApi } from "./http";
import { mockApi } from "../mock/adapter";

/** Mock adapter by default. Set VITE_USE_MOCK=false to talk to the FastAPI backend. */
export const USE_MOCK = (import.meta.env.VITE_USE_MOCK as string | undefined) !== "false";
export const api: TradingApi = USE_MOCK ? mockApi : httpApi;
export { ApiError, API_BASE_URL } from "./http";
export type * from "./types";
