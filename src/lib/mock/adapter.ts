// DEMO-ONLY mock adapter. Sample values for UI development; never real market data.
// Write actions (approve, close, kill switch) intentionally fail: only the backend can confirm them.
import type { TradingApi } from "../api/contract";
import { ApiError } from "../api/http";
import type * as T from "../api/types";

const delay = <R>(v: R, ms = 250) => new Promise<R>((r) => setTimeout(() => r(structuredClone(v)), ms));
const now = () => new Date().toISOString();
const noBackend = () =>
  Promise.reject(
    new ApiError("Mock mode: no backend connected. Action not sent and nothing was executed.", null, "network"),
  );

const inst = (
  symbol: string, name: string, exchange: T.Exchange, price: number, chg: number,
  vol: number, rvol: number, trend: T.Trend, q: T.DataQuality, strategies: T.Strategy[],
): T.Instrument => ({
  symbol, name, exchange,
  market: exchange === "XETRA" ? "DE" : "US",
  currency: exchange === "XETRA" ? "EUR" : "USD",
  last_price: price, change_pct: chg, volume: vol, relative_volume: rvol,
  vwap: +(price * (1 - chg / 400)).toFixed(2), trend, data_quality: q,
  updated_at: now(), strategies,
});

const instruments = (): T.Instrument[] => [
  inst("AAPL", "Apple Inc.", "NASDAQ", 100.0, 0.8, 1_200_000, 1.4, "UP", "DELAYED", ["VWAP_PULLBACK"]),
  inst("MSFT", "Microsoft Corp.", "NASDAQ", 100.0, -0.4, 900_000, 0.9, "SIDEWAYS", "DELAYED", []),
  inst("NVDA", "NVIDIA Corp.", "NASDAQ", 100.0, 2.1, 3_400_000, 2.3, "UP", "DELAYED", ["MOMENTUM"]),
  inst("JPM", "JPMorgan Chase & Co.", "NYSE", 100.0, 0.2, 600_000, 1.1, "SIDEWAYS", "STALE", []),
  inst("KO", "Coca-Cola Co.", "NYSE", 100.0, -1.1, 500_000, 1.6, "DOWN", "DELAYED", ["OPENING_RANGE_BREAKOUT"]),
  inst("SAP", "SAP SE", "XETRA", 100.0, 1.3, 400_000, 1.8, "UP", "DELAYED", ["OPENING_RANGE_BREAKOUT"]),
  inst("SIE", "Siemens AG", "XETRA", 100.0, -0.6, 300_000, 0.8, "DOWN", "DELAYED", []),
  inst("ALV", "Allianz SE", "XETRA", 100.0, 0.1, 200_000, 1.0, "SIDEWAYS", "STALE", []),
];

const sig = (
  id: string, i: T.Instrument, direction: T.Direction, strategy: T.Strategy, score: number,
  entry: number, stop: number, target: number, risk: T.RiskStatus,
): T.TradingSignal => ({
  id, symbol: i.symbol, name: i.name, market: i.market, exchange: i.exchange, currency: i.currency,
  direction, strategy, score, current_price: i.last_price, entry, stop_loss: stop, target,
  reward_risk: +(Math.abs(target - entry) / Math.abs(entry - stop)).toFixed(2),
  relative_volume: i.relative_volume, vwap: i.vwap,
  vwap_status: i.last_price > i.vwap ? "ABOVE" : i.last_price < i.vwap ? "BELOW" : "AT",
  indicators: { "RSI(14)": "DEMO", "EMA 9/21": "DEMO", ATR: "DEMO", "OR High": "DEMO" },
  market_context: "DEMO placeholder. Market context is provided by the backend research service.",
  est_fees: 1.0, est_risk: +Math.abs(entry - stop).toFixed(2),
  risk_status: risk, research_status: "UNAVAILABLE", created_at: now(),
});

const signals = (): T.TradingSignal[] => {
  const I = Object.fromEntries(instruments().map((x) => [x.symbol, x])) as Record<"AAPL" | "NVDA" | "SAP" | "KO", T.Instrument>;
  return [
    sig("demo-sig-1", I.AAPL, "LONG", "VWAP_PULLBACK", 72, 100.0, 99.5, 101.0, "APPROVED"),
    sig("demo-sig-2", I.NVDA, "LONG", "MOMENTUM", 68, 100.2, 99.6, 101.4, "WARNING"),
    sig("demo-sig-3", I.SAP, "LONG", "OPENING_RANGE_BREAKOUT", 61, 100.1, 99.7, 100.9, "APPROVED"),
    sig("demo-sig-4", I.KO, "SHORT", "OPENING_RANGE_BREAKOUT", 55, 99.9, 100.4, 98.9, "REJECTED"),
  ];
};

const proposals = (): T.TradeProposal[] => {
  const s = signals() as [T.TradingSignal, T.TradingSignal, T.TradingSignal, T.TradingSignal];
  const mk = (sg: T.TradingSignal, n: number, mins: number, status: T.RiskStatus, checks: T.RiskCheck[]): T.TradeProposal => ({
    id: `demo-prop-${n}`, version: 1, signal: sg, quantity: 1,
    est_commission: 1.0, est_slippage: 0.05, max_loss: +(Math.abs(sg.entry - sg.stop_loss) + 1.05).toFixed(2),
    research_summary: "DEMO: no research sources connected. The backend research service provides this summary.",
    risk: { proposal_id: `demo-prop-${n}`, status, checks, validated_at: now() },
    status: "PENDING", expires_at: new Date(Date.now() + mins * 60_000).toISOString(),
    data_stale: false,
  });
  return [
    mk(s[0], 1, 4, "APPROVED", [
      { rule: "Risk per trade ≤ 0.5%", passed: true, detail: "DEMO" },
      { rule: "Trades today < 3", passed: true, detail: "0 / 3" },
      { rule: "Open positions < 1", passed: true, detail: "0 / 1" },
    ]),
    mk(s[3], 2, 2, "REJECTED", [
      { rule: "Short selling enabled", passed: false, detail: "Short selling is disabled" },
    ]),
  ];
};

const candles = (symbol: string): T.Candle[] => {
  let seed = [...symbol].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const start = Math.floor(Date.now() / 1000) - 78 * 300;
  let p = 100;
  return Array.from({ length: 78 }, (_, i) => {
    const o = p;
    const c = +(o + (rnd() - 0.48) * 0.4).toFixed(2);
    p = c;
    return {
      time: start + i * 300, open: o, close: c,
      high: +(Math.max(o, c) + rnd() * 0.15).toFixed(2),
      low: +(Math.min(o, c) - rnd() * 0.15).toFixed(2),
      volume: Math.round(5000 + rnd() * 20000),
    };
  });
};

const risk: T.RiskConfig = {
  capital: 100, risk_per_trade_pct: 0.5, daily_loss_limit_pct: 1, max_trades_per_day: 3,
  max_open_positions: 1, leverage_enabled: false, short_selling_enabled: false, overnight_enabled: false,
};

const markets = (): T.MarketStatus[] => [
  { market: "US", exchanges: ["NASDAQ", "NYSE"], session: "CLOSED", opens_at: null, closes_at: null, timezone: "America/New_York" },
  { market: "DE", exchanges: ["XETRA"], session: "CLOSED", opens_at: null, closes_at: null, timezone: "Europe/Berlin" },
];

export const mockApi: TradingApi = {
  getHealth: () => delay<T.Health>({ status: "down", version: "mock", timestamp: now() }),
  getMarkets: () => delay(markets()),
  getInstruments: () => delay(instruments()),
  getCandles: (s) => delay(candles(s)),
  runScanner: () => noBackend(),
  getScanSummary: () =>
    delay<T.ScanSummary>({ total_scanned: 8, eligible: 2, rejected: 2, market_direction: { US: "UP", DE: "SIDEWAYS" }, last_scan_at: null }),
  getOpportunities: () => delay(signals()),
  getResearch: (id) =>
    delay<T.ResearchReport>({
      signal_id: id, sentiment: "UNKNOWN", us_summary: null, de_summary: null,
      financial_news: [], company_news: [], earnings: [], economic_events: [],
      bullish_evidence: [], bearish_evidence: [],
      missing_information: ["No research provider connected", "No news sources available in mock mode"],
      conclusion: null, generated_at: null,
    }),
  validateRisk: () => noBackend(),
  getProposals: () => delay(proposals()),
  approveProposal: () => noBackend(),
  rejectProposal: () => noBackend(),
  getOrders: () => delay<T.Order[]>([]),
  getPositions: () => delay<T.Position[]>([]),
  requestClosePosition: () => noBackend(),
  getPortfolio: () =>
    delay<T.Portfolio>({
      currency: "EUR", starting_capital: 100, equity: 100, cash: 100, daily_realized_pnl: 0,
      unrealized_pnl: 0, trades_today: 0, max_trades_per_day: 3, open_positions: 0,
      max_open_positions: 1, win_rate: null, drawdown_pct: 0, is_demo: true,
    }),
  getJournal: () => delay<T.JournalEntry[]>([]),
  getPerformance: () =>
    delay<T.PerformanceMetrics>({
      daily: [{ date: new Date().toISOString().slice(0, 10), equity: 100, pnl: 0 }],
      win_rate: null, profit_factor: null, avg_reward_risk: null, avg_win: null, avg_loss: null,
      max_drawdown_pct: 0, by_strategy: [], by_market: [],
    }),
  getSystemStatus: () =>
    delay<T.SystemStatus>({
      mode: "PAPER", live_authorized: false, kill_switch_active: false, markets: markets(),
      last_data_update: now(), last_scan_at: null, risk, current_daily_loss: 0,
      consecutive_losses: 0, is_demo: true,
    }),
  setKillSwitch: () => noBackend(),
};
