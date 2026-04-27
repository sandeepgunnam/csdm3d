import { NextRequest, NextResponse } from "next/server";

type Stage = "foundation" | "crawl" | "walk" | "run" | "fly";
type Domain = "foundational" | "design" | "build" | "technical-services" | "sell-consume";

type TableProbe = { table: string; available: boolean; count: number };

type DomainResult = {
  domain: Domain;
  label: string;
  score: number;
  stage: Stage;
  blockers: number;
  evidence: string;
  tables: TableProbe[];
};

// CSDM 5.0 anchor tables per domain — kept lightweight to keep the analysis
// fast and to avoid requiring privileged ITOM roles on the target instance.
const TABLES: Record<Domain, string[]> = {
  foundational: ["cmdb_ci", "core_company", "cmn_location", "cmn_department", "sys_user_group", "cmdb_rel_ci"],
  design: ["cmdb_ci_business_app", "cmdb_application_product_model"],
  build: ["cmdb_ci_service_discovered", "cmdb_ci_service_auto", "cmdb_ci_appl"],
  "technical-services": ["cmdb_ci_service_technical", "service_offering", "sla_definition"],
  "sell-consume": ["cmdb_ci_service_business", "contract", "sn_consumer"],
};

const LABELS: Record<Domain, string> = {
  foundational: "Foundational Data",
  design: "Design",
  build: "Build",
  "technical-services": "Manage Technical Services",
  "sell-consume": "Sell / Consume Services",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instanceUrl = normalizeInstanceUrl(body.instanceUrl);
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");

    if (!instanceUrl || !username || !password) {
      return NextResponse.json({ error: "Instance URL, username and password are required." }, { status: 400 });
    }

    const domains: DomainResult[] = await Promise.all(
      (Object.keys(TABLES) as Domain[]).map(async (domain) => {
        const probes = await Promise.all(
          TABLES[domain].map((table) => fetchTableCount(instanceUrl, username, password, table)),
        );
        const availableTables = probes.filter((p) => p.available).length;
        const recordSignal = probes.reduce((sum, p) => sum + Math.min(p.count, 500), 0);
        const tableCoverage = availableTables / TABLES[domain].length;
        const score = Math.max(20, Math.min(92, Math.round(tableCoverage * 62 + Math.min(recordSignal / 24, 30))));

        return {
          domain,
          label: LABELS[domain],
          score,
          stage: scoreToStage(score),
          blockers: Math.max(0, Math.round((100 - score) / 11)),
          evidence: `${availableTables}/${TABLES[domain].length} CSDM5 anchor tables responded through the Table API.`,
          tables: probes,
        };
      }),
    );

    const overallScore = Math.round(domains.reduce((sum, d) => sum + d.score, 0) / domains.length);
    const globalStage = scoreToStage(Math.min(...domains.map((d) => d.score)));
    const ranked = [...domains].sort((a, b) => a.score - b.score);
    const weakest = ranked[0];
    const agents = buildAgents({ domains, overallScore, globalStage, weakest });

    return NextResponse.json({
      analysis: {
        instanceName: new URL(instanceUrl).hostname.split(".")[0],
        instanceUrl,
        overallScore,
        globalStage,
        progressToNext: Math.max(0, Math.min(100, overallScore - 40)),
        domains,
        generatedAt: new Date().toISOString(),
        csdmVersion: "CSDM 5.0",
        agents,
        // Flat fallback used by the 3D HUD overlay.
        insights: agents.flatMap((agent) => agent.insights.slice(0, 1)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildAgents({
  domains,
  overallScore,
  globalStage,
  weakest,
}: {
  domains: DomainResult[];
  overallScore: number;
  globalStage: Stage;
  weakest: DomainResult;
}) {
  const stageLabel = stageLabels[globalStage];
  const totalBlockers = domains.reduce((sum, d) => sum + d.blockers, 0);
  const missingTables = domains.flatMap((d) => d.tables.filter((t) => !t.available).map((t) => `${d.label} · ${t.table}`));
  const foundational = domains.find((d) => d.domain === "foundational");
  const build = domains.find((d) => d.domain === "build");

  return [
    {
      id: "pierrondi-ea",
      name: "Paulo Pierrondi",
      role: "Enterprise Architect",
      avatar: "PP",
      color: "#0b7285",
      tagline: "Strategy, exec narrative, CSDM5 roadmap.",
      insights: [
        {
          title: "Executive narrative",
          detail: `This instance scored ${overallScore}/100 — global stage ${stageLabel}. Frame CSDM5 as the practical backbone for governance, ITOM automation and Now Assist trust. Sell incremental wins, not a multi-year transformation.`,
        },
        {
          title: "Where to start",
          detail: `${weakest.label} is the lowest-scoring domain (${weakest.score}). Make it the first remediation workshop and tie its outcome to a measurable business KPI.`,
        },
        {
          title: "AI readiness implication",
          detail: globalStage === "foundation" || globalStage === "crawl"
            ? "Now Assist outputs are high-risk on this data shape. Use AI for explanation and prioritization, keep autonomous action governed."
            : "Data shape is mature enough to scope a Now Assist pilot on a single, well-bounded use case. Avoid horizontal rollout until ownership and lifecycle fields harden.",
        },
      ],
    },
    {
      id: "itom-doctor",
      name: "ITOM Doctor",
      role: "CMDB & Discovery Specialist",
      avatar: "Rx",
      color: "#7c3aed",
      tagline: "CMDB health, Discovery coverage, Service Mapping signals.",
      insights: [
        {
          title: "CMDB health",
          detail: foundational
            ? `Foundational layer at ${foundational.score}/100. ${foundational.blockers} blockers — focus on company, location and CI relationship completeness before scaling Discovery patterns.`
            : "Foundational layer not measurable.",
        },
        {
          title: "Discovery & Service Mapping",
          detail: build
            ? `Build domain at ${build.score}/100. Application Service population (cmdb_ci_service_discovered / _auto) is the leading indicator — low signal here means Service Mapping has not been run end-to-end.`
            : "Build domain not measurable.",
        },
        {
          title: "Missing anchors",
          detail: missingTables.length === 0
            ? "All CSDM5 anchor tables responded. Data shape is consistent with a baseline CMDB Health audit candidate."
            : `${missingTables.length} CSDM5 anchor tables are unreachable for this user. Check role grants (snc_internal, itil) and table ACLs: ${missingTables.slice(0, 4).join(", ")}${missingTables.length > 4 ? "…" : ""}.`,
        },
        {
          title: "Total blockers",
          detail: `${totalBlockers} blockers across the 5 domains. Treat them as a backlog of CMDB Health dashboard remediations, not as a single program.`,
        },
      ],
    },
  ];
}

const stageLabels: Record<Stage, string> = {
  foundation: "Foundation",
  crawl: "Crawl",
  walk: "Walk",
  run: "Run",
  fly: "Fly",
};

function normalizeInstanceUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  return `${url.protocol}//${url.host}`;
}

async function fetchTableCount(instanceUrl: string, username: string, password: string, table: string): Promise<TableProbe> {
  const url = `${instanceUrl}/api/now/table/${table}?sysparm_limit=1&sysparm_fields=sys_id`;
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) return { table, available: false, count: 0 };

    const total = response.headers.get("x-total-count");
    const count = total ? Number(total) : 1;
    return { table, available: true, count: Number.isFinite(count) ? count : 1 };
  } catch {
    return { table, available: false, count: 0 };
  }
}

function scoreToStage(score: number): Stage {
  if (score >= 90) return "fly";
  if (score >= 78) return "run";
  if (score >= 66) return "walk";
  if (score >= 48) return "crawl";
  return "foundation";
}
