import { ExternalLink } from "lucide-react";
import type { ResearchReport, ResearchSource } from "@/lib/api/types";
import { Empty, Tag, statusTone } from "./primitives";

function Sources({ title, items }: { title: string; items: ResearchSource[] }) {
  return (
    <div>
      <div className="label-caps mb-1.5">{title}</div>
      {items.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">No sources returned by backend.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((s) => (
            <li key={s.url} className="rounded-sm border border-border p-2 text-xs">
              <a href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-1 font-medium text-info hover:underline">
                {s.title} <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
              </a>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{s.source_name}</span>
                <span className="num">{new Date(s.published_at).toLocaleString("en-GB")}</span>
                <span className="num">Relevance {Math.round(s.relevance * 100)}%</span>
                <Tag tone={statusTone(s.status)}>{s.status}</Tag>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bullets({ title, items, cls }: { title: string; items: string[]; cls: string }) {
  return (
    <div>
      <div className="label-caps mb-1.5">{title}</div>
      {items.length === 0 ? <div className="text-[11px] text-muted-foreground">None reported.</div> : (
        <ul className={`list-disc space-y-0.5 pl-4 text-xs ${cls}`}>{items.map((i) => <li key={i}>{i}</li>)}</ul>
      )}
    </div>
  );
}

/** Renders only what the backend returns. Nothing is generated client-side. */
export function ResearchBody({ r }: { r: ResearchReport }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="label-caps">Sentiment</span>
        <Tag tone={r.sentiment === "BULLISH" ? "gain" : r.sentiment === "BEARISH" ? "loss" : "muted"}>{r.sentiment}</Tag>
        <span className="num text-[11px] text-muted-foreground">{r.generated_at ? new Date(r.generated_at).toLocaleString("en-GB") : "Not generated"}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Sources title="Financial news" items={r.financial_news} />
        <Sources title="Company news" items={r.company_news} />
        <Sources title="Earnings" items={r.earnings} />
        <Sources title="Economic events" items={r.economic_events} />
        <Bullets title="Bullish evidence" items={r.bullish_evidence} cls="text-gain" />
        <Bullets title="Bearish evidence" items={r.bearish_evidence} cls="text-loss" />
        <Bullets title="Missing information" items={r.missing_information} cls="text-warn" />
      </div>
      <div>
        <div className="label-caps mb-1.5">Conclusion</div>
        {r.conclusion ? <p className="text-xs">{r.conclusion}</p> : <Empty title="No conclusion" hint="The backend has not produced a research conclusion." />}
      </div>
    </div>
  );
}
