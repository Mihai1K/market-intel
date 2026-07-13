#!/usr/bin/env node
/**
 * Market Timeline: добавляет снимок Launch/Scale всех возможностей в data/score-history.json.
 * Запускать при каждом еженедельном обновлении (Промпт 3). Один снимок на дату — повторный запуск в тот же день перезаписывает снимок дня.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const HISTORY = join(ROOT, "data", "score-history.json");
const today = new Date().toISOString().slice(0, 10);

const history = existsSync(HISTORY)
  ? JSON.parse(readFileSync(HISTORY, "utf8"))
  : { description: "Market Timeline", snapshots: [] };

// убрать сегодняшние снимки (идемпотентность в пределах дня)
history.snapshots = history.snapshots.filter((s) => s.date !== today);

const marketsDir = join(ROOT, "data", "markets");
let added = 0;
for (const slug of readdirSync(marketsDir).filter((d) => statSync(join(marketsDir, d)).isDirectory())) {
  const oppFile = join(marketsDir, slug, "opportunities.json");
  if (!existsSync(oppFile)) continue;
  const { opportunities = [] } = JSON.parse(readFileSync(oppFile, "utf8"));
  for (const opp of opportunities) {
    history.snapshots.push({
      date: today,
      market: slug,
      opportunity_id: opp.id,
      launch: opp.launch_score.total,
      scale: opp.scale_score.total,
    });
    added++;
  }
}

writeFileSync(HISTORY, JSON.stringify(history, null, 2) + "\n");
console.log(`Снимок ${today}: ${added} возможностей записано в data/score-history.json`);
