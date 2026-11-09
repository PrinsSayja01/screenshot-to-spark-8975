// Typed contracts shared with the FastAPI backend (http://localhost:8000/api/v1).
export type Market = "US" | "DE";
export type Exchange = "NASDAQ" | "NYSE" | "XETRA";
export type Direction = "LONG" | "SHORT";
export type Strategy = "VWAP_PULLBACK" | "MOMENTUM" | "OPENING_RANGE_BREAKOUT";
export type Trend = "UP" | "DOWN" | "SIDEWAYS";
export type DataQuality = "LIVE" | "DELAYED" | "STALE";
export type SessionStatus = "PRE_MARKET" | "OPEN" | "AFTER_HOURS" | "CLOSED";
export type RiskStatus = "APPROVED" | "WARNING" | "REJECTED" | "PENDING";
export type ResearchStatus = "COMPLETE" | "PARTIAL" | "PENDING" | "UNAVAILABLE";
export type SystemMode = "PAPER" | "LIVE";

export interface Health {
  status: "ok" | "degraded" | "down";
  version: string;
  timestamp: string;
}

export interface MarketStatus {
  market: Market;
  exchanges: Exchange[];
  session: SessionStatus;
  opens_at: string | null;
  closes_at: string | null;
  timezone: string;
}

export interface Instrument {
  symbol: string;
  name: string;
  market: Market;
  exchange: Exchange;
  currency: "USD" | "EUR";
  last_price: number;
  change_pct: number;
  volume: number;
  relative_volume: number;
  vwap: number;
  trend: Trend;
  data_quality: DataQuality;
  updated_at: string;
  strategies: Strategy[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  exchange: Exchange;
  currency: "USD" | "EUR";
  direction: Direction;
  strategy: Strategy;
  score: number;
  current_price: number;
  entry: number;
  stop_loss: number;
  target: number;
  reward_risk: number;
  relative_volume: number;
  vwap: number;
  vwap_status: "ABOVE" | "BELOW" | "AT";
  indicators: Record<string, number | string>;
  market_context: string;
  est_fees: number;
  est_risk: number;
  risk_status: RiskStatus;
  research_status: ResearchStatus;
  created_at: string;
}

export interface ResearchSource {
  source_name: string;
  published_at: string;
  url: string;
  relevance: number;
  status: ResearchStatus;
  title: string;
}

export interface ResearchReport {
  signal_id: string | null;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL" | "UNKNOWN";
  us_summary: string | null;
  de_summary: string | null;
  financial_news: ResearchSource[];
  company_news: ResearchSource[];
  earnings: ResearchSource[];
  economic_events: ResearchSource[];
  bullish_evidence: string[];
  bearish_evidence: string[];
  missing_information: string[];
  conclusion: string | null;
  generated_at: string | null;
}

export interface RiskCheck {
  rule: string;
  passed: boolean;
  detail: string;
}

export interface RiskValidation {
  proposal_id: string;
  status: RiskStatus;
  checks: RiskCheck[];
  validated_at: string;
}

export interface TradeProposal {
  id: string;
  version: number;
  signal: TradingSignal;
  quantity: number;
  est_commission: number;
  est_slippage: number;
  max_loss: number;
  research_summary: string;
  risk: RiskValidation;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  expires_at: string;
  data_stale: boolean;
}

export interface TradeApproval {
  proposal_id: string;
  version: number;
  quantity?: number;
  reason?: string;
}

export interface TradeApprovalResult {
  proposal_id: string;
  accepted: boolean;
  order_id: string | null;
  message: string;
}

export interface Order {
  id: string;
  proposal_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  type: "MARKET" | "LIMIT" | "STOP";
  price: number | null;
  status: "SUBMITTED" | "FILLED" | "PARTIAL" | "CANCELLED" | "REJECTED";
  mode: SystemMode;
  created_at: string;
}

export interface Execution {
  id: string;
  order_id: string;
  price: number;
  quantity: number;
  commission: number;
  executed_at: string;
}

export interface Position {
  id: string;
  symbol: string;
  market: Market;
  currency: "USD" | "EUR";
  direction: Direction;
  entry_price: number;
  current_price: number;
  quantity: number;
  stop_loss: number;
  target: number;
  unrealized_pnl: number;
  realized_pnl: number;
  status: "OPEN" | "CLOSING" | "CLOSED";
  opened_at: string;
}

export interface Portfolio {
  currency: "EUR";
  starting_capital: number;
  equity: number;
  cash: number;
  daily_realized_pnl: number;
  unrealized_pnl: number;
  trades_today: number;
  max_trades_per_day: number;
  open_positions: number;
  max_open_positions: number;
  win_rate: number | null;
  drawdown_pct: number;
  is_demo: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  market: Market;
  strategy: Strategy;
  direction: Direction;
  entry: number;
  exit: number;
  quantity: number;
  gross_pnl: number;
  fees: number;
  net_pnl: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  ai_explanation: string;
  user_decision: "APPROVED" | "REJECTED";
}

export interface DailyPerformance {
  date: string;
  equity: number;
  pnl: number;
}

export interface PerformanceMetrics {
  daily: DailyPerformance[];
  win_rate: number | null;
  profit_factor: number | null;
  avg_reward_risk: number | null;
  avg_win: number | null;
  avg_loss: number | null;
  max_drawdown_pct: number | null;
  by_strategy: { strategy: Strategy; trades: number; net_pnl: number; win_rate: number }[];
  by_market: { market: Market; trades: number; net_pnl: number; win_rate: number }[];
}

export interface RiskConfig {
  capital: number;
  risk_per_trade_pct: number;
  daily_loss_limit_pct: number;
  max_trades_per_day: number;
  max_open_positions: number;
  leverage_enabled: boolean;
  short_selling_enabled: boolean;
  overnight_enabled: boolean;
}

export interface SystemStatus {
  mode: SystemMode;
  live_authorized: boolean;
  kill_switch_active: boolean;
  markets: MarketStatus[];
  last_data_update: string | null;
  last_scan_at: string | null;
  risk: RiskConfig;
  current_daily_loss: number;
  consecutive_losses: number;
  is_demo: boolean;
}

export interface ScanSummary {
  total_scanned: number;
  eligible: number;
  rejected: number;
  market_direction: Record<Market, Trend>;
  last_scan_at: string | null;
}

export interface KillSwitchResult {
  accepted: boolean;
  active: boolean;
  message: string;
}
