import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { TradingSignal } from "@/lib/api/types";
import { q } from "@/lib/queries";
import { money, num, strategyLabel } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader, QueryView, Tag, statusTone } from "@/components/desk/primitives";
import { OpportunityDetail } from "@/components/desk/opportunity-detail";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities · AI Trading Desk" },
      { name: "description", content: "Ranked intraday opportunities with entry, stop, target and risk." },
      { property: "og:title", content: "Opportunities · AI Trading Desk" },
      { property: "og:description", content: "Ranked intraday trade opportunities." },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const opps = useQuery(q.opportunities);
  const [sel, setSel] = useState<TradingSignal | null>(null);
  return (
    <>
      <PageHeader title="AI Opportunities" subtitle="Ranked by quality, risk eligibility and estimated costs" demo />
      <QueryView query={opps} empty={{ title: "No opportunities", hint: "Opportunities appear after a backend scan." }}>
        {(list) => (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {[...list].sort((a, b) => b.score - a.score).map((o) => (
              <button key={o.id} onClick={() => setSel(o)} className="panel p-3 text-left transition-colors hover:border-primary/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="num text-base font-semibold">{o.symbol}</span>
                    <Tag tone={statusTone(o.direction)}>{o.direction}</Tag>
                  </div>
                  <div className="text-right">
                    <div className="label-caps">Score</div>
                    <div className="num text-base font-semibold text-info">{o.score}</div>
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{o.name} · {o.market} · {o.exchange} · {strategyLabel[o.strategy]}</div>
                <div className="num mt-3 grid grid-cols-4 gap-2 text-xs">
                  <div><div className="label-caps">Entry</div>{num(o.entry)}</div>
                  <div><div className="label-caps">Stop</div><span className="text-loss">{num(o.stop_loss)}</span></div>
                  <div><div className="label-caps">Target</div><span className="text-gain">{num(o.target)}</span></div>
                  <div><div className="label-caps">R/R</div>{num(o.reward_risk)}</div>
                  <div><div className="label-caps">RVol</div>{num(o.relative_volume)}x</div>
                  <div><div className="label-caps">VWAP</div>{o.vwap_status}</div>
                  <div><div className="label-caps">Fees</div>{money(o.est_fees)}</div>
                  <div><div className="label-caps">Risk</div>{money(o.est_risk, o.currency)}</div>
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Tag tone={statusTone(o.risk_status)}>Risk {o.risk_status}</Tag>
                  <Tag tone={statusTone(o.research_status)}>Research {o.research_status}</Tag>
                </div>
              </button>
            ))}
          </div>
        )}
      </QueryView>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader><SheetTitle className="sr-only">Opportunity detail</SheetTitle></SheetHeader>
          {sel && <OpportunityDetail s={sel} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
