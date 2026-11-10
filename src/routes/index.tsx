import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { q } from "@/lib/queries";
import { money, pct, strategyLabel, tone } from "@/lib/format";
import { DemoBadge, Empty, PageHeader, Panel, QueryView, Stat, Tag, statusTone } from "@/components/desk/primitives";
import { EquityChart, PnlBars } from "@/components/desk/charts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · AI Trading Desk" },
      { name: "description", content: "Account equity, P&L, risk status and top opportunities at a glance." },
      { property: "og:title", content: "Overview · AI Trading Desk" },
      { property: "og:description", content: "Account equity, P&L, risk status and top opportunities." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const portfolio = useQuery(q.portfolio);
  const perf = useQuery(q.performance);
  const opps = useQuery(q.opportunities);
  const sys = useQuery(q.system);
  const orders = useQuery(q.orders);
  const p = portfolio.data;
  return (
    <>
      <PageHeader title="Overview" subtitle="Paper trading account · EUR" demo={p?.is_demo ?? false} />
      <QueryView query={portfolio}>
        {(p) => (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
            <Stat label="Equity" value={money(p.equity)} sub={`Start ${money(p.starting_capital)}`} />
            <Stat label="Available cash" value={money(p.cash)} />
            <Stat label="Daily realized" value={money(p.daily_realized_pnl)} valueClass={tone(p.daily_realized_pnl)} />
            <Stat label="Unrealized" value={money(p.unrealized_pnl)} valueClass={tone(p.unrealized_pnl)} />
            <Stat label="Trades today" value={`${p.trades_today}/${p.max_trades_per_day}`} />
            <Stat label="Open positions" value={`${p.open_positions}/${p.max_open_positions}`} />
            <Stat label="Win rate" value={p.win_rate == null ? "—" : `${p.win_rate.toFixed(1)}%`} sub="No closed trades" />
            <Stat label="Drawdown" value={pct(-p.drawdown_pct)} valueClass={tone(-p.drawdown_pct)} />
          </div>
        )}
      </QueryView>
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Equity curve" right={<DemoBadge />} className="lg:col-span-2">
          <QueryView query={perf}>{(d) => <EquityChart data={d.daily} />}</QueryView>
        </Panel>
        <Panel title="Risk status">
          <QueryView query={sys}>
            {(s) => (
              <dl className="space-y-1.5 text-xs">
                {[
                  ["Risk per trade", `${s.risk.risk_per_trade_pct}%`],
                  ["Daily loss limit", `${s.risk.daily_loss_limit_pct}% (${money((s.risk.capital * s.risk.daily_loss_limit_pct) / 100)})`],
                  ["Current daily loss", money(s.current_daily_loss)],
                  ["Leverage", s.risk.leverage_enabled ? "Enabled" : "Disabled"],
                  ["Short selling", s.risk.short_selling_enabled ? "Enabled" : "Disabled"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-border/50 pb-1">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="num">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <dt className="text-muted-foreground">Kill switch</dt>
                  <dd><Tag tone={s.kill_switch_active ? "loss" : "gain"}>{s.kill_switch_active ? "ACTIVE" : "ARMED"}</Tag></dd>
                </div>
              </dl>
            )}
          </QueryView>
        </Panel>
        <Panel title="Daily P&L" right={<DemoBadge />}>
          <QueryView query={perf}>{(d) => <PnlBars data={d.daily} height={160} />}</QueryView>
        </Panel>
        <Panel title="Top opportunities" right={<Link to="/opportunities" className="text-[11px] text-info">View all</Link>} bodyClass="p-0">
          <QueryView query={opps} empty={{ title: "No opportunities" }}>
            {(list) => (
              <ul className="divide-y divide-border">
                {[...list].sort((a, b) => b.score - a.score).slice(0, 4).map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <div>
                      <span className="num font-semibold">{o.symbol}</span>{" "}
                      <span className="text-muted-foreground">{strategyLabel[o.strategy]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag tone={statusTone(o.direction)}>{o.direction}</Tag>
                      <span className="num">{o.score}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
        <Panel title="AI market summary">
          <Empty title="No research available" hint="Market summaries appear here once the backend research service is connected. No summaries are generated in the browser." />
        </Panel>
        <Panel title="Recent activity" className="lg:col-span-3" bodyClass="p-0">
          <QueryView query={orders} empty={{ title: "No trading activity yet", hint: "Orders confirmed by the backend will appear here." }}>
            {(o) => <div className="p-3 text-xs">{o.length} orders</div>}
          </QueryView>
        </Panel>
      </div>
    </>
  );
}
