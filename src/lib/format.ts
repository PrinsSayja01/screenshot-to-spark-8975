export const money = (v: number | null | undefined, cur = "EUR") =>
  v == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(v);
export const num = (v: number | null | undefined, d = 2) => (v == null ? "—" : v.toFixed(d));
export const pct = (v: number | null | undefined, d = 2) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(d)}%`;
export const compact = (v: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(v);
export const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString("en-GB", { hour12: false }) : "—";
export const strategyLabel: Record<string, string> = {
  VWAP_PULLBACK: "VWAP Pullback",
  MOMENTUM: "Momentum",
  OPENING_RANGE_BREAKOUT: "Opening Range Breakout",
};
export const tone = (v: number | null | undefined) =>
  v == null || v === 0 ? "text-muted-foreground" : v > 0 ? "text-gain" : "text-loss";
