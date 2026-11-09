import { describe, expect, it } from "vitest";
import { approvalBlockers } from "./approval";
import type { TradeProposal } from "./api/types";

const now = 1_000_000;
const p = (o: Partial<TradeProposal> = {}): TradeProposal =>
  ({
    id: "p1", version: 1, status: "PENDING", data_stale: false,
    expires_at: new Date(now + 60_000).toISOString(),
    risk: { status: "APPROVED" },
    ...o,
  }) as TradeProposal;
const ok = { backendConnected: true, nowMs: now, processed: false };

describe("approvalBlockers", () => {
  it("allows a valid pending proposal", () => expect(approvalBlockers(p(), ok)).toEqual([]));
  it("blocks expired", () =>
    expect(approvalBlockers(p({ expires_at: new Date(now - 1).toISOString() }), ok)).toContain("Proposal expired"));
  it("blocks rejected risk", () =>
    expect(approvalBlockers(p({ risk: { status: "REJECTED" } as never }), ok)).toContain("Risk validation rejected"));
  it("blocks stale data", () => expect(approvalBlockers(p({ data_stale: true }), ok)).toContain("Market data is stale"));
  it("blocks without backend", () =>
    expect(approvalBlockers(p(), { ...ok, backendConnected: false })).toContain("Backend not connected"));
  it("blocks processed", () => {
    expect(approvalBlockers(p(), { ...ok, processed: true })).toContain("Already processed");
    expect(approvalBlockers(p({ status: "APPROVED" }), ok)).toContain("Already processed");
  });
});
