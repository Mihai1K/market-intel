#!/usr/bin/env node
/**
 * Проверка живости всех source_url в data/ и research/.
 * Запуск: npm run verify-links [-- --out путь/link-report.md]
 *
 * Классификация:
 *  - ok       — 2xx/3xx
 *  - blocked  — 401/403/429/5xx или сброс соединения: антибот/временная недоступность
 *  - broken   — 404/410 или DNS-ошибка: требует замены источника
 *  - timeout  — нет ответа за 15 секунд
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const outArg = process.argv.indexOf("--out");
const OUT = outArg > -1 ? process.argv[outArg + 1] : join(ROOT, "artifacts", "link-report.md");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
// «)» разрешена внутри URL (Википедия: ..._(с_2025)); непарные хвостовые скобки срезаются на очистке
const URL_RE = /https?:\/\/[^\s"'\\\]}>,]+/g;

function* walkFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walkFiles(p);
    else if (/\.(json|md)$/.test(name)) yield p;
  }
}

// Сбор URL → в каких файлах встречаются
const urlFiles = new Map();
for (const dir of ["data", "research"].map((d) => join(ROOT, d))) {
  for (const file of walkFiles(dir)) {
    const text = readFileSync(file, "utf8");
    for (const raw of text.match(URL_RE) ?? []) {
      let url = raw.replace(/[.,;:»]+$/, "");
      // закрывающую скобку срезаем только если она непарная — URL Википедии вида ..._(с_2025) легальны
      const count = (s, ch) => s.split(ch).length - 1;
      while (url.endsWith(")") && count(url, ")") > count(url, "(")) url = url.slice(0, -1);
      if (!urlFiles.has(url)) urlFiles.set(url, new Set());
      urlFiles.get(url).add(relative(ROOT, file));
    }
  }
}

const urls = [...urlFiles.keys()];
console.log(`Найдено уникальных URL: ${urls.length}. Проверяю (таймаут 15с, 8 параллельно)...`);

async function check(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": UA, "Accept-Language": "ru,en;q=0.8" },
    });
    res.body?.cancel?.();
    const s = res.status;
    if (s === 401 || s === 403 || s === 429) return { url, status: s, verdict: "blocked" };
    // 5xx — сайт временно лежит, страница не удалена: транзиент, не битая
    if (s >= 500) return { url, status: s, verdict: "blocked" };
    if (s === 404 || s === 410) return { url, status: s, verdict: "broken" };
    return { url, status: s, verdict: "ok" };
  } catch (e) {
    const msg = String(e?.cause?.code ?? e?.name ?? e);
    if (msg.includes("Abort")) return { url, status: "—", verdict: "timeout" };
    if (/ENOTFOUND|EAI_AGAIN/.test(msg)) return { url, status: msg, verdict: "broken" };
    return { url, status: msg, verdict: "blocked" };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let i = 0;
async function worker() {
  while (i < urls.length) {
    const url = urls[i++];
    const r = await check(url);
    results.push(r);
    process.stdout.write(`\r${results.length}/${urls.length}`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log();

const by = (v) => results.filter((r) => r.verdict === v).sort((a, b) => a.url.localeCompare(b.url));
const ok = by("ok"), blocked = by("blocked"), broken = by("broken"), timeout = by("timeout");

const lines = [
  `# Отчёт проверки ссылок — ${new Date().toISOString().slice(0, 16).replace("T", " ")}`,
  "",
  `Всего уникальных URL: **${urls.length}** · живых: **${ok.length}** · антибот/закрыто: **${blocked.length}** · битых: **${broken.length}** · таймаут: **${timeout.length}**`,
  "",
];
const section = (title, items, note) => {
  if (!items.length) return;
  lines.push(`## ${title} (${items.length})`, "");
  if (note) lines.push(`> ${note}`, "");
  for (const r of items) {
    lines.push(`- [${r.status}] ${r.url}`);
    for (const f of urlFiles.get(r.url)) lines.push(`  - используется в: ${f}`);
  }
  lines.push("");
};
section("Битые — требуют замены источника", broken);
section("Таймаут — перепроверить вручную", timeout);
section("Антибот/временно недоступно", blocked, "401/403/429/5xx или сброс соединения. Ссылка, скорее всего, живая: сайт не пускает роботов или временно лежит — не считается битой. Повторяющиеся из прогона в прогон — проверить вручную.");
lines.push(`## Живые (${ok.length})`, "", ...ok.map((r) => `- [${r.status}] ${r.url}`), "");

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, lines.join("\n"));
console.log(`Живых: ${ok.length}, антибот: ${blocked.length}, битых: ${broken.length}, таймаут: ${timeout.length}`);
console.log(`Отчёт: ${OUT}`);
if (broken.length) process.exitCode = 0; // битые — предупреждение для ручного разбора, не падение пайплайна
