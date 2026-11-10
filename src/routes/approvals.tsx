import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart2, Check, FileSearch, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { api, USE_MOCK } from "@/lib/api";
import type { TradeProposal } from "@/lib/api/types";
import { approvalBlockers } from "@/lib/approval";
import { q } from "@/lib/queries";
import { money, num, strategyLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, QueryView, Tag, statusTone } from "@/components/desk/primitives";
import { OpportunityDetail } from "@/components/desk/opportunity-detail";
import { PriceChart } from "@/components/desk/charts";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Trade Approvals · AI Trading Desk" },
      { name: "description", content: "Review, approve or reject AI trade proposals. Human approval required." },
      { property: "og:title", content: "Trade Approvals · AI Trading Desk" },
      { property: "og:description", content: "Human-in-the-loop trade approval center." },
    ],
  }),
  component: Approvals,
});

function useNow() {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setN(Date.now()), 1000); return () => clearInterval(i); }, []);
  return n;
}

function Countdown({ to, now }: { to: string; now: number }) {
  const ms = Math.max(0, new Date(to).getTime() - now);
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
  return <span className={`num font-semibold ${ms === 0 ? "text-loss" : ms < 60000 ? "text-warn" : ""}`}>{ms === 0 ? "EXPIRED" : `${m}:${String(s).padStart(2, "0")}`}</span>;
}

function ProposalCard({ p, now, connected, onResearch, onChart }: { p: TradeProposal; now: number; connected: boolean; onResearch: () => void; onChart: () => void }) {
  const qc = useQueryClient();
  const s = p.signal;
  const [qty, setQty] = useState(String(p.quantity));
  const [processed, setProcessed] = useState(false);
  const qtyParse = z.coerce.number().int().min(1).max(10000).safeParse(qty);
  const blockers = approvalBlockers(p, { backendConnected: connected, nowMs: now, processed });
  const done = (verb: string) => (r: { accepted: boolean; message: string }) => {
    if (r.accepted) { setProcessed(true); toast.success(`${verb} confirmed by backend: ${r.message}`); }
    else toast.error(`Backend declined: ${r.message}`);
    qc.invalidateQueries({ queryKey: ["proposals"] });
  };
  const approve = useMutation({
    mutationFn: () => api.approveProposal({ proposal_id: p.id, version: p.version, quantity: qtyParse.success ? qtyParse.data : p.quantity }),
    onSuccess: done("Approval"), onError: (e) => toast.error((e as Error).message),
  });
  const reject = useMutation({
    mutationFn: () => api.rejectProposal({ proposal_id: p.id, version: p.version }),
    onSuccess: done("Rejection"), onError: (e) => toast.error((e as Error).message),
  });
  const busy = approve.isPending || reject.isPending;
  const canApprove = blockers.length === 0 && qtyParse.success && !busy;

  return (
    <article className="panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="num text-base font-semibold">{s.symbol}</span>
          <Tag tone={statusTone(s.direction)}>{s.direction}</Tag>
          <span className="text-[11px] text-muted-foreground">{s.exchange} · {strategyLabel[s.strategy]}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="num text-muted-foreground">{p.id} · v{p.version}</span>
          <span className="label-caps">Expires</span><Countdown to={p.expires_at} now={now} />
        </div>
      </header>
      <div className="grid gap-3 p-3 lg:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="num grid grid-cols-3 gap-2 text-xs md:grid-cols-5">
            {[
              ["Entry", num(s.entry)], ["Stop", num(s.stop_loss), "text-loss"], ["Target", num(s.target), "text-gain"],
              ["R/R", num(s.reward_risk)], ["Commission", money(p.est_commission)], ["Slippage", money(p.est_slippage)],
              ["Max loss", money(p.max_loss), "text-loss"], ["Currency", s.currency],
            ].map(([k, v, c]) => (
              <div key={k}><div className="label-caps">{k}</div><div className={c}>{v}</div></div>
            ))}
            <div>
              <label className="label-caps" htmlFor={`q-${p.id}`}>Quantity</label>
              <Input id={`q-${p.id}`} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-0.5 h-7 w-20 text-xs" />
              {!qtyParse.success && <div className="text-[10px] text-loss">Whole number ≥ 1</div>}
            </div>
          </div>
          <div>
            <div className="label-caps mb-1">Research summary</div>
            <p className="text-xs text-muted-foreground">{p.research_summary}</p>
          </div>
          <div>
            <div className="label-caps mb-1 flex items-center gap-2">Risk validation <Tag tone={statusTone(p.risk.status)}>{p.risk.status}</Tag></div>
            <ul className="space-y-0.5 text-xs">
              {p.risk.checks.map((c) => (
                <li key={c.rule} className="flex items-center gap-1.5">
                  {c.passed ? <Check className="h-3 w-3 text-gain" /> : <X className="h-3 w-3 text-loss" />}
                  <span>{c.rule}</span><span className="text-muted-foreground">· {c.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button disabled={!canApprove} onClick={() => approve.mutate()} className="bg-gain text-primary-foreground hover:bg-gain/90">
            <Check className="h-4 w-4" />{approve.isPending ? "Sending…" : "Approve"}
          </Button>
          <Button variant="outline" disabled={busy || processed} onClick={() => reject.mutate()} className="border-loss/50 text-loss hover:bg-loss/10">
            <X className="h-4 w-4" />{reject.isPending ? "Sending…" : "Reject"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" onClick={onResearch}><FileSearch className="h-3.5 w-3.5" />Research</Button>
            <Button size="sm" variant="secondary" onClick={onChart}><BarChart2 className="h-3.5 w-3.5" />Chart</Button>
          </div>
          {blockers.length > 0 && (
            <div className="rounded-sm border border-loss/30 bg-loss/5 p-2 text-[11px] text-loss">
              <div className="font-semibold">Approval blocked</div>
              <ul className="list-disc pl-4">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Approvals() {
  const proposals = useQuery(q.proposals);
  const health = useQuery(q.health);
  const now = useNow();
  const connected = health.data?.status === "ok" && !USE_MOCK;
  const [research, setResearch] = useState<TradeProposal | null>(null);
  const [chart, setChart] = useState<TradeProposal | null>(null);
  const candles = useQuery({ ...q.candles(chart?.signal.symbol ?? ""), enabled: !!chart });
  return (
    <>
      <PageHeader title="Trade Approval Center" demo
        subtitle="Every order requires your explicit approval. The backend validates and executes; this screen never places orders." />
      {!connected && (
        <div className="rounded-sm border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          Backend not connected{USE_MOCK ? " (mock mode)" : ""}. Approvals are disabled until the FastAPI backend is reachable.
        </div>
      )}
      <QueryView query={proposals} empty={{ title: "No pending proposals", hint: "New proposals appear here when the backend generates them." }}>
        {(list) => (
          <div className="space-y-3">
            {list.map((p) => (
              <ProposalCard key={`${p.id}-${p.version}`} p={p} now={now} connected={connected}
                onResearch={() => setResearch(p)} onChart={() => setChart(p)} />
            ))}
          </div>
        )}
      </QueryView>
      <Sheet open={!!research} onOpenChange={(o) => !o && setResearch(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader><SheetTitle className="sr-only">Proposal research</SheetTitle></SheetHeader>
          {research && <OpportunityDetail s={research.signal} />}
        </SheetContent>
      </Sheet>
      <Dialog open={!!chart} onOpenChange={(o) => !o && setChart(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="num">{chart?.signal.symbol} · intraday (DEMO)</DialogTitle></DialogHeader>
          {chart && (
            <QueryView query={candles}>
              {(c) => <PriceChart candles={c} height={320} levels={{ entry: chart.signal.entry, stop: chart.signal.stop_loss, target: chart.signal.target, vwap: chart.signal.vwap }} />}
            </QueryView>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
