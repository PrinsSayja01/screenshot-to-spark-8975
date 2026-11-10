import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { q } from "@/lib/queries";
import type { DailyPerformance } from "@/lib/api/types";
import { money, num, pct, strategyLabel, tone } from "@/lib/format";
import { Empty, PageHeader, Panel, QueryView, Stat } from "@/components/desk/primitives";
import { EquityChart, PnlBars } from "@/components/desk/charts";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Performance Analytics · AI Trading Desk" },
      { name: "description", content: "Equity curve, P&L by period, win rate, profit factor and drawdown." },
      { property: "og:title", content: "Performance Analytics · AI Trading Desk" },
      { property: "og:description", content: "Trading performance analytics." },
    ],
  }),
  component: Performance,
});

// Aggregates backend daily P&L into buckets; no metrics are invented client-side.
const bucket = (d: DailyPerformance[], key: (date: string) => string) =>
  Object.entries(d.reduce<Record<string, number>>((a, x) => ((a[key(x.date)] = (a[key(x.date)] ?? 0) + x.pnl), a), {}))
    .map(([period, pnl]) => ({ period, pnl }));
const week = (s: string) => {
  const d = new Date(s); const j = new Date(d.getFullYear(), 0, 1);
  return `${d.getFullYear()}-W${Math.ceil(((+d - +j) / 864e5 + j.getDay() + 1) / 7)}`;
};

function Performance() {
  const perf = useQuery(q.performance);
  return (
    <>
      <PageHeader title="Performance Analytics" subtitle="All metrics are calculated by the backend" demo />
      <QueryView query={perf}>
        {(p) => (
          <>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
              <Stat label="Win rate" value={p.win_rate == null ? "—" : `${num(p.win_rate, 1)}%`} />
              <Stat label="Profit factor" value={num(p.profit_factor)} />
              <Stat label="Avg R/R" value={num(p.avg_reward_risk)} />
              <Stat label="Avg win" value={money(p.avg_win)} valueClass="text-gain" />
              <Stat label="Avg loss" value={money(p.avg_loss)} valueClass="text-loss" />
              <Stat label="Max drawdown" value={p.max_drawdown_pct == null ? "—" : pct(-p.max_drawdown_pct)} valueClass={tone(-(p.max_drawdown_pct ?? 0))} />
              <Stat label="Trading days" value={p.daily.length} />
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Panel title="Equity curve" className="lg:col-span-2"><EquityChart data={p.daily} height={240} /></Panel>
              <Panel title="Daily P&L"><PnlBars data={p.daily} /></Panel>
              <Panel title="Weekly P&L"><PnlBars data={bucket(p.daily, week)} x="period" /></Panel>
              <Panel title="Monthly P&L"><PnlBars data={bucket(p.daily, (d) => d.slice(0, 7))} x="period" /></Panel>
              <Panel title="US vs Germany">
                {p.by_market.length ? <PnlBars data={p.by_market.map((m) => ({ period: m.market, pnl: m.net_pnl }))} x="period" /> : <Empty title="No closed trades yet" />}
              </Panel>
              <Panel title="Strategy comparison" className="lg:col-span-2" bodyClass="p-0">
                {p.by_strategy.length ? (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">{["Strategy", "Trades", "Win rate", "Net P&L"].map((h) => <th key={h} className="label-caps px-3 py-2 text-left">{h}</th>)}</tr></thead>
                    <tbody>{p.by_strategy.map((s) => (
                      <tr key={s.strategy} className="border-b border-border/50">
                        <td className="px-3 py-1.5">{strategyLabel[s.strategy]}</td>
                        <td className="num px-3">{s.trades}</td>
                        <td className="num px-3">{num(s.win_rate, 1)}%</td>
                        <td className={`num px-3 ${tone(s.net_pnl)}`}>{money(s.net_pnl)}</td>
                      </tr>))}</tbody>
                  </table>
                ) : <Empty title="No strategy data yet" hint="Comparison appears after the backend records closed trades." />}
              </Panel>
            </div>
          </>
        )}
      </QueryView>
    </>
  );
}
