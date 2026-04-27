"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Boxes,
  Command,
  Database,
  Download,
  Gauge,
  Layers,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Stethoscope,
  TerminalSquare,
  TrendingUp,
  X,
} from "lucide-react";
import { Csdm3dUniverse } from "@/components/Csdm3dUniverse";

type Stage = "foundation" | "crawl" | "walk" | "run" | "fly";
type Domain = "foundational" | "design" | "build" | "technical-services" | "sell-consume";

type TableProbe = { table: string; available: boolean; count: number };

type DomainScore = {
  domain: Domain;
  label: string;
  score: number;
  stage: Stage;
  blockers: number;
  evidence: string;
  tables?: TableProbe[];
};

type Agent = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  tagline: string;
  insights: Array<{ title: string; detail: string }>;
};

type Analysis = {
  instanceName: string;
  instanceUrl: string;
  overallScore: number;
  globalStage: Stage;
  progressToNext: number;
  csdmVersion: string;
  domains: DomainScore[];
  agents: Agent[];
  insights: Array<{ title: string; detail: string }>;
  generatedAt: string;
};

type Tab = "overview" | "map" | "domains" | "agents" | "activity" | "settings";

const stageLabels: Record<Stage, string> = {
  foundation: "Foundation",
  crawl: "Crawl",
  walk: "Walk",
  run: "Run",
  fly: "Fly",
};

const domainOrder: Domain[] = ["foundational", "design", "build", "technical-services", "sell-consume"];

const demoAnalysis: Analysis = {
  instanceName: "Demo Customer",
  instanceUrl: "https://demo.service-now.com",
  overallScore: 70,
  globalStage: "crawl",
  progressToNext: 42,
  csdmVersion: "CSDM 5.0",
  generatedAt: new Date().toISOString(),
  domains: [
    {
      domain: "foundational",
      label: "Foundational Data",
      score: 84,
      stage: "walk",
      blockers: 1,
      evidence: "Company, location and core CI records have enough quality to support next-stage governance.",
    },
    {
      domain: "design",
      label: "Design",
      score: 70,
      stage: "crawl",
      blockers: 3,
      evidence: "Business application ownership and lifecycle fields need stronger consistency.",
    },
    {
      domain: "build",
      label: "Build",
      score: 64,
      stage: "crawl",
      blockers: 4,
      evidence: "Application services exist, but relationship depth is not strong enough for run-stage automation.",
    },
    {
      domain: "technical-services",
      label: "Manage Technical Services",
      score: 76,
      stage: "walk",
      blockers: 2,
      evidence: "Technical services are visible, but service offering alignment still limits operational use.",
    },
    {
      domain: "sell-consume",
      label: "Sell / Consume Services",
      score: 57,
      stage: "crawl",
      blockers: 5,
      evidence: "Customer-facing service portfolio traceability is the weakest maturity signal.",
    },
  ],
  agents: [
    {
      id: "pierrondi-ea",
      name: "Paulo Pierrondi",
      role: "Enterprise Architect",
      avatar: "PP",
      color: "#5e6ad2",
      tagline: "Strategy, exec narrative, CSDM 5.0 roadmap.",
      insights: [
        {
          title: "Executive narrative",
          detail:
            "Crawl maturity. Position CSDM 5.0 as the operating backbone for ITOM, Service Mapping and Now Assist trust — sell incremental wins, not a multi-year program.",
        },
        {
          title: "Where to start",
          detail:
            "Sell / Consume Services scored lowest (57). Make portfolio traceability and business service ownership the first remediation workshop and tie it to a measurable KPI.",
        },
        {
          title: "AI readiness implication",
          detail:
            "Now Assist outputs are high-risk on this data shape. Use AI for explanation and prioritization, keep autonomous action governed.",
        },
      ],
    },
    {
      id: "itom-doctor",
      name: "ITOM Doctor",
      role: "CMDB & Discovery Specialist",
      avatar: "Rx",
      color: "#26b58a",
      tagline: "CMDB health, Discovery coverage, Service Mapping signals.",
      insights: [
        {
          title: "CMDB health",
          detail:
            "Foundational layer at 84/100 — good baseline. Push for CI relationship density and reduce orphan CIs before scaling Discovery patterns.",
        },
        {
          title: "Discovery & Service Mapping",
          detail:
            "Build domain at 64/100. Application Service population is the leading indicator — this signal says Service Mapping has not been run end-to-end.",
        },
        {
          title: "CMDB Health backlog",
          detail:
            "15 blockers across the 5 domains. Treat them as a CMDB Health dashboard backlog, not a single program.",
        },
      ],
    },
  ],
  insights: [
    {
      title: "Executive narrative",
      detail:
        "Crawl maturity. Position CSDM 5.0 as the operating backbone for ITOM, Service Mapping and Now Assist trust.",
    },
    {
      title: "CMDB health",
      detail:
        "Foundational layer at 84/100 — good baseline. Push for CI relationship density.",
    },
  ],
};

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("architect@company.com");
  const [password, setPassword] = useState("demo");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [instanceUrl, setInstanceUrl] = useState("");
  const [username, setUsername] = useState("");
  const [instancePassword, setInstancePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [connectOpen, setConnectOpen] = useState(false);

  const ranked = useMemo(
    () => [...(analysis?.domains ?? [])].sort((a, b) => a.score - b.score),
    [analysis],
  );

  const totalBlockers = useMemo(
    () => (analysis?.domains ?? []).reduce((acc, d) => acc + d.blockers, 0),
    [analysis],
  );

  function handleLogin() {
    if (!email || !password) return;
    setLoggedIn(true);
  }

  async function runLiveAnalysis(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/servicenow/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceUrl, username, password: instancePassword }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to analyze this instance.");
      setAnalysis(payload.analysis);
      setConnectOpen(false);
      setTab("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  if (!loggedIn) {
    return <LoginScreen email={email} password={password} setEmail={setEmail} setPassword={setPassword} onSubmit={handleLogin} />;
  }

  return (
    <main className="relative z-10 min-h-screen text-[var(--text)]">
      <TopBar
        instanceName={analysis?.instanceName}
        onConnect={() => setConnectOpen(true)}
        onDemo={() => setAnalysis(demoAnalysis)}
        onSignOut={() => setLoggedIn(false)}
      />
      <Tabs current={tab} onChange={setTab} />

      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 md:px-6 md:pb-10">
        {tab === "overview" && (
          <Overview
            analysis={analysis}
            ranked={ranked}
            totalBlockers={totalBlockers}
            onConnect={() => setConnectOpen(true)}
            onDemo={() => setAnalysis(demoAnalysis)}
            onJump={(t) => setTab(t)}
          />
        )}
        {tab === "map" && <MapTab analysis={analysis} />}
        {tab === "domains" && <DomainsTab analysis={analysis} />}
        {tab === "agents" && <AgentsTab analysis={analysis} />}
        {tab === "activity" && <ActivityTab analysis={analysis} />}
        {tab === "settings" && <SettingsTab analysis={analysis} onDownload={() => downloadReport(analysis)} />}
      </div>

      <MobileTabBar current={tab} onChange={setTab} />

      {connectOpen && (
        <ConnectModal
          instanceUrl={instanceUrl}
          username={username}
          password={instancePassword}
          loading={loading}
          error={error}
          setInstanceUrl={setInstanceUrl}
          setUsername={setUsername}
          setPassword={setInstancePassword}
          onClose={() => setConnectOpen(false)}
          onSubmit={runLiveAnalysis}
        />
      )}
    </main>
  );
}

/* ──────────────────────────── Top bar ──────────────────────────── */

function TopBar({
  instanceName,
  onConnect,
  onDemo,
  onSignOut,
}: {
  instanceName?: string;
  onConnect: () => void;
  onDemo: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {/* Triangle mark */}
          <span className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 76 65" fill="none" aria-hidden>
              <path d="M37.527.5L75.054 65H0L37.527.5z" fill="currentColor" />
            </svg>
          </span>
          <Slash />
          <div className="flex items-center gap-1.5">
            <Avatar text="PP" size={20} bg="#5e6ad2" />
            <span className="hidden text-[13px] font-medium md:inline">paulo</span>
          </div>
          <Slash />
          <button className="flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-[var(--bg-elev-1)]">
            <span className="truncate text-[13px] font-medium">CSDM3D</span>
            <span className="hidden rounded border border-[var(--border)] bg-[var(--bg-elev-2)] px-1 py-px text-[9.5px] font-medium uppercase tracking-wider text-[var(--text-2)] sm:inline">
              Pro
            </span>
            <ChevronUpDown />
          </button>
          {instanceName && (
            <>
              <Slash />
              <span className="hidden items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-2 py-1 text-[11.5px] text-[var(--text-2)] md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
                {instanceName}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <SearchHint />
          <button
            onClick={onDemo}
            className="hidden rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-2.5 py-1.5 text-[12.5px] text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text)] md:inline-flex"
          >
            Load demo
          </button>
          <button
            onClick={onConnect}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-[12.5px] font-medium text-black hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Connect instance
          </button>
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] p-1.5 text-[var(--text-2)] hover:text-[var(--text)]"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Tabs({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const items: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "map", label: "Map" },
    { id: "domains", label: "Domains" },
    { id: "agents", label: "Agents" },
    { id: "activity", label: "Activity" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <nav className="sticky top-14 z-30 border-b border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-2 md:px-4">
        {items.map((item) => {
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`relative whitespace-nowrap px-3 py-3 text-[13px] transition-colors ${
                active ? "text-[var(--text)]" : "text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
              {active && <span className="absolute inset-x-3 -bottom-px h-px bg-[var(--text)]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ──────────────────────────── Overview tab ──────────────────────────── */

function Overview({
  analysis,
  ranked,
  totalBlockers,
  onConnect,
  onDemo,
  onJump,
}: {
  analysis: Analysis | null;
  ranked: DomainScore[];
  totalBlockers: number;
  onConnect: () => void;
  onDemo: () => void;
  onJump: (t: Tab) => void;
}) {
  if (!analysis) {
    return <EmptyState onConnect={onConnect} onDemo={onDemo} />;
  }

  return (
    <div className="space-y-4">
      {/* Page heading */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight md:text-[28px]">
            {analysis.instanceName}
          </h1>
          <p className="text-[13px] text-[var(--text-2)]">
            {analysis.csdmVersion} · {stageLabels[analysis.globalStage]} maturity ·{" "}
            <span className="font-mono text-[var(--text-3)]">{analysis.instanceUrl}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onJump("map")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-2.5 py-1.5 text-[12px] hover:border-[var(--border-strong)]"
          >
            View map <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onJump("settings")}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-2.5 py-1.5 text-[12px] hover:border-[var(--border-strong)]"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Overall score"
          value={String(analysis.overallScore)}
          unit="/100"
          delta={`+${analysis.progressToNext}% to next`}
          color={scoreColor(analysis.overallScore)}
        />
        <MetricTile
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Maturity stage"
          value={stageLabels[analysis.globalStage]}
          unit=""
          delta="CSDM 5.0 ladder"
        />
        <MetricTile
          icon={<Layers className="h-3.5 w-3.5" />}
          label="Domains scored"
          value={String(analysis.domains.length)}
          unit="/5"
          delta="Anchor table probe"
        />
        <MetricTile
          icon={<Boxes className="h-3.5 w-3.5" />}
          label="Open blockers"
          value={String(totalBlockers)}
          unit=""
          delta={`${ranked[0]?.label ?? "—"} weakest`}
          color="var(--danger)"
        />
      </div>

      {/* Bento row 1: 3D + activity */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Maturity universe" subtitle="3D map of CSDM 5.0 anchor tables">
          <div className="-mx-px -mb-px overflow-hidden rounded-b-[var(--radius)]">
            <Csdm3dUniverse analysis={analysis} />
          </div>
        </Card>
        <Card title="Activity" subtitle="Last 24h" actions={<button className="text-[11.5px] text-[var(--text-2)] hover:text-[var(--text)]" onClick={() => onJump("activity")}>View all</button>}>
          <ActivityFeed analysis={analysis} />
        </Card>
      </div>

      {/* Bento row 2: domains + agents */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Domain scores" subtitle="Sorted by lowest score">
          <DomainTable domains={ranked} />
        </Card>
        <Card title="Specialist agents" subtitle={`${analysis.agents.length} active`}>
          <div className="space-y-2.5 p-3">
            {analysis.agents.map((agent) => (
              <AgentMini key={agent.id} agent={agent} />
            ))}
          </div>
        </Card>
      </div>

      {/* Bento row 3: insights */}
      <Card title="Top insights" subtitle="From the agent panel">
        <div className="grid grid-cols-1 gap-px bg-[var(--border)] md:grid-cols-2">
          {analysis.agents.flatMap((a) =>
            a.insights.slice(0, 2).map((insight) => (
              <div key={`${a.id}-${insight.title}`} className="bg-[var(--bg-elev-1)] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Avatar text={a.avatar} size={18} bg={a.color} />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-3)]">
                    {a.role}
                  </span>
                </div>
                <p className="text-[13px] font-medium">{insight.title}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--text-2)]">{insight.detail}</p>
              </div>
            )),
          )}
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────────── Tabs ──────────────────────────── */

function MapTab({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) return <EmptyState />;
  return (
    <Card title="Maturity universe" subtitle={`${analysis.instanceName} · ${stageLabels[analysis.globalStage]}`}>
      <div className="-mx-px -mb-px overflow-hidden rounded-b-[var(--radius)]">
        <Csdm3dUniverse analysis={analysis} />
      </div>
    </Card>
  );
}

function DomainsTab({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) return <EmptyState />;
  return (
    <Card title="CSDM 5.0 domains" subtitle="Anchor-table probe + score">
      <DomainTable domains={domainOrder.map((id) => analysis.domains.find((d) => d.domain === id)!).filter(Boolean)} />
    </Card>
  );
}

function AgentsTab({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {analysis.agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

function ActivityTab({ analysis }: { analysis: Analysis | null }) {
  if (!analysis) return <EmptyState />;
  return (
    <Card title="Activity" subtitle="Latest probes and agent reasoning">
      <ActivityFeed analysis={analysis} extended />
    </Card>
  );
}

function SettingsTab({ analysis, onDownload }: { analysis: Analysis | null; onDownload: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card title="Export" subtitle="Audit-friendly JSON snapshot">
        <div className="p-4">
          <button
            onClick={onDownload}
            disabled={!analysis}
            className="flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-3 py-2.5 text-[13px] hover:border-[var(--border-strong)] disabled:opacity-50"
          >
            <span>
              <span className="block font-medium">Download report</span>
              <span className="block text-[11px] text-[var(--text-3)]">domains · scores · tables · agents</span>
            </span>
            <Download className="h-4 w-4 text-[var(--text-2)]" />
          </button>
        </div>
      </Card>
      <Card title="Connection" subtitle="ServiceNow Table API probe">
        <div className="p-4 text-[12.5px] text-[var(--text-2)]">
          <p>Credentials are never persisted server-side — they live only in the request body and Basic-auth header per call.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
            <KV k="Instance" v={analysis?.instanceUrl ?? "—"} />
            <KV k="Generated" v={analysis ? new Date(analysis.generatedAt).toLocaleString() : "—"} />
            <KV k="CSDM" v={analysis?.csdmVersion ?? "—"} />
            <KV k="Stage" v={analysis ? stageLabels[analysis.globalStage] : "—"} />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────────── Building blocks ──────────────────────────── */

function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-1)] ${className}`}
    >
      {(title || subtitle) && (
        <header className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            {title && <h2 className="text-[13.5px] font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--text-3)]">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  delta,
  color = "var(--text)",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  delta: string;
  color?: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-elev-1)] p-4 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-center gap-1.5 text-[var(--text-3)]">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-mono text-[28px] font-semibold leading-none tracking-tight tabular-nums" style={{ color }}>
          {value}
        </span>
        {unit && <span className="font-mono text-[13px] text-[var(--text-3)]">{unit}</span>}
      </div>
      <p className="mt-2 text-[11.5px] text-[var(--text-2)]">{delta}</p>
    </div>
  );
}

function DomainTable({ domains }: { domains: DomainScore[] }) {
  return (
    <div>
      {domains.map((d, i) => (
        <div
          key={d.domain}
          className={`grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[1.4fr_120px_140px_80px_60px] ${
            i !== 0 ? "border-t border-[var(--border)]" : ""
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{d.label}</p>
            <p className="mt-0.5 hidden truncate text-[11.5px] text-[var(--text-3)] md:block">{d.evidence}</p>
          </div>
          <div className="hidden md:block">
            <ScoreBar score={d.score} />
          </div>
          <div className="hidden text-[11.5px] text-[var(--text-2)] md:block">
            <span className="rounded border border-[var(--border)] bg-[var(--bg-elev-2)] px-1.5 py-0.5">
              {stageLabels[d.stage]}
            </span>
          </div>
          <div className="hidden font-mono text-[11.5px] text-[var(--text-2)] md:block">
            {d.blockers} blk
          </div>
          <div className="text-right">
            <ScorePill score={d.score} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-elev-3)]">
      <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor(score) }} />
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const c = scoreColor(score);
  return (
    <span
      className="inline-flex min-w-[42px] justify-center rounded font-mono text-[11.5px] font-semibold tabular-nums"
      style={{
        background: `${c}1a`,
        color: c,
        padding: "2px 6px",
      }}
    >
      {score}
    </span>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card>
      <header className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-3">
        <Avatar text={agent.avatar} size={28} bg={agent.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold tracking-tight">{agent.name}</p>
          <p className="truncate text-[11.5px] text-[var(--text-2)]">{agent.role}</p>
        </div>
        {agent.id === "itom-doctor" ? (
          <Stethoscope className="h-3.5 w-3.5 text-[var(--text-3)]" />
        ) : (
          <TerminalSquare className="h-3.5 w-3.5 text-[var(--text-3)]" />
        )}
      </header>
      <div className="px-4 py-3">
        <p className="text-[11.5px] text-[var(--text-3)]">{agent.tagline}</p>
        <ul className="mt-3 space-y-2">
          {agent.insights.map((insight) => (
            <li
              key={insight.title}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] p-3"
            >
              <p className="text-[12.5px] font-medium">{insight.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-2)]">{insight.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function AgentMini({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] p-3">
      <div className="flex items-center gap-2.5">
        <Avatar text={agent.avatar} size={22} bg={agent.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium">{agent.name}</p>
          <p className="truncate text-[11px] text-[var(--text-3)]">{agent.role}</p>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-[var(--text-2)]">
        {agent.insights[0]?.detail}
      </p>
    </div>
  );
}

function ActivityFeed({ analysis, extended = false }: { analysis: Analysis; extended?: boolean }) {
  const items = [
    {
      icon: <Sparkles className="h-3.5 w-3.5" />,
      title: "Analysis generated",
      detail: `${analysis.csdmVersion} · score ${analysis.overallScore}/100`,
      time: "now",
    },
    ...analysis.agents.map((a) => ({
      icon: <Avatar text={a.avatar} size={16} bg={a.color} />,
      title: `${a.name} produced ${a.insights.length} insights`,
      detail: a.tagline,
      time: "1m",
    })),
    ...analysis.domains
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, extended ? 5 : 3)
      .map((d) => ({
        icon: <Database className="h-3.5 w-3.5" />,
        title: `${d.label} scored ${d.score}`,
        detail: `Stage ${stageLabels[d.stage]} · ${d.blockers} blockers`,
        time: "2m",
      })),
  ];

  return (
    <ul className="divide-y divide-[var(--border)]">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-3 px-4 py-3">
          <div className="mt-0.5 grid h-6 w-6 place-items-center rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] text-[var(--text-2)]">
            {item.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium">{item.title}</p>
            <p className="truncate text-[11.5px] text-[var(--text-3)]">{item.detail}</p>
          </div>
          <span className="font-mono text-[10.5px] text-[var(--text-3)]">{item.time}</span>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ onConnect, onDemo }: { onConnect?: () => void; onDemo?: () => void }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-elev-1)] p-8 text-center md:p-16">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)]">
        <Activity className="h-4 w-4 text-[var(--text-2)]" />
      </div>
      <h2 className="mt-4 text-[18px] font-semibold tracking-tight">No analysis yet</h2>
      <p className="mx-auto mt-1.5 max-w-[420px] text-[13px] text-[var(--text-2)]">
        Connect a ServiceNow instance, or load demo data to explore the CSDM 5.0 maturity dashboard.
      </p>
      {(onConnect || onDemo) && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {onConnect && (
            <button
              onClick={onConnect}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--text)] px-3 py-1.5 text-[12.5px] font-medium text-black hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" /> Connect instance
            </button>
          )}
          {onDemo && (
            <button
              onClick={onDemo}
              className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-3 py-1.5 text-[12.5px] hover:border-[var(--border-strong)]"
            >
              Load demo data
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────── Login + modal ──────────────────────────── */

function LoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-4 text-[var(--text)]">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 76 65" fill="none" aria-hidden>
            <path d="M37.527.5L75.054 65H0L37.527.5z" fill="currentColor" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight">CSDM3D</span>
        </div>
        <h1 className="text-[24px] font-semibold leading-tight tracking-tight">Sign in to your workspace</h1>
        <p className="mt-2 text-[13px] text-[var(--text-2)]">
          CSDM 5.0 maturity dashboard with two specialist agents.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="mt-7 space-y-3"
        >
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Password" value={password} onChange={setPassword} type="password" />
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-[var(--text)] px-3 py-2.5 text-[13px] font-medium text-black hover:bg-white"
          >
            Continue
          </button>
        </form>
        <p className="mt-6 text-[11px] text-[var(--text-3)]">
          Public demo · no credentials are persisted server-side.
        </p>
      </div>
    </main>
  );
}

function ConnectModal({
  instanceUrl,
  username,
  password,
  loading,
  error,
  setInstanceUrl,
  setUsername,
  setPassword,
  onClose,
  onSubmit,
}: {
  instanceUrl: string;
  username: string;
  password: string;
  loading: boolean;
  error: string;
  setInstanceUrl: (v: string) => void;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--bg-elev-1)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-3)]">ServiceNow</p>
            <h3 className="mt-0.5 text-[14px] font-semibold tracking-tight">Connect instance</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--text-2)] hover:bg-[var(--bg-elev-2)]" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3 p-4">
          <Field label="Instance URL" value={instanceUrl} onChange={setInstanceUrl} placeholder="https://example.service-now.com" type="url" />
          <Field label="Username" value={username} onChange={setUsername} placeholder="api.user" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
          {error && (
            <p className="rounded-md border border-[#3a1f23] bg-[#23151a] px-3 py-2 text-[12px] text-[#ff8a8a]">{error}</p>
          )}
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-[var(--text-3)]">Probes CSDM 5.0 anchor tables via Table API.</p>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-[var(--text)] px-3 py-2 text-[12.5px] font-medium text-black hover:bg-white disabled:opacity-60"
            >
              {loading ? "Analyzing…" : "Run analysis"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────── Atoms ──────────────────────────── */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-[var(--text-2)]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2.5 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] focus:border-[var(--border-focus)]"
      />
    </label>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elev-2)] px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-3)]">{k}</p>
      <p className="mt-0.5 truncate font-mono text-[12px] text-[var(--text)]">{v}</p>
    </div>
  );
}

function Avatar({ text, size, bg }: { text: string; size: number; bg: string }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: Math.max(8, size * 0.45),
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  );
}

function Slash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[var(--text-3)]">
      <path d="M16.88 3.549L7.12 20.451" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function ChevronUpDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[var(--text-3)]">
      <path d="M5 6l3-3 3 3M5 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchHint() {
  return (
    <div className="hidden h-8 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elev-1)] px-2.5 text-[12px] text-[var(--text-3)] hover:border-[var(--border-strong)] md:flex">
      <Search className="h-3.5 w-3.5" />
      <span>Search…</span>
      <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--bg-elev-2)] px-1 py-px font-mono text-[10px]">
        <Command className="h-2.5 w-2.5" /> K
      </span>
    </div>
  );
}

function MobileTabBar({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const items: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: "Home", icon: <Gauge className="h-4 w-4" /> },
    { id: "map", label: "Map", icon: <Boxes className="h-4 w-4" /> },
    { id: "domains", label: "Domains", icon: <Layers className="h-4 w-4" /> },
    { id: "agents", label: "Agents", icon: <Sparkles className="h-4 w-4" /> },
    { id: "settings", label: "More", icon: <Settings className="h-4 w-4" /> },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10.5px] ${
              active ? "text-[var(--text)]" : "text-[var(--text-3)]"
            }`}
          >
            <span className={`grid h-7 w-7 place-items-center rounded-md ${active ? "bg-[var(--bg-elev-2)]" : ""}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

/* ──────────────────────────── Helpers ──────────────────────────── */

function scoreColor(score: number) {
  if (score >= 75) return "var(--success)";
  if (score >= 55) return "var(--warn)";
  return "var(--danger)";
}

function downloadReport(analysis: Analysis | null) {
  if (!analysis) return;
  const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "csdm3d-report.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

