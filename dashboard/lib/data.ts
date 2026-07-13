import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "..", "data");

export interface Fact {
  value: number;
  unit: string;
  period: string;
  basis?: string;
  scope?: string;
  source_name: string;
  source_url: string;
  retrieved_at: string;
  confidence: "high" | "medium" | "low";
  method: "reported" | "estimated" | "derived";
  formula?: string;
  note?: string;
  metric?: string;
}

export interface Market {
  id: string;
  name: string;
  description: string;
  scope_assumptions?: string[];
  segments: { id: string; name: string; description?: string }[];
  market_size_rf: { estimates: Fact[]; range_note?: string };
  market_size_global?: { estimates: Fact[]; range_note?: string };
  growth?: Fact[];
  buying_power?: {
    segment: string;
    typical_budget: string;
    deal_cycle?: string;
    ease_of_purchase: number;
    evidence: { note: string; source_url: string }[];
  }[];
  events?: { date: string; event: string; source_url: string }[];
  sources?: string[];
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  legal_name?: string;
  inn?: string;
  website: string;
  founded?: number;
  segment: string;
  description?: string;
  revenue?: Fact[];
  net_profit?: Fact[];
  headcount?: Fact[];
  disclosed_metrics?: Fact[];
  pricing?: { plan: string; price: string; source_url: string; retrieved_at: string }[];
  review_rating?: { rating: number; scale?: string; count_note?: string; source_url: string; retrieved_at?: string };
  top_complaints?: { complaint: string; source_url: string }[];
  vacancies_now?: Fact;
  funding?: { event: string; date?: string; source_url: string }[];
  data_gaps?: string[];
  sources?: string[];
  updated_at: string;
}

export interface Pain {
  id: string;
  statement: string;
  role: string;
  mentions_found: number;
  links: string[];
  search_period: string;
  who_pays_now?: string;
  why_unsolved?: string;
  automatable?: boolean;
  ai_possible?: boolean;
  saas_possible?: boolean;
  channel?: string[];
  difficulty: number;
  quotes?: { text: string; source_url: string }[];
}

export interface PainsFile {
  market: string;
  updated_at: string;
  pains: Pain[];
  surveys?: { finding: string; source_name: string; source_url: string; period?: string }[];
}

export interface WorkflowStep {
  name: string;
  status: "manual" | "semi" | "automated";
  evidence?: string;
  evidence_url?: string;
  can_ai?: boolean;
  can_bot?: boolean;
  time_cost?: string;
  time_cost_url?: string;
}

export interface WorkflowsFile {
  market: string;
  updated_at: string;
  workflows: { id: string; name: string; actor: string; steps: WorkflowStep[] }[];
}

export interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  why: string;
}

export interface Score {
  total: number;
  components: ScoreComponent[];
}

export interface Opportunity {
  id: string;
  name: string;
  what: string;
  why_now: string;
  pain_ids?: string[];
  workflow_steps?: string[];
  mvp_7_days: string;
  mvp_30_days: string;
  first_10_clients: string;
  launch_score: Score;
  scale_score: Score;
  founder_fit: { pluses: string[]; minuses: string[] };
  risks?: string[];
  competitors?: { name: string; note: string; url?: string }[];
  test_plan_7_days?: {
    offer?: string;
    landing?: string;
    channels?: string[];
    budget?: string;
    success_criteria?: string;
  };
  status: "candidate" | "testing" | "tested-ok" | "tested-fail" | "rejected";
}

export interface OpportunitiesFile {
  market: string;
  updated_at: string;
  opportunities: Opportunity[];
}

export interface MarketBundle {
  slug: string;
  market: Market | null;
  pains: PainsFile | null;
  workflows: WorkflowsFile | null;
  opportunities: OpportunitiesFile | null;
  companies: Company[];
}

function readJson<T>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

export function getMarketSlugs(): string[] {
  const dir = path.join(DATA_DIR, "markets");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((d) => fs.statSync(path.join(dir, d)).isDirectory());
}

export function getMarketBundle(slug: string): MarketBundle {
  const dir = path.join(DATA_DIR, "markets", slug);
  const companiesDir = path.join(dir, "companies");
  const companies: Company[] = [];
  if (fs.existsSync(companiesDir)) {
    for (const f of fs.readdirSync(companiesDir).filter((f) => f.endsWith(".json"))) {
      const c = readJson<Company>(path.join(companiesDir, f));
      if (c) companies.push({ ...c, id: c.id ?? f.replace(/\.json$/, "") });
    }
  }
  return {
    slug,
    market: readJson<Market>(path.join(dir, "market.json")),
    pains: readJson<PainsFile>(path.join(dir, "pains.json")),
    workflows: readJson<WorkflowsFile>(path.join(dir, "workflows.json")),
    opportunities: readJson<OpportunitiesFile>(path.join(dir, "opportunities.json")),
    companies,
  };
}

export function getAllMarkets(): MarketBundle[] {
  return getMarketSlugs().map(getMarketBundle);
}

export function getCompany(slug: string, companyId: string): Company | null {
  return (
    getMarketBundle(slug).companies.find((c) => c.id === companyId) ?? null
  );
}

export interface Founder {
  name: string;
  skills: string[];
  assets: string[];
  channels: string[];
  playbook: string;
  preferences: Record<string, string>;
  strong_fit: string[];
  weak_fit: string[];
}

export function getFounder(): Founder | null {
  return readJson<Founder>(path.join(DATA_DIR, "founder.json"));
}

/** Лучшая непротестированная возможность по Launch Score среди всех рынков */
export function getOpportunityOfTheWeek(): { slug: string; marketName: string; opp: Opportunity } | null {
  let best: { slug: string; marketName: string; opp: Opportunity } | null = null;
  for (const b of getAllMarkets()) {
    for (const opp of b.opportunities?.opportunities ?? []) {
      if (opp.status !== "candidate" && opp.status !== "testing") continue;
      if (!best || opp.launch_score.total > best.opp.launch_score.total) {
        best = { slug: b.slug, marketName: b.market?.name ?? b.slug, opp };
      }
    }
  }
  return best;
}

export interface RoadmapEntry {
  name: string;
  slug: string | null;
  status: "done" | "in-progress" | "todo";
}

export function getRoadmap(): RoadmapEntry[] {
  return readJson<{ queue: RoadmapEntry[] }>(path.join(DATA_DIR, "roadmap.json"))?.queue ?? [];
}

export interface CoverageRow {
  name: string;
  slug: string | null;
  status: "done" | "in-progress" | "todo";
  companies: number;
  pains: number;
  opportunities: number;
  experiments: number;
}

/** Market Coverage Dashboard: очередь рынков + реальные счётчики из data/ */
export function getCoverage(): { rows: CoverageRow[]; totals: Omit<CoverageRow, "name" | "slug" | "status"> & { markets: number } } {
  const experiments = getExperiments();
  const rows: CoverageRow[] = getRoadmap().map((r) => {
    if (!r.slug) return { ...r, companies: 0, pains: 0, opportunities: 0, experiments: 0 };
    const b = getMarketBundle(r.slug);
    return {
      ...r,
      companies: b.companies.length,
      pains: b.pains?.pains.length ?? 0,
      opportunities: b.opportunities?.opportunities.length ?? 0,
      experiments: experiments.filter((e) => e.market === r.slug).length,
    };
  });
  const totals = rows.reduce(
    (t, r) => ({
      markets: t.markets + (r.status === "done" ? 1 : 0),
      companies: t.companies + r.companies,
      pains: t.pains + r.pains,
      opportunities: t.opportunities + r.opportunities,
      experiments: t.experiments + r.experiments,
    }),
    { markets: 0, companies: 0, pains: 0, opportunities: 0, experiments: 0 }
  );
  return { rows, totals };
}

export interface Decision {
  date: string;
  market: string;
  opportunity_id: string | null;
  opportunity_name: string;
  decision: "rejected" | "deferred" | "testing" | "accepted";
  reason: string;
  revisit?: string;
  author: string;
  links?: string[];
}

export interface Experiment {
  id: string;
  started_at: string;
  finished_at?: string;
  market: string;
  opportunity_id: string;
  type: string;
  channel: string;
  budget_rub?: number;
  spend_rub?: number;
  impressions?: number;
  clicks?: number;
  leads?: number;
  sales?: number;
  revenue_rub?: number;
  cac_rub?: number;
  verdict: "running" | "confirmed" | "partial" | "failed";
  conclusion?: string;
  artifacts?: string[];
}

export interface ScoreSnapshot {
  date: string;
  market: string;
  opportunity_id: string;
  launch: number;
  scale: number;
}

export function getDecisions(): Decision[] {
  return readJson<{ decisions: Decision[] }>(path.join(DATA_DIR, "decisions.json"))?.decisions ?? [];
}

export function getExperiments(): Experiment[] {
  return readJson<{ experiments: Experiment[] }>(path.join(DATA_DIR, "experiments.json"))?.experiments ?? [];
}

export function getScoreHistory(): ScoreSnapshot[] {
  return readJson<{ snapshots: ScoreSnapshot[] }>(path.join(DATA_DIR, "score-history.json"))?.snapshots ?? [];
}

/** Тренд Launch: сравнение двух последних снимков возможности; null если снимок один */
export function getLaunchTrends(): Map<string, { prev: number; prevDate: string; current: number }> {
  const byOpp = new Map<string, ScoreSnapshot[]>();
  for (const s of getScoreHistory()) {
    const key = `${s.market}/${s.opportunity_id}`;
    if (!byOpp.has(key)) byOpp.set(key, []);
    byOpp.get(key)!.push(s);
  }
  const trends = new Map<string, { prev: number; prevDate: string; current: number }>();
  for (const [key, snaps] of byOpp) {
    const sorted = snaps.sort((a, b) => (a.date < b.date ? -1 : 1));
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2];
      const cur = sorted[sorted.length - 1];
      trends.set(key, { prev: prev.launch, prevDate: prev.date, current: cur.launch });
    }
  }
  return trends;
}

export interface GlobalOpportunity {
  slug: string;
  marketName: string;
  opp: Opportunity;
  founderFitScore: number | null;
}

/** Все возможности всех рынков — для глобального рейтинга */
export function getGlobalOpportunities(): GlobalOpportunity[] {
  const all: GlobalOpportunity[] = [];
  for (const b of getAllMarkets()) {
    for (const opp of b.opportunities?.opportunities ?? []) {
      const ff = opp.launch_score.components.find((c) =>
        c.name.toLowerCase().includes("founder") || c.name.toLowerCase().includes("fit")
      );
      all.push({
        slug: b.slug,
        marketName: b.market?.name ?? b.slug,
        opp,
        founderFitScore: ff?.score ?? null,
      });
    }
  }
  return all.sort((a, z) => z.opp.launch_score.total - a.opp.launch_score.total);
}

export function latestFact(facts?: Fact[]): Fact | null {
  if (!facts?.length) return null;
  return [...facts].sort((a, b) => (a.period < b.period ? 1 : -1))[0];
}

export function sizeRange(m: Market | null): { min: Fact; max: Fact } | null {
  const est = m?.market_size_rf?.estimates;
  if (!est?.length) return null;
  const sorted = [...est].sort((a, b) => a.value - b.value);
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}
