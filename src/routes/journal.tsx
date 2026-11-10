import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import type { JournalEntry } from "@/lib/api/types";
import { q } from "@/lib/queries";
import { money, num, strategyLabel, tone } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Panel, QueryView, Tag, statusTone } from "@/components/desk/primitives";
import { DataTable, type Col } from "@/components/desk/data-table";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Trade Journal · AI Trading Desk" },
      { name: "description", content: "Searchable journal of every trade with AI explanation and your decision." },
      { property: "og:title", content: "Trade Journal · AI Trading Desk" },
      { property: "og:description", content: "Searchable trade journal." },
    ],
  }),
  component: Journal,
});

const cols: Col<JournalEntry>[] = [
  { key: "d", header: "Date", sort: (j) => j.date, cell: (j) => <span className="num">{j.date}</span> },
  { key: "s", header: "Instrument", sort: (j) => j.symbol, cell: (j) => <span className="num font-semibold">{j.symbol}</span> },
  { key: "st", header: "Strategy", cell: (j) => strategyLabel[j.strategy] },
  { key: "dir", header: "Dir", cell: (j) => <Tag tone={statusTone(j.direction)}>{j.direction}</Tag> },
  { key: "e", header: "Entry", align: "right", cell: (j) => num(j.entry) },
  { key: "x", header: "Exit", align: "right", cell: (j) => num(j.exit) },
  { key: "q", header: "Qty", align: "right", cell: (j) => j.quantity },
  { key: "g", header: "Gross", align: "right", cell: (j) => money(j.gross_pnl) },
  { key: "f", header: "Fees", align: "right", cell: (j) => money(j.fees) },
  { key: "n", header: "Net", align: "right", sort: (j) => j.net_pnl, cell: (j) => <span className={tone(j.net_pnl)}>{money(j.net_pnl)}</span> },
  { key: "r", header: "Result", cell: (j) => <Tag tone={statusTone(j.result)}>{j.result}</Tag> },
  { key: "ai", header: "AI explanation", cell: (j) => <span className="block max-w-xs truncate text-muted-foreground" title={j.ai_explanation}>{j.ai_explanation}</span> },
  { key: "u", header: "Decision", cell: (j) => <Tag tone={statusTone(j.user_decision)}>{j.user_decision}</Tag> },
];

function Journal() {
  const journal = useQuery(q.journal);
  const [f, setF] = useState({ search: "", market: "ALL", strategy: "ALL", result: "ALL", from: "", to: "" });
  const rows = useMemo(() => (journal.data ?? []).filter((j) =>
    j.symbol.toLowerCase().includes(f.search.toLowerCase()) &&
    (f.market === "ALL" || j.market === f.market) &&
    (f.strategy === "ALL" || j.strategy === f.strategy) &&
    (f.result === "ALL" || j.result === f.result) &&
    (!f.from || j.date >= f.from) && (!f.to || j.date <= f.to)), [journal.data, f]);
  const sel = (k: "market" | "strategy" | "result", items: [string, string][]) => (
    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
      <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="ALL">All {k}</SelectItem>{items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
  return (
    <>
      <PageHeader title="Trade Journal" />
      <Panel bodyClass="p-0" title="Trades" right={
        <div className="flex flex-wrap gap-1.5">
          <Input placeholder="Search symbol" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} className="h-7 w-32 text-xs" />
          {sel("market", [["US", "USA"], ["DE", "Germany"]])}
          {sel("strategy", Object.entries(strategyLabel))}
          {sel("result", [["WIN", "Win"], ["LOSS", "Loss"], ["BREAKEVEN", "Breakeven"]])}
          <Input type="date" aria-label="From date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className="h-7 w-36 text-xs" />
          <Input type="date" aria-label="To date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className="h-7 w-36 text-xs" />
        </div>}>
        <QueryView query={journal} empty={{ title: "No journal entries yet", hint: "Closed trades recorded by the backend appear here." }}>
          {() => rows.length ? <DataTable rows={rows} cols={cols} rowKey={(j) => j.id} /> : <div className="p-6 text-center text-xs text-muted-foreground">No entries match the filters.</div>}
        </QueryView>
      </Panel>
    </>
  );
}
