import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { Candle } from "@/lib/api/types";

const axis = { stroke: "var(--color-muted-foreground)", fontSize: 10, tickLine: false, axisLine: false } as const;
const tip = {
  contentStyle: { background: "var(--color-popover)", border: "1px solid var(--color-border)", fontSize: 11, borderRadius: 4 },
  labelStyle: { color: "var(--color-muted-foreground)" },
};

export function EquityChart({ data, height = 200 }: { data: { date: string; equity: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="date" {...axis} />
        <YAxis {...axis} width={44} domain={["auto", "auto"]} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="equity" stroke="var(--color-info)" strokeWidth={1.5} fill="url(#eq)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PnlBars({ data, height = 200, x = "date" }: { data: { pnl: number }[]; height?: number; x?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey={x} {...axis} />
        <YAxis {...axis} width={44} />
        <Tooltip {...tip} cursor={{ fill: "var(--color-muted)" }} />
        <ReferenceLine y={0} stroke="var(--color-border)" />
        <Bar dataKey="pnl">
          {data.map((d, i) => (
            <Cell key={i} fill={d.pnl >= 0 ? "var(--color-gain)" : "var(--color-loss)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Intraday candlestick (body as range bar) with entry / stop / target lines. */
export function PriceChart({ candles, levels, height = 260 }: {
  candles: Candle[];
  levels?: { entry?: number; stop?: number; target?: number; vwap?: number };
  height?: number;
}) {
  const data = candles.map((c) => ({
    t: new Date(c.time * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    body: [Math.min(c.open, c.close), Math.max(c.open, c.close)] as [number, number],
    wick: [c.low, c.high] as [number, number],
    close: c.close,
    up: c.close >= c.open,
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="t" {...axis} minTickGap={40} />
        <YAxis {...axis} width={48} domain={["auto", "auto"]} orientation="right" />
        <Tooltip {...tip} />
        <Bar dataKey="wick" barSize={1}>
          {data.map((d, i) => <Cell key={i} fill={d.up ? "var(--color-gain)" : "var(--color-loss)"} />)}
        </Bar>
        <Bar dataKey="body" barSize={5}>
          {data.map((d, i) => <Cell key={i} fill={d.up ? "var(--color-gain)" : "var(--color-loss)"} />)}
        </Bar>
        <Line dataKey="close" stroke="transparent" dot={false} />
        {levels?.entry && <ReferenceLine y={levels.entry} stroke="var(--color-info)" strokeDasharray="4 3" label={{ value: "ENTRY", fill: "var(--color-info)", fontSize: 9, position: "insideLeft" }} />}
        {levels?.stop && <ReferenceLine y={levels.stop} stroke="var(--color-loss)" strokeDasharray="4 3" label={{ value: "STOP", fill: "var(--color-loss)", fontSize: 9, position: "insideLeft" }} />}
        {levels?.target && <ReferenceLine y={levels.target} stroke="var(--color-gain)" strokeDasharray="4 3" label={{ value: "TARGET", fill: "var(--color-gain)", fontSize: 9, position: "insideLeft" }} />}
        {levels?.vwap && <ReferenceLine y={levels.vwap} stroke="var(--color-warn)" strokeDasharray="1 3" />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
