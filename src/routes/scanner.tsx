import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Radar, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Instrument, TradingSignal } from "@/lib/api/types";
import { q } from "@/lib/queries";
import { compact, money, num, pct, strategyLabel, time, tone } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, QueryView, Stat, Tag, statusTone } from "@/components/desk/primitives";
import { DataTable, type Col } from "@/components/desk/data-table";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Market Scanner · AI Trading Desk" },
      { name: "description", content: "Monitor NASDAQ, NYSE and XETRA instruments and scan for strategy signals." },
      { property: "og:title", content: "Market Scanner · AI Trading Desk" },
      { property: "og:description", content: "Multi-market monitor and strategy scanner." },
    ],
  }),
  component: Scanner,
});

const ALL = "ALL";
function F({ value, onChange, items, label }: { value: string; onChange: (v: string) => void; items: [string, string][]; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: All</SelectItem>
        {items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function useWatchlist() {
  const [w, setW] = useState<string[]>([]);
  useEffect(() => {
    try { setW(JSON.parse(localStorage.getItem("desk.watchlist") ?? "[]")); } catch { /* empty */ }
  }, []);
  const toggle = (s: string) =>
    setW((prev) => {
      const n = prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s];
      localStorage.setItem("desk.watchlist", JSON.stringify(n));
      return n;
    });
  return { w, toggle };
}

function Scanner() {
  const qc = useQueryClient();
  const instruments = useQuery(q.instruments);
  const summary = useQuery(q.scanSummary);
  const opps = useQuery(q.opportunities);
  const scan = useMutation({
    mutationFn: api.runScanner,
    onSuccess: () => { toast.success("Scan completed by backend"); qc.invalidateQueries({ queryKey: ["opportunities"] }); qc.invalidateQueries({ queryKey: ["scan"] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  const { w, toggle } = useWatchlist();
  const [f, setF] = useState({ market: ALL, exchange: ALL, trend: ALL, strategy: ALL, quality: ALL, search: "", watch: false });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((s) => ({ ...s, [k]: v }));

  const filtered = useMemo(
    () =>
      (instruments.data ?? []).filter((i) =>
        (f.market === ALL || i.market === f.market) &&
        (f.exchange === ALL || i.exchange === f.exchange) &&
        (f.trend === ALL || i.trend === f.trend) &&
        (f.strategy === ALL || i.strategies.includes(f.strategy as never)) &&
        (f.quality === ALL || i.data_quality === f.quality) &&
        (!f.watch || w.includes(i.symbol)) &&
        (i.symbol + i.name).toLowerCase().includes(f.search.toLowerCase())),
    [instruments.data, f, w],
  );

  const instCols: Col<Instrument>[] = [
    { key: "w", header: "", cell: (i) => (
      <button aria-label={`Toggle ${i.symbol} watchlist`} onClick={() => toggle(i.symbol)}>
        <Star className={cn("h-3.5 w-3.5", w.includes(i.symbol) ? "fill-warn text-warn" : "text-muted-foreground")} />
      </button>) },
    { key: "s", header: "Symbol", sort: (i) => i.symbol, cell: (i) => <span className="num font-semibold">{i.symbol}</span> },
    { key: "n", header: "Name", cell: (i) => <span className="text-muted-foreground">{i.name}</span> },
    { key: "x", header: "Exch", cell: (i) => <span className="num text-muted-foreground">{i.exchange}</span> },
    { key: "p", header: "Last", align: "right", sort: (i) => i.last_price, cell: (i) => num(i.last_price) },
    { key: "c", header: "Cur", cell: (i) => <span className="num text-muted-foreground">{i.currency}</span> },
    { key: "ch", header: "Chg %", align: "right", sort: (i) => i.change_pct, cell: (i) => <span className={tone(i.change_pct)}>{pct(i.change_pct)}</span> },
    { key: "v", header: "Volume", align: "right", sort: (i) => i.volume, cell: (i) => compact(i.volume) },
    { key: "rv", header: "RVol", align: "right", sort: (i) => i.relative_volume, cell: (i) => `${num(i.relative_volume)}x` },
    { key: "vw", header: "VWAP", align: "right", cell: (i) => num(i.vwap) },
    { key: "t", header: "Trend", cell: (i) => <Tag tone={statusTone(i.trend)}>{i.trend}</Tag> },
    { key: "q", header: "Data", cell: (i) => <Tag tone={statusTone(i.data_quality)}>{i.data_quality}</Tag> },
    { key: "u", header: "Updated", cell: (i) => <span className="num text-muted-foreground">{time(i.updated_at)}</span> },
  ];

  const oppCols: Col<TradingSignal>[] = [
    { key: "s", header: "Symbol", sort: (o) => o.symbol, cell: (o) => <span className="num font-semibold">{o.symbol}</span> },
    { key: "x", header: "Exch", cell: (o) => <span className="num text-muted-foreground">{o.exchange}</span> },
    { key: "d", header: "Dir", cell: (o) => <Tag tone={statusTone(o.direction)}>{o.direction}</Tag> },
    { key: "st", header: "Strategy", cell: (o) => strategyLabel[o.strategy] },
    { key: "sc", header: "Score", align: "right", sort: (o) => o.score, cell: (o) => o.score },
    { key: "cp", header: "Price", align: "right", cell: (o) => num(o.current_price) },
    { key: "e", header: "Entry", align: "right", cell: (o) => num(o.entry) },
    { key: "sl", header: "Stop", align: "right", cell: (o) => <span className="text-loss">{num(o.stop_loss)}</span> },
    { key: "tg", header: "Target", align: "right", cell: (o) => <span className="text-gain">{num(o.target)}</span> },
    { key: "rr", header: "R/R", align: "right", sort: (o) => o.reward_risk, cell: (o) => num(o.reward_risk) },
    { key: "r", header: "Risk", cell: (o) => <Tag tone={statusTone(o.risk_status)}>{o.risk_status}</Tag> },
    { key: "rs", header: "Research", cell: (o) => <Tag tone={statusTone(o.research_status)}>{o.research_status}</Tag> },
  ];

  return (
    <>
      <PageHeader title="Market Scanner" subtitle="NASDAQ · NYSE · XETRA" demo
        actions={<Button size="sm" onClick={() => scan.mutate()} disabled={scan.isPending}><Radar className="h-3.5 w-3.5" />{scan.isPending ? "Scanning…" : "Scan now"}</Button>} />
      <QueryView query={summary}>
        {(s) => (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Stat label="Instruments scanned" value={s.total_scanned} />
            <Stat label="Eligible" value={s.eligible} valueClass="text-gain" />
            <Stat label="Rejected" value={s.rejected} valueClass="text-loss" />
            <Stat label="Direction US / DE" value={<span className="text-sm">{s.market_direction.US} / {s.market_direction.DE}</span>} />
            <Stat label="Last scan" value={time(s.last_scan_at)} />
          </div>
        )}
      </QueryView>
      <Panel title="Multi-market monitor" bodyClass="p-0"
        right={<div className="flex flex-wrap items-center gap-1.5">
          <div className="relative"><Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={f.search} onChange={(e) => set("search")(e.target.value)} placeholder="Symbol" className="h-7 w-32 pl-7 text-xs" /></div>
          <F label="Market" value={f.market} onChange={set("market")} items={[["US", "USA"], ["DE", "Germany"]]} />
          <F label="Exchange" value={f.exchange} onChange={set("exchange")} items={[["NASDAQ", "NASDAQ"], ["NYSE", "NYSE"], ["XETRA", "XETRA"]]} />
          <F label="Trend" value={f.trend} onChange={set("trend")} items={[["UP", "Up"], ["DOWN", "Down"], ["SIDEWAYS", "Sideways"]]} />
          <F label="Strategy" value={f.strategy} onChange={set("strategy")} items={Object.entries(strategyLabel)} />
          <F label="Data" value={f.quality} onChange={set("quality")} items={[["LIVE", "Live"], ["DELAYED", "Delayed"], ["STALE", "Stale"]]} />
          <Button size="sm" variant={f.watch ? "default" : "outline"} className="h-7" onClick={() => set("watch")(!f.watch)}><Star className="h-3 w-3" />Watchlist</Button>
        </div>}>
        <QueryView query={instruments}>
          {() => (
            <div className="divide-y divide-border">
              {(["US", "DE"] as const).map((m) => {
                const rows = filtered.filter((i) => i.market === m);
                if (!rows.length) return null;
                return (
                  <div key={m}>
                    <div className="label-caps bg-muted/40 px-3 py-1.5">{m === "US" ? "United States · NASDAQ / NYSE" : "Germany · XETRA"}</div>
                    <DataTable rows={rows} cols={instCols} rowKey={(i) => i.symbol} />
                  </div>
                );
              })}
              {!filtered.length && <div className="p-6 text-center text-xs text-muted-foreground">No instruments match the filters.</div>}
            </div>
          )}
        </QueryView>
      </Panel>
      <Panel title="Scanner signals" bodyClass="p-0">
        <QueryView query={opps} empty={{ title: "No signals", hint: "Run a scan to generate signals." }}>
          {(rows) => <DataTable rows={rows} cols={oppCols} rowKey={(o) => o.id} pageSize={10} />}
        </QueryView>
      </Panel>
      <p className="text-[11px] text-muted-foreground">All prices shown are DEMO placeholders, not market data. {money(0)} executed.</p>
    </>
  );
}
