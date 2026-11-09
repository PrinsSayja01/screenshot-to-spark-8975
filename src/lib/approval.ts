import type { TradeProposal } from "./api/types";

/** Returns the reasons approval is blocked; empty array means the Approve button may be enabled. */
export function approvalBlockers(
  p: TradeProposal,
  ctx: { backendConnected: boolean; nowMs: number; processed: boolean },
): string[] {
  const r: string[] = [];
  if (new Date(p.expires_at).getTime() <= ctx.nowMs || p.status === "EXPIRED") r.push("Proposal expired");
  if (p.risk.status === "REJECTED") r.push("Risk validation rejected");
  if (p.data_stale) r.push("Market data is stale");
  if (!ctx.backendConnected) r.push("Backend not connected");
  if (ctx.processed || (p.status !== "PENDING" && p.status !== "EXPIRED")) r.push("Already processed");
  return r;
}
