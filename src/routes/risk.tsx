import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { OctagonX, Power } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { q } from "@/lib/queries";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader, Panel, QueryView, Stat, Tag } from "@/components/desk/primitives";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Management · AI Trading Desk" },
      { name: "description", content: "Risk limits, daily loss tracking and the emergency kill switch." },
      { property: "og:title", content: "Risk Management · AI Trading Desk" },
      { property: "og:description", content: "Risk limits and emergency kill switch." },
    ],
  }),
  component: Risk,
});

function Risk() {
  const qc = useQueryClient();
  const sys = useQuery(q.system);
  const portfolio = useQuery(q.portfolio);
  const [confirm, setConfirm] = useState(false);
  const kill = useMutation({
    mutationFn: (active: boolean) => api.setKillSwitch(active),
    onSuccess: (r) => {
      if (r.accepted) toast.success(`Backend confirmed: kill switch ${r.active ? "ACTIVE" : "released"}`);
      else toast.error(`Backend declined: ${r.message}`);
      qc.invalidateQueries({ queryKey: ["system"] });
    },
    onError: (e) => toast.error(`Kill switch NOT confirmed: ${(e as Error).message}`),
  });
  return (
    <>
      <PageHeader title="Risk Management" demo />
      <QueryView query={sys}>
        {(s) => {
          const limit = (s.risk.capital * s.risk.daily_loss_limit_pct) / 100;
          const p = portfolio.data;
          const trades = p?.trades_today ?? 0;
          return (
            <>
              <section className={`panel flex flex-wrap items-center justify-between gap-4 border-2 p-4 ${s.kill_switch_active ? "border-loss" : "border-loss/40"}`}>
                <div className="flex items-center gap-3">
                  <OctagonX className="h-8 w-8 text-loss" />
                  <div>
                    <div className="text-sm font-semibold">Emergency kill switch</div>
                    <div className="text-xs text-muted-foreground">Halts all new proposals and requests flattening of positions. Status reflects backend confirmation only.</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag tone={s.kill_switch_active ? "loss" : "gain"}>{s.kill_switch_active ? "ACTIVE" : "ARMED"}</Tag>
                  <Button size="lg" variant="destructive" disabled={kill.isPending} onClick={() => setConfirm(true)}>
                    <Power className="h-4 w-4" />{kill.isPending ? "Sending…" : s.kill_switch_active ? "Release kill switch" : "Activate kill switch"}
                  </Button>
                </div>
              </section>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                <Stat label="Account equity" value={money(p?.equity)} />
                <Stat label="Risk per trade" value={`${s.risk.risk_per_trade_pct}%`} sub={money((s.risk.capital * s.risk.risk_per_trade_pct) / 100)} />
                <Stat label="Daily loss limit" value={`${s.risk.daily_loss_limit_pct}%`} sub={money(limit)} />
                <Stat label="Current daily loss" value={money(s.current_daily_loss)} valueClass={s.current_daily_loss > 0 ? "text-loss" : ""} />
                <Stat label="Consecutive losses" value={s.consecutive_losses} />
                <Stat label="Max trades" value={s.risk.max_trades_per_day} />
                <Stat label="Trades remaining" value={s.risk.max_trades_per_day - trades} />
                <Stat label="Open positions" value={`${p?.open_positions ?? 0}/${s.risk.max_open_positions}`} />
                <Stat label="Leverage" value={s.risk.leverage_enabled ? "ON" : "OFF"} valueClass={s.risk.leverage_enabled ? "text-loss" : "text-gain"} />
                <Stat label="Kill switch" value={s.kill_switch_active ? "ACTIVE" : "ARMED"} valueClass={s.kill_switch_active ? "text-loss" : "text-gain"} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Panel title="Daily loss usage">
                  <Progress value={limit ? (s.current_daily_loss / limit) * 100 : 0} className="h-2" />
                  <div className="num mt-1.5 text-[11px] text-muted-foreground">{money(s.current_daily_loss)} / {money(limit)}</div>
                </Panel>
                <Panel title="Trade allowance">
                  <Progress value={(trades / s.risk.max_trades_per_day) * 100} className="h-2" />
                  <div className="num mt-1.5 text-[11px] text-muted-foreground">{trades} / {s.risk.max_trades_per_day} trades</div>
                </Panel>
                <Panel title="Rules" className="md:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    <Tag tone={s.risk.short_selling_enabled ? "warn" : "muted"}>Short selling {s.risk.short_selling_enabled ? "on" : "off"}</Tag>
                    <Tag tone={s.risk.overnight_enabled ? "warn" : "muted"}>Overnight {s.risk.overnight_enabled ? "on" : "off"}</Tag>
                    <Tag tone="info">Risk validated by backend only</Tag>
                  </div>
                </Panel>
              </div>
              <AlertDialog open={confirm} onOpenChange={setConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{s.kill_switch_active ? "Release" : "Activate"} kill switch?</AlertDialogTitle>
                    <AlertDialogDescription>This sends a request to the backend. The status changes only after the backend confirms.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => kill.mutate(!s.kill_switch_active)}>Send request</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          );
        }}
      </QueryView>
    </>
  );
}
