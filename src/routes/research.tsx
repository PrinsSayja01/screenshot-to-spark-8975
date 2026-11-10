import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { q } from "@/lib/queries";
import { PageHeader, Panel, QueryView } from "@/components/desk/primitives";
import { ResearchBody } from "@/components/desk/research-body";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research · AI Trading Desk" },
      { name: "description", content: "Market sentiment, news, earnings and economic events from the research service." },
      { property: "og:title", content: "AI Research · AI Trading Desk" },
      { property: "og:description", content: "Sourced market research for US and German markets." },
    ],
  }),
  component: Research,
});

function Research() {
  const r = useQuery(q.research("market"));
  return (
    <>
      <PageHeader title="AI Research Center" subtitle="Only sourced research from the backend is shown. No news is generated in the browser." />
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="US market summary">
          <QueryView query={r}>{(d) => <p className="text-xs text-muted-foreground">{d.us_summary ?? "No summary available from backend."}</p>}</QueryView>
        </Panel>
        <Panel title="German market summary">
          <QueryView query={r}>{(d) => <p className="text-xs text-muted-foreground">{d.de_summary ?? "No summary available from backend."}</p>}</QueryView>
        </Panel>
      </div>
      <Panel title="Market research">
        <QueryView query={r}>{(d) => <ResearchBody r={d} />}</QueryView>
      </Panel>
    </>
  );
}
