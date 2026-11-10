import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { q } from "@/lib/queries";
import { API_BASE_URL, USE_MOCK } from "@/lib/api";
import { WS_URL } from "@/lib/api/ws";
import { strategyLabel } from "@/lib/format";
import { PageHeader, Panel, QueryView, Tag } from "@/components/desk/primitives";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · AI Trading Desk" },
      { name: "description", content: "Markets, strategies, risk parameters, data providers and broker configuration." },
      { property: "og:title", content: "Settings · AI Trading Desk" },
      { property: "og:description", content: "Trading desk configuration." },
    ],
  }),
  component: Settings,
});

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between border-b border-border/50 py-1 text-xs"><span className="text-muted-foreground">{k}</span><span className="num">{v}</span></div>;
}

function Settings() {
  const sys = useQuery(q.system);
  return (
    <>
      <PageHeader title="Settings" subtitle="Configuration is owned by the backend. Credentials are never shown or stored in the browser." />
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Market configuration"><Row k="USA" v="NASDAQ, NYSE" /><Row k="Germany" v="XETRA" /><Row k="Style" v="Intraday" /></Panel>
        <Panel title="Trading strategies">{Object.values(strategyLabel).map((s) => <Row key={s} k={s} v={<Tag tone="info">Enabled</Tag>} />)}</Panel>
        <Panel title="Risk parameters">
          <QueryView query={sys}>{(s) => (<>
            <Row k="Capital" v={`€${s.risk.capital}`} /><Row k="Risk per trade" v={`${s.risk.risk_per_trade_pct}%`} />
            <Row k="Daily loss limit" v={`${s.risk.daily_loss_limit_pct}%`} /><Row k="Max trades / day" v={s.risk.max_trades_per_day} />
            <Row k="Max open positions" v={s.risk.max_open_positions} />
          </>)}</QueryView>
        </Panel>
        <Panel title="Connections">
          <Row k="API" v={API_BASE_URL} /><Row k="WebSocket" v={WS_URL} /><Row k="Adapter" v={USE_MOCK ? "Mock" : "HTTP"} />
          <Row k="Broker" v="Configured on backend" /><Row k="Data providers" v="Configured on backend" /><Row k="AI model" v="Configured on backend" />
        </Panel>
        <Panel title="Paper trading"><Row k="Mode" v={<Tag tone="info">PAPER</Tag>} /><Row k="LIVE" v="Locked until backend authorizes" /></Panel>
      </div>
    </>
  );
}
