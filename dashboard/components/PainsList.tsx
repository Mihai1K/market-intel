"use client";

import { useMemo, useState } from "react";
import type { Pain } from "@/lib/data";

const ROLE_COLORS: Record<string, string> = {
  "соискатель": "border-sky-900 bg-sky-950/50 text-sky-300",
  "рекрутер": "border-violet-900 bg-violet-950/50 text-violet-300",
  "работодатель": "border-amber-900 bg-amber-950/50 text-amber-300",
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PainsList({ pains, marketNames }: { pains: (Pain & { market?: string })[]; marketNames?: Record<string, string> }) {
  const roles = useMemo(() => [...new Set(pains.map((p) => p.role))], [pains]);
  const [role, setRole] = useState<string | null>(null);
  const [aiOnly, setAiOnly] = useState(false);
  const [maxDifficulty, setMaxDifficulty] = useState(5);

  const filtered = pains
    .filter((p) => (role ? p.role === role : true))
    .filter((p) => (aiOnly ? p.ai_possible : true))
    .filter((p) => p.difficulty <= maxDifficulty)
    .sort((a, b) => b.mentions_found - a.mentions_found);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setRole(null)}
          className={`rounded-full border px-3 py-1 ${!role ? "border-emerald-700 text-emerald-300" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
        >
          все роли
        </button>
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setRole(role === r ? null : r)}
            className={`rounded-full border px-3 py-1 ${role === r ? "border-emerald-700 text-emerald-300" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
          >
            {r}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-zinc-800" />
        <button
          onClick={() => setAiOnly(!aiOnly)}
          className={`rounded-full border px-3 py-1 ${aiOnly ? "border-sky-700 text-sky-300" : "border-zinc-800 text-zinc-500 hover:text-zinc-300"}`}
        >
          решается AI
        </button>
        <label className="ml-2 flex items-center gap-2 text-zinc-500">
          сложность ≤ {maxDifficulty}
          <input
            type="range"
            min={1}
            max={5}
            value={maxDifficulty}
            onChange={(e) => setMaxDifficulty(Number(e.target.value))}
            className="accent-emerald-500"
          />
        </label>
        <span className="ml-auto text-zinc-600">{filtered.length} из {pains.length}</span>
      </div>

      <ul className="space-y-3">
        {filtered.map((p) => (
          <li key={`${p.market ?? ""}-${p.id}`} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex flex-wrap items-start gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${ROLE_COLORS[p.role] ?? "border-zinc-700 text-zinc-400"}`}>
                {p.role}
              </span>
              {p.market && marketNames?.[p.market] && (
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
                  {marketNames[p.market]}
                </span>
              )}
              <span className="ml-auto text-[11px] text-zinc-500" title={`период поиска: ${p.search_period}`}>
                найдено упоминаний: <span className="text-zinc-300">{p.mentions_found}</span>
              </span>
              <span className="text-[11px] text-zinc-500">
                сложность{" "}
                <span className="tracking-tighter text-zinc-300">
                  {"●".repeat(p.difficulty)}
                  <span className="text-zinc-700">{"●".repeat(5 - p.difficulty)}</span>
                </span>
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-100">{p.statement}</p>
            {p.who_pays_now && (
              <p className="mt-1 text-xs text-zinc-400">
                <span className="text-zinc-500">Кто платит сейчас:</span> {p.who_pays_now}
              </p>
            )}
            {p.why_unsolved && (
              <p className="mt-1 text-xs text-zinc-400">
                <span className="text-zinc-500">Почему не решено:</span> {p.why_unsolved}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              {p.ai_possible && <span className="rounded border border-sky-900 px-1.5 py-0.5 text-sky-300">AI</span>}
              {p.saas_possible && <span className="rounded border border-emerald-900 px-1.5 py-0.5 text-emerald-300">SaaS</span>}
              {p.channel?.map((c) => (
                <span key={c} className="rounded border border-zinc-800 px-1.5 py-0.5 text-zinc-400">{c}</span>
              ))}
              <span className="ml-2 flex flex-wrap gap-2">
                {p.links.slice(0, 4).map((l) => (
                  <a key={l} href={l} target="_blank" rel="noreferrer" className="text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                    {hostname(l)}
                  </a>
                ))}
                {p.links.length > 4 && <span className="text-zinc-600">+{p.links.length - 4}</span>}
              </span>
            </div>
            {!!p.quotes?.length && (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300">цитаты ({p.quotes.length})</summary>
                <ul className="mt-1 space-y-1">
                  {p.quotes.map((q, i) => (
                    <li key={i} className="text-xs italic text-zinc-400">
                      «{q.text}»{" "}
                      <a href={q.source_url} target="_blank" rel="noreferrer" className="not-italic text-zinc-600 hover:text-zinc-400">
                        [{hostname(q.source_url)}]
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
