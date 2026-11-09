import type * as T from "./types";

/** Every adapter (HTTP or mock) implements this contract. UI code depends only on it. */
export interface TradingApi {
  getHealth(): Promise<T.Health>;
  getMarkets(): Promise<T.MarketStatus[]>;
  getInstruments(): Promise<T.Instrument[]>;
  runScanner(): Promise<T.ScanSummary>;
  getScanSummary(): Promise<T.ScanSummary>;
  getOpportunities(): Promise<T.TradingSignal[]>;
  getResearch(signalId: string): Promise<T.ResearchReport>;
  validateRisk(proposalId: string): Promise<T.RiskValidation>;
  getProposals(): Promise<T.TradeProposal[]>;
  approveProposal(a: T.TradeApproval): Promise<T.TradeApprovalResult>;
  rejectProposal(a: T.TradeApproval): Promise<T.TradeApprovalResult>;
  getOrders(): Promise<T.Order[]>;
  getPositions(): Promise<T.Position[]>;
  requestClosePosition(id: string): Promise<{ accepted: boolean; message: string }>;
  getPortfolio(): Promise<T.Portfolio>;
  getJournal(): Promise<T.JournalEntry[]>;
  getPerformance(): Promise<T.PerformanceMetrics>;
  getSystemStatus(): Promise<T.SystemStatus>;
  setKillSwitch(active: boolean): Promise<T.KillSwitchResult>;
}
