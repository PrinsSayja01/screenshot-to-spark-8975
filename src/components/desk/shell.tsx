import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, BarChart3, BookOpen, BrainCircuit, Briefcase, CheckSquare, LayoutDashboard,
  Radar, Settings, ShieldAlert, Target, User,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { q } from "@/lib/queries";
import { USE_MOCK } from "@/lib/api";
import { time } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tag, statusTone } from "./primitives";

const nav = [
  { title: "Overview", url: "/", icon: LayoutDashboard },
  { title: "Market Scanner", url: "/scanner", icon: Radar },
  { title: "Opportunities", url: "/opportunities", icon: Target },
  { title: "AI Research", url: "/research", icon: BrainCircuit },
  { title: "Trade Approvals", url: "/approvals", icon: CheckSquare },
  { title: "Open Positions", url: "/positions", icon: Briefcase },
  { title: "Trade Journal", url: "/journal", icon: BookOpen },
  { title: "Performance", url: "/performance", icon: BarChart3 },
  { title: "Risk Management", url: "/risk", icon: ShieldAlert },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

function DeskSidebar() {
  const { state } = useSidebar();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const proposals = useQuery(q.proposals);
  const pending = proposals.data?.filter((p) => p.status === "PENDING").length ?? 0;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1">
          <div className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary text-[11px] font-bold text-primary-foreground">
            AT
          </div>
          {state === "expanded" && (
            <div className="leading-tight">
              <div className="text-xs font-semibold tracking-wide">AI TRADING DESK</div>
              <div className="num text-[10px] text-muted-foreground">US · DE · INTRADAY</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.url}>
                  <SidebarMenuButton asChild isActive={path === n.url} tooltip={n.title}>
                    <Link to={n.url}>
                      <n.icon className="h-4 w-4" />
                      <span>{n.title}</span>
                      {n.url === "/approvals" && pending > 0 && (
                        <span className="num ml-auto rounded-sm bg-info/20 px-1 text-[10px] text-info">{pending}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Clock() {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    f();
    const i = setInterval(f, 1000);
    return () => clearInterval(i);
  }, []);
  return <span className="num text-xs text-muted-foreground">{t ?? "--:--:--"}</span>;
}

function TopBar() {
  const sys = useQuery(q.system);
  const health = useQuery(q.health);
  const connected = health.data?.status === "ok" && !USE_MOCK;
  const mode = sys.data?.mode ?? "PAPER";
  return (
    <header className="sticky top-0 z-20 flex h-11 items-center gap-3 border-b border-border bg-background/95 px-2 backdrop-blur">
      <SidebarTrigger />
      <div className="flex items-center gap-1.5">
        <Tag tone={mode === "PAPER" ? "info" : "loss"}>{mode}</Tag>
        <span
          title={sys.data?.live_authorized ? "LIVE authorized by backend" : "LIVE disabled until authorized by backend"}
          className="num cursor-not-allowed rounded-sm border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground opacity-50"
        >
          LIVE {sys.data?.live_authorized ? "" : "· LOCKED"}
        </span>
        {USE_MOCK && <Tag tone="warn">MOCK DATA</Tag>}
      </div>
      <div className="hidden items-center gap-3 md:flex">
        {(sys.data?.markets ?? []).map((m) => (
          <div key={m.market} className="flex items-center gap-1.5">
            <span className="label-caps">{m.market === "US" ? "US" : "DE"}</span>
            <Tag tone={statusTone(m.session)}>{m.session.replace("_", " ")}</Tag>
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1.5" title={USE_MOCK ? "Mock adapter active" : "FastAPI backend"}>
          <span className={cn("h-2 w-2 rounded-full", connected ? "bg-gain" : health.isPending ? "bg-warn" : "bg-loss")} />
          <span className="text-[11px] text-muted-foreground">
            {connected ? "Backend online" : health.isPending ? "Connecting…" : "Backend offline"}
          </span>
        </div>
        <div className="hidden items-center gap-1 lg:flex">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="label-caps">Data</span>
          <span className="num text-[11px]">{time(sys.data?.last_data_update)}</span>
        </div>
        <Clock />
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    </header>
  );
}

export function DeskShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DeskSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 space-y-3 p-3 md:p-4">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
