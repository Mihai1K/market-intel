#!/usr/bin/env node
/**
 * Артефакты итерации — доказательства вместо слов «всё работает».
 * Запуск: npm run artifacts [-- --port 3000]
 *
 * Создаёт artifacts/<дата>/:
 *   validation/validate.txt      — вывод валидатора данных
 *   validation/link-report.md    — отчёт проверки всех source_url
 *   logs/pages-http.txt          — HTTP-статусы страниц дашборда
 *   screenshots/*.png            — скриншоты страниц (headless Chrome)
 *   report.md                    — сводка итерации
 */
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const portArg = process.argv.indexOf("--port");
const PORT = portArg > -1 ? process.argv[portArg + 1] : process.env.PORT ?? "3000";
const BASE = `http://localhost:${PORT}`;

const stamp = new Date().toLocaleDateString("sv"); // локальная дата YYYY-MM-DD, не UTC
const DIR = join(ROOT, "artifacts", stamp);
for (const d of ["validation", "logs", "screenshots"]) mkdirSync(join(DIR, d), { recursive: true });

const run = (cmd, args) => {
  try {
    return { out: execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), ok: true };
  } catch (e) {
    return { out: (e.stdout ?? "") + (e.stderr ?? e.message), ok: false };
  }
};

// 1. Валидатор
console.log("1/4 Валидатор данных...");
const val = run("node", [join(ROOT, "scripts", "validate.mjs")]);
writeFileSync(join(DIR, "validation", "validate.txt"), val.out);

// 2. Проверка ссылок
console.log("2/4 Проверка ссылок (несколько минут)...");
const links = run("node", [join(ROOT, "scripts", "verify-links.mjs"), "--out", join(DIR, "validation", "link-report.md")]);

// 3. HTTP-проверка страниц дашборда
console.log("3/4 Страницы дашборда...");
const marketsDir = join(ROOT, "data", "markets");
const slugs = existsSync(marketsDir) ? readdirSync(marketsDir) : [];
const routes = ["/", "/rating", "/pains", ...slugs.flatMap((s) => [`/markets/${s}`])];
// первая компания каждого рынка
for (const s of slugs) {
  const cd = join(marketsDir, s, "companies");
  if (existsSync(cd)) {
    const first = readdirSync(cd).find((f) => f.endsWith(".json"));
    if (first) routes.push(`/markets/${s}/companies/${first.replace(/\.json$/, "")}`);
  }
}
const httpLines = [];
let pagesOk = true;
for (const r of routes) {
  try {
    const res = await fetch(BASE + r, { redirect: "follow" });
    const body = await res.text();
    const line = `${res.status}  ${r}  (${body.length} байт${body.includes("market") ? "" : ", ВНИМАНИЕ: маркер не найден"})`;
    httpLines.push(line);
    if (res.status !== 200) pagesOk = false;
  } catch (e) {
    httpLines.push(`FAIL  ${r}  ${e.message} — дашборд запущен на ${BASE}?`);
    pagesOk = false;
  }
}
writeFileSync(join(DIR, "logs", "pages-http.txt"), `Проверка ${BASE}\n\n` + httpLines.join("\n") + "\n");

// 4. Скриншоты через headless Chrome
console.log("4/4 Скриншоты...");
const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
];
const chrome = chromeCandidates.find(existsSync);
const shots = [];
if (chrome && pagesOk !== null) {
  for (const r of routes) {
    const name = (r === "/" ? "home" : r.replace(/^\//, "").replace(/\//g, "_")) + ".png";
    const file = join(DIR, "screenshots", name);
    try {
      execFileSync(chrome, [
        "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--window-size=1440,2400", `--screenshot=${file}`,
        "--virtual-time-budget=8000", "--no-first-run", "--disable-extensions",
        BASE + r,
      ], { stdio: "ignore", timeout: 60000 });
      shots.push(name);
    } catch {
      shots.push(`${name} — НЕ СНЯТ`);
    }
  }
} else if (!chrome) {
  shots.push("Chrome/Chromium/Edge не найден — скриншоты пропущены");
}

// Сводный отчёт
let gitRev = "n/a";
try { gitRev = execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim(); } catch {}
const report = [
  `# Артефакты итерации — ${stamp}`,
  "",
  `- git: \`${gitRev}\``,
  `- дашборд: ${BASE}`,
  "",
  "## Валидатор данных",
  "```",
  val.out.trim(),
  "```",
  val.ok ? "✓ пройден" : "✗ ОШИБКИ — см. validation/validate.txt",
  "",
  "## Проверка ссылок",
  "```",
  links.out.trim().split("\n").slice(-3).join("\n"),
  "```",
  "Полный отчёт: validation/link-report.md",
  "",
  "## Страницы дашборда",
  "```",
  ...httpLines,
  "```",
  "",
  "## Скриншоты",
  ...shots.map((s) => `- screenshots/${s}`),
  "",
].join("\n");
writeFileSync(join(DIR, "report.md"), report);
console.log(`\nАртефакты: ${DIR}`);
console.log(val.ok && pagesOk ? "✓ Итерация подтверждена артефактами" : "✗ Есть проблемы — открой report.md");
if (!val.ok) process.exit(1);
