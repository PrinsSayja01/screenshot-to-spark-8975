import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

const base = { retry: 2, retryDelay: (n: number) => Math.min(4000, 500 * 2 ** n) };

export const q = {
  health: queryOptions({ ...base, queryKey: ["health"], queryFn: api.getHealth, refetchInterval: 15000, retry: 0 }),
  system: queryOptions({ ...base, queryKey: ["system"], queryFn: api.getSystemStatus, refetchInterval: 30000 }),
  markets: queryOptions({ ...base, queryKey: ["markets"], queryFn: api.getMarkets }),
  instruments: queryOptions({ ...base, queryKey: ["instruments"], queryFn: api.getInstruments }),
  candles: (s: string) => queryOptions({ ...base, queryKey: ["candles", s], queryFn: () => api.getCandles(s) }),
  scanSummary: queryOptions({ ...base, queryKey: ["scan"], queryFn: api.getScanSummary }),
  opportunities: queryOptions({ ...base, queryKey: ["opportunities"], queryFn: api.getOpportunities }),
  research: (id: string) => queryOptions({ ...base, queryKey: ["research", id], queryFn: () => api.getResearch(id) }),
  proposals: queryOptions({ ...base, queryKey: ["proposals"], queryFn: api.getProposals, refetchInterval: 15000 }),
  orders: queryOptions({ ...base, queryKey: ["orders"], queryFn: api.getOrders }),
  positions: queryOptions({ ...base, queryKey: ["positions"], queryFn: api.getPositions }),
  portfolio: queryOptions({ ...base, queryKey: ["portfolio"], queryFn: api.getPortfolio }),
  journal: queryOptions({ ...base, queryKey: ["journal"], queryFn: api.getJournal }),
  performance: queryOptions({ ...base, queryKey: ["performance"], queryFn: api.getPerformance }),
};
