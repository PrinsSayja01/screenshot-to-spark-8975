import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UseQueryResult } from "@tanstack/react-query";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("num rounded-sm border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[10px] font-semibold text-warn", className)}>
      DEMO
    </span>
  );
}

type Tone = "gain" | "loss" | "info" | "warn" | "muted";
const toneCls: Record<Tone, string> = {
  gain: "border-gain/40 bg-gain/10 text-gain",
  loss: "border-loss/40 bg-loss/10 text-loss",
  info: "border-info/40 bg-info/10 text-info",
  warn: "border-warn/40 bg-warn/10 text-warn",
  muted: "border-border bg-muted text-muted-foreground",
};
export function Tag({ tone = "muted", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("num inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase", toneCls[tone], className)}>
      {children}
    </span>
  );
}
export const statusTone = (s: string): Tone =>
  ({ APPROVED: "gain", COMPLETE: "gain", OPEN: "gain", LIVE: "gain", UP: "gain", LONG: "info", WIN: "gain",
     WARNING: "warn", PARTIAL: "warn", DELAYED: "warn", PENDING: "info", PRE_MARKET: "warn", AFTER_HOURS: "warn",
     REJECTED: "loss", STALE: "loss", DOWN: "loss", SHORT: "loss", LOSS: "loss", EXPIRED: "muted" } as Record<string, Tone>)[s] ?? "muted";

export function PageHeader({ title, subtitle, actions, demo }: { title: string; subtitle?: string; actions?: ReactNode; demo?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, right, children, className, bodyClass }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="label-caps">{title}</h2>
          {right}
        </header>
      )}
      <div className={cn("flex-1 p-3", bodyClass)}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, sub, valueClass }: { label: string; value: ReactNode; sub?: ReactNode; valueClass?: string }) {
  return (
    <div className="panel px-3 py-2.5">
      <div className="label-caps">{label}</div>
      <div className={cn("num mt-1 text-lg font-semibold", valueClass)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
      <Inbox className="h-5 w-5 text-muted-foreground" />
      <div className="text-xs font-medium">{title}</div>
      {hint && <div className="max-w-sm text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <AlertTriangle className="h-5 w-5 text-loss" />
      <div className="text-xs text-loss">{(error as Error)?.message ?? "Request failed"}</div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RotateCw className="h-3 w-3" /> Retry
        </Button>
      )}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

/** Renders loading / error / empty / data states for a query. */
export function QueryView<D>({ query, empty, isEmpty, children }: {
  query: UseQueryResult<D>;
  empty?: { title: string; hint?: string };
  isEmpty?: (d: D) => boolean;
  children: (d: D) => ReactNode;
}) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (empty && (isEmpty ? isEmpty(query.data) : Array.isArray(query.data) && query.data.length === 0))
    return <Empty {...empty} />;
  return <>{children(query.data)}</>;
}
