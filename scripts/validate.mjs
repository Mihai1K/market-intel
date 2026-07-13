#!/usr/bin/env node
/**
 * Валидатор данных market-intel. Запуск: node scripts/validate.mjs
 *
 * Главное правило: значимое число может существовать ТОЛЬКО внутри факт-объекта
 * с source_url, retrieved_at, confidence и method — либо под явно разрешённым ключом.
 * Любое другое число в data/ — ошибка «неподтверждённый числовой факт».
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DATA = join(ROOT, "data");

const errors = [];
const warnings = [];
const err = (file, path, msg) => errors.push(`${file} :: ${path} — ${msg}`);
const warn = (file, path, msg) => warnings.push(`${file} :: ${path} — ${msg}`);

const CONFIDENCE = new Set(["high", "medium", "low"]);
const METHOD = new Set(["reported", "estimated", "derived"]);
const WORKFLOW_STATUS = new Set(["manual", "semi", "automated"]);
const OPP_STATUS = new Set(["candidate", "testing", "tested-ok", "tested-fail", "rejected"]);
const URL_RE = /^https?:\/\//;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Числа, разрешённые вне факт-объектов (структурные оценки и id-подобные поля)
const ALLOWED_NUMERIC_KEYS = new Set([
  "value", "founded", "mentions_found", "difficulty", "ease_of_purchase",
  "score", "total", "weight", "rating",
]);

function isFact(node) {
  return node && typeof node === "object" && !Array.isArray(node) && typeof node.value === "number";
}

function checkFact(file, path, f) {
  for (const key of ["unit", "period", "source_name", "source_url", "retrieved_at", "confidence", "method"]) {
    if (f[key] === undefined || f[key] === "") err(file, path, `факт без обязательного поля "${key}"`);
  }
  if (f.source_url && !URL_RE.test(f.source_url)) err(file, path, `source_url не похож на URL: ${f.source_url}`);
  if (f.retrieved_at && !DATE_RE.test(f.retrieved_at)) err(file, path, `retrieved_at должен быть YYYY-MM-DD`);
  if (f.confidence && !CONFIDENCE.has(f.confidence)) err(file, path, `confidence "${f.confidence}" вне {high,medium,low}`);
  if (f.method && !METHOD.has(f.method)) err(file, path, `method "${f.method}" вне {reported,estimated,derived}`);
  if (f.method === "derived" && !f.formula) err(file, path, `method=derived требует поле formula`);
}

// Рекурсивный обход: ловим факты и голые числа
function walk(file, node, path, insideFact = false) {
  if (node === null || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((item, i) => walk(file, item, `${path}[${i}]`, insideFact));
    return;
  }
  const fact = isFact(node);
  if (fact) checkFact(file, path, node);
  for (const [key, val] of Object.entries(node)) {
    const p = `${path}.${key}`;
    if (typeof val === "number") {
      if (!fact && !insideFact && !ALLOWED_NUMERIC_KEYS.has(key)) {
        err(file, p, `неподтверждённый числовой факт (${val}) — числа живут только в факт-объектах с источником`);
      }
      if (key === "rating") {
        if (!node.source_url) err(file, p, `rating без source_url`);
      }
    } else {
      walk(file, val, p, fact || insideFact);
    }
  }
}

function loadJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    err(relative(ROOT, file), "$", `не парсится как JSON: ${e.message}`);
    return null;
  }
}

function hostname(u) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

// ---------- проверки по типам файлов ----------

function checkMarket(rel, m) {
  for (const k of ["id", "name", "description", "segments", "market_size_rf", "updated_at"]) {
    if (m[k] === undefined) err(rel, k, "обязательное поле отсутствует");
  }
  const est = m.market_size_rf?.estimates ?? [];
  if (est.length < 2) {
    err(rel, "market_size_rf.estimates", `оценок ${est.length}, требуется вилка из ≥2 независимых источников`);
  } else {
    const hosts = new Set(est.map((e) => hostname(e.source_url ?? "")));
    if (hosts.size < 2) err(rel, "market_size_rf.estimates", `все оценки с одного домена (${[...hosts][0]}) — это один источник`);
  }
  for (const [i, bp] of (m.buying_power ?? []).entries()) {
    if (!bp.evidence?.length) err(rel, `buying_power[${i}]`, "buying power без evidence (нужен хотя бы один пруф с URL)");
    if (!(bp.ease_of_purchase >= 1 && bp.ease_of_purchase <= 5)) err(rel, `buying_power[${i}].ease_of_purchase`, "должно быть 1–5");
  }
  for (const [i, ev] of (m.events ?? []).entries()) {
    if (!URL_RE.test(ev.source_url ?? "")) err(rel, `events[${i}]`, "событие без source_url");
  }
}

function checkCompany(rel, c) {
  for (const k of ["id", "name", "website", "segment", "updated_at"]) {
    if (c[k] === undefined) err(rel, k, "обязательное поле отсутствует");
  }
  for (const [i, p] of (c.pricing ?? []).entries()) {
    if (!URL_RE.test(p.source_url ?? "")) err(rel, `pricing[${i}]`, "тариф без source_url");
  }
  for (const [i, d] of (c.disclosed_metrics ?? []).entries()) {
    if (!d.metric) err(rel, `disclosed_metrics[${i}]`, "нет названия метрики");
    if (d.method !== "reported") err(rel, `disclosed_metrics[${i}]`, "disclosed_metrics допускает только method=reported (самораскрытие)");
  }
  for (const [i, t] of (c.top_complaints ?? []).entries()) {
    if (!URL_RE.test(t.source_url ?? "")) err(rel, `top_complaints[${i}]`, "жалоба без source_url");
  }
  if (c.ai_readiness) {
    const a = c.ai_readiness;
    if (!a.signals?.length) err(rel, "ai_readiness", "score без наблюдаемых сигналов запрещён");
    for (const [i, s] of (a.signals ?? []).entries()) {
      if (!URL_RE.test(s.evidence_url ?? "")) err(rel, `ai_readiness.signals[${i}]`, "сигнал без evidence_url");
    }
    if (!a.formula) err(rel, "ai_readiness", "нет formula — как посчитан score?");
  }
  const banned = ["ltv", "cac", "retention", "churn", "arpu"];
  for (const key of Object.keys(c)) {
    if (banned.includes(key.toLowerCase())) err(rel, key, "закрытая метрика — не выдумываем, поле запрещено");
  }
}

function checkPains(rel, p) {
  for (const [i, pain] of (p.pains ?? []).entries()) {
    const at = `pains[${i}](${pain.id ?? "?"})`;
    for (const k of ["id", "statement", "role", "mentions_found", "links", "search_period", "difficulty"]) {
      if (pain[k] === undefined) err(rel, at, `обязательное поле "${k}" отсутствует`);
    }
    if (!pain.links?.length) err(rel, at, "боль без единой ссылки-подтверждения");
    (pain.links ?? []).forEach((l, j) => { if (!URL_RE.test(l)) err(rel, `${at}.links[${j}]`, "не URL"); });
    if (pain.mentions_found !== undefined && pain.links?.length && pain.mentions_found < pain.links.length) {
      warn(rel, at, `mentions_found (${pain.mentions_found}) меньше числа ссылок (${pain.links.length})`);
    }
    if (!(pain.difficulty >= 1 && pain.difficulty <= 5)) err(rel, at, "difficulty должно быть 1–5");
    for (const [j, q] of (pain.quotes ?? []).entries()) {
      if (!URL_RE.test(q.source_url ?? "")) err(rel, `${at}.quotes[${j}]`, "цитата без source_url");
    }
  }
  for (const [i, s] of (p.surveys ?? []).entries()) {
    if (!URL_RE.test(s.source_url ?? "")) err(rel, `surveys[${i}]`, "вывод опроса без source_url");
  }
}

function checkWorkflows(rel, w) {
  for (const [i, wf] of (w.workflows ?? []).entries()) {
    const at = `workflows[${i}](${wf.id ?? "?"})`;
    if (!wf.steps || wf.steps.length < 3) err(rel, at, "меньше 3 шагов — это не процесс");
    for (const [j, s] of (wf.steps ?? []).entries()) {
      if (!WORKFLOW_STATUS.has(s.status)) err(rel, `${at}.steps[${j}]`, `status "${s.status}" вне {manual,semi,automated}`);
      if (!s.evidence && !s.evidence_url) warn(rel, `${at}.steps[${j}](${s.name})`, "статус шага без подтверждения (evidence/evidence_url)");
      if (s.time_cost && !s.time_cost_url) warn(rel, `${at}.steps[${j}]`, "time_cost без источника — либо добавь time_cost_url, либо убери");
    }
  }
}

function checkOpportunities(rel, o) {
  for (const [i, opp] of (o.opportunities ?? []).entries()) {
    const at = `opportunities[${i}](${opp.id ?? "?"})`;
    for (const k of ["id", "name", "what", "why_now", "mvp_7_days", "mvp_30_days", "first_10_clients", "launch_score", "scale_score", "founder_fit", "status"]) {
      if (opp[k] === undefined) err(rel, at, `обязательное поле "${k}" отсутствует`);
    }
    if (opp.status && !OPP_STATUS.has(opp.status)) err(rel, at, `status "${opp.status}" вне допустимых`);
    if (!opp.founder_fit?.pluses?.length) err(rel, at, "founder_fit без плюсов — против чего скорили?");
    for (const axis of ["launch_score", "scale_score"]) {
      const s = opp[axis];
      if (!s) continue;
      if (!(s.total >= 0 && s.total <= 100)) err(rel, `${at}.${axis}`, "total должен быть 0–100");
      if (!s.components || s.components.length < 3) { err(rel, `${at}.${axis}`, "меньше 3 компонент скоринга"); continue; }
      let weightSum = 0, computed = 0;
      for (const [j, c] of s.components.entries()) {
        if (!c.why || c.why.length < 10) err(rel, `${at}.${axis}.components[${j}](${c.name})`, "оценка без обоснования why");
        if (!(c.score >= 0 && c.score <= 10)) err(rel, `${at}.${axis}.components[${j}]`, "score должен быть 0–10");
        weightSum += c.weight ?? 0;
        computed += (c.score ?? 0) * (c.weight ?? 0);
      }
      if (Math.abs(weightSum - 1) > 0.01) err(rel, `${at}.${axis}`, `сумма весов ${weightSum.toFixed(2)} ≠ 1`);
      const expected = Math.round(computed * 10);
      if (Math.abs(expected - s.total) > 2) err(rel, `${at}.${axis}`, `total=${s.total}, но по компонентам выходит ${expected}`);
    }
  }
}

// ---------- обход data/ ----------

if (!existsSync(join(DATA, "founder.json"))) {
  err("data/founder.json", "$", "нет профиля основателя — Founder Fit считать не против чего");
} else {
  loadJson(join(DATA, "founder.json"));
}

const marketsDir = join(DATA, "markets");
const marketSlugs = existsSync(marketsDir)
  ? readdirSync(marketsDir).filter((d) => statSync(join(marketsDir, d)).isDirectory())
  : [];

let files = 0;
for (const slug of marketSlugs) {
  const dir = join(marketsDir, slug);
  const expect = (name, checker) => {
    const f = join(dir, name);
    const rel = relative(ROOT, f);
    if (!existsSync(f)) { warn(rel, "$", "файл отсутствует"); return; }
    const json = loadJson(f);
    if (!json) return;
    files++;
    walk(rel, json, "$");
    checker(rel, json);
  };
  expect("market.json", checkMarket);
  expect("pains.json", checkPains);
  expect("workflows.json", checkWorkflows);
  expect("opportunities.json", checkOpportunities);

  const compDir = join(dir, "companies");
  if (existsSync(compDir)) {
    for (const cf of readdirSync(compDir).filter((f) => f.endsWith(".json"))) {
      const f = join(compDir, cf);
      const rel = relative(ROOT, f);
      const json = loadJson(f);
      if (!json) continue;
      files++;
      walk(rel, json, "$");
      checkCompany(rel, json);
    }
  }
}

// ---------- отчёт ----------

console.log(`Проверено рынков: ${marketSlugs.length}, файлов: ${files}`);
if (warnings.length) {
  console.log(`\n⚠ Предупреждения (${warnings.length}):`);
  warnings.forEach((w) => console.log("  " + w));
}
if (errors.length) {
  console.error(`\n✗ Ошибки (${errors.length}):`);
  errors.forEach((e) => console.error("  " + e));
  process.exit(1);
}
console.log("\n✓ Все проверки достоверности пройдены");
