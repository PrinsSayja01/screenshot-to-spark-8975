import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Order, Position } from "@/lib/api/types";
import { q } from "@/lib/queries";
import { money, num, time, tone } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, Panel, QueryView, Tag, statusTone } from "@/components/desk/primitives";
import { DataTable, type Col } from "@/components/desk/data-table";

export const Route = createFileRoute("/positions")({
  head: () => ({
    meta: [
      { title: "Open Positions · AI Trading Desk" },
      { name: "description", content: "Open positions, unrealized P&L and order history." },
      { property: "og:title", content: "Open Positions · AI Trading Desk" },
      { property: "og:description", content: "Position management and order history." },
    ],
  }),
  component: Positions,
});

function Positions() {
  const qc = useQueryClient();
  const positions = useQuery(q.positions);
  const orders = useQuery(q.orders);
  const [closing, setClosing] = useState<Position | null>(null);
  const close = useMutation({
    mutationFn: (id: string) => api.requestClosePosition(id),
    onSuccess: (r) => {
      if (r.accepted) toast.success(`Close request accepted by backend: ${r.message}`);
      else toast.error(`Backend declined: ${r.message}`);
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const pCols: Col<Position>[] = [
    { key: "s", header: "Instrument", cell: (p) => <span className="num font-semibold">{p.symbol}</span> },
    { key: "d", header: "Dir", cell: (p) => <Tag tone={statusTone(p.direction)}>{p.direction}</Tag> },
    { key: "e", header: "Entry", align: "right", cell: (p) => num(p.entry_price) },
    { key: "c", header: "Current", align: "right", cell: (p) => num(p.current_price) },
    { key: "q", header: "Qty", align: "right", cell: (p) => p.quantity },
    { key: "sl", header: "Stop", align: "right", cell: (p) => num(p.stop_loss) },
    { key: "t", header: "Target", align: "right", cell: (p) => num(p.target) },
    { key: "u", header: "Unrealized", align: "right", cell: (p) => <span className={tone(p.unrealized_pnl)}>{money(p.unrealized_pnl, p.currency)}</span> },
    { key: "r", header: "Realized", align: "right", cell: (p) => <span className={tone(p.realized_pnl)}>{money(p.realized_pnl, p.currency)}</span> },
    { key: "st", header: "Status", cell: (p) => <Tag tone={statusTone(p.status)}>{p.status}</Tag> },
    { key: "a", header: "", cell: (p) => <Button size="sm" variant="outline" className="h-6 text-[11px]" disabled={p.status !== "OPEN"} onClick={() => setClosing(p)}>Request close</Button> },
  ];
  const oCols: Col<Order>[] = [
    { key: "t", header: "Time", cell: (o) => <span className="num">{time(o.created_at)}</span> },
    { key: "id", header: "Order", cell: (o) => <span className="num text-muted-foreground">{o.id}</span> },
    { key: "s", header: "Symbol", cell: (o) => <span className="num font-semibold">{o.symbol}</span> },
    { key: "sd", header: "Side", cell: (o) => o.side },
    { key: "q", header: "Qty", align: "right", cell: (o) => o.quantity },
    { key: "ty", header: "Type", cell: (o) => o.type },
    { key: "p", header: "Price", align: "right", cell: (o) => num(o.price) },
    { key: "m", header: "Mode", cell: (o) => <Tag tone={o.mode === "PAPER" ? "info" : "loss"}>{o.mode}</Tag> },
    { key: "st", header: "Status", cell: (o) => <Tag tone={statusTone(o.status)}>{o.status}</Tag> },
  ];
  return (
    <>
      <PageHeader title="Open Positions" subtitle="Max 1 open position · no overnight holding" />
      <Panel title="Positions" bodyClass="p-0">
        <QueryView query={positions} empty={{ title: "No open positions", hint: "Positions confirmed by the backend appear here." }}>
          {(rows) => <DataTable rows={rows} cols={pCols} rowKey={(p) => p.id} />}
        </QueryView>
      </Panel>
      <Panel title="Order history" bodyClass="p-0">
        <QueryView query={orders} empty={{ title: "No orders", hint: "Only orders confirmed by the backend are listed." }}>
          {(rows) => <DataTable rows={rows} cols={oCols} rowKey={(o) => o.id} />}
        </QueryView>
      </Panel>
      <AlertDialog open={!!closing} onOpenChange={(o) => !o && setClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request close of {closing?.symbol}?</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a close request to the backend. The position is only closed once the backend confirms it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => closing && close.mutate(closing.id)}>Send close request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
