import type * as T from "./types";
import type { TradingApi } from "./contract";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";
const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null,
    public kind: "timeout" | "network" | "http",
  ) {
    super(message);
  }
}

async function request<R>(path: string, init?: RequestInit): Promise<R> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body?.detail ?? detail;
      } catch {
        /* non-JSON body */
      }
      throw new ApiError(`${res.status}: ${detail}`, res.status, "http");
    }
    return (await res.json()) as R;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === "AbortError")
      throw new ApiError(`Request timed out after ${TIMEOUT_MS / 1000}s`, null, "timeout");
    throw new ApiError("Backend unreachable", null, "network");
  } finally {
    clearTimeout(timer);
  }
}

const post = <R>(path: string, body?: unknown) =>
  request<R>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

export const httpApi: TradingApi = {
  getHealth: () => request<T.Health>("/health"),
  getMarkets: () => request<T.MarketStatus[]>("/markets"),
  getInstruments: () => request<T.Instrument[]>("/instruments"),
  getCandles: (s) => request<T.Candle[]>(`/instruments/${encodeURIComponent(s)}/candles`),
  runScanner: () => post<T.ScanSummary>("/scanner/run"),
  getScanSummary: () => request<T.ScanSummary>("/scanner/summary"),
  getOpportunities: () => request<T.TradingSignal[]>("/scanner/opportunities"),
  getResearch: (signalId) => request<T.ResearchReport>(`/research/${encodeURIComponent(signalId)}`),
  validateRisk: (proposalId) => post<T.RiskValidation>("/risk/validate", { proposal_id: proposalId }),
  getProposals: () => request<T.TradeProposal[]>("/proposals"),
  approveProposal: (a) =>
    post<T.TradeApprovalResult>(`/proposals/${encodeURIComponent(a.proposal_id)}/approve`, a),
  rejectProposal: (a) =>
    post<T.TradeApprovalResult>(`/proposals/${encodeURIComponent(a.proposal_id)}/reject`, a),
  getOrders: () => request<T.Order[]>("/orders"),
  getPositions: () => request<T.Position[]>("/positions"),
  requestClosePosition: (id) =>
    post<{ accepted: boolean; message: string }>(`/positions/${encodeURIComponent(id)}/close`),
  getPortfolio: () => request<T.Portfolio>("/portfolio"),
  getJournal: () => request<T.JournalEntry[]>("/journal"),
  getPerformance: () => request<T.PerformanceMetrics>("/performance/daily"),
  getSystemStatus: () => request<T.SystemStatus>("/system/status"),
  setKillSwitch: (active) => post<T.KillSwitchResult>("/system/kill-switch", { active }),
};
