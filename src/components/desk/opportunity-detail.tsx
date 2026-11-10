import { useQuery } from "@tanstack/react-query";
import type { TradingSignal } from "@/lib/api/types";
import { q } from "@/lib/queries";
import { money, num, strategyLabel } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriceChart } from "./charts";
import { DemoBadge, Empty, QueryView, Tag, statusTone } from "./primitives";
import { ResearchBody } from "./research-body";

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs md:grid-cols-3">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between border-b border-border/50 pb-1">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OpportunityDetail({ s }: { s: TradingSignal }) {
  const candles = useQuery(q.candles(s.symbol));
  const research = useQuery(q.research(s.id));
  const cur = s.currency;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="num text-xl font-semibold">{s.symbol}</span>
        <span className="text-sm text-muted-foreground">{s.name}</span>
        <Tag tone={statusTone(s.direction)}>{s.direction}</Tag>
        <Tag tone="info">{s.exchange}</Tag>
        <DemoBadge />
      </div>
      <Tabs defaultValue="ta">
        <TabsList className="h-8">
          <TabsTrigger value="ta" className="text-xs">Technical</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs">AI Research</TabsTrigger>
          <TabsTrigger value="ctx" className="text-xs">Market Context</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
          <TabsTrigger value="hist" className="text-xs">History</TabsTrigger>
        </TabsList>
        <TabsContent value="ta" className="space-y-3">
          <div className="panel p-2">
            <QueryView query={candles}>
              {(c) => <PriceChart candles={c} levels={{ entry: s.entry, stop: s.stop_loss, target: s.target, vwap: s.vwap }} />}
            </QueryView>
          </div>
          <KV rows={[
            ["Strategy", strategyLabel[s.strategy]], ["Score", s.score], ["Rel. volume", `${num(s.relative_volume)}x`],
            ["VWAP", num(s.vwap)], ["VWAP status", s.vwap_status],
            ...Object.entries(s.indicators).map(([k, v]) => [k, String(v)] as [string, string]),
          ]} />
        </TabsContent>
        <TabsContent value="ai">
          <QueryView query={research}>{(r) => <ResearchBody r={r} />}</QueryView>
        </TabsContent>
        <TabsContent value="ctx"><p className="text-xs text-muted-foreground">{s.market_context}</p></TabsContent>
        <TabsContent value="risk">
          <KV rows={[
            ["Entry", money(s.entry, cur)], ["Stop-loss", money(s.stop_loss, cur)], ["Target", money(s.target, cur)],
            ["Reward/risk", num(s.reward_risk)], ["Est. fees", money(s.est_fees)], ["Est. risk / share", money(s.est_risk, cur)],
            ["Risk status", <Tag key="r" tone={statusTone(s.risk_status)}>{s.risk_status}</Tag>],
          ]} />
        </TabsContent>
        <TabsContent value="hist">
          <Empty title="No historical strategy performance" hint="Backtest and live strategy statistics are provided by the backend." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
