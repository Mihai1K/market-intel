import Link from "next/link";
import { getAllMarkets, getOpportunityOfTheWeek, getCoverage, sizeRange, latestFact } from "@/lib/data";
import { fmtNum, scoreColor } from "@/lib/format";
import { OpportunityCard } from "@/components/OpportunityCard";
import { FactValue } from "@/components/FactValue";

export const dynamic = "force-dynamic";

const COVERAGE_STATUS: Record<string, { icon: string; label: string; cls: string }> = {
  done: { icon: "✅", label: "завершён", cls: "text-emerald-300" },
  "in-progress": { icon: "⏳", label: "в работе", cls: "text-amber-300" },
  todo: { icon: "⬜", label: "не начат", cls: "text-zinc-500" },
};

export default function Home() {
  const markets = getAllMarkets();
  const otw = getOpportunityOfTheWeek();
  const coverage = getCoverage();

  return (
    <div className="space-y-10">
      {otw && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Возможность недели · {otw.marketName}
          </h2>
          <OpportunityCard opp={otw.opp} />
          <div className="mt-2 flex justify-end gap-4">
            <Link
              href={`/markets/${otw.slug}`}
              className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300"
            >
              все возможности рынка →
            </Link>
            <Link
              href="/rating"
              className="text-xs text-emerald-500 underline decoration-emerald-900 hover:text-emerald-300"
            >
              глобальный рейтинг →
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-baseline gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Покрытие рынков</h2>
          <span className="text-[11px] text-zinc-600">
            исследовано {coverage.totals.markets} из {coverage.rows.length} · {coverage.totals.companies} компаний ·{" "}
            {coverage.totals.pains} болей · {coverage.totals.opportunities} возможностей · {coverage.totals.experiments} экспериментов
          </span>
          <span className="ml-auto text-[11px] text-zinc-600">KPI к 2026-08-13: 10 рынков</span>
        </div>
        <div className="mb-8 overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Рынок</th>
                <th className="px-3 py-2 text-right">Компаний</th>
                <th className="px-3 py-2 text-right">Болей</th>
                <th className="px-3 py-2 text-right">Возможностей</th>
                <th className="px-3 py-2 text-right">Экспериментов</th>
                <th className="px-3 py-2">Статус</th>
              </tr>
            </thead>
            <tbody>
              {coverage.rows.map((r) => {
                const st = COVERAGE_STATUS[r.status];
                return (
                  <tr key={r.name} className="border-t border-zinc-800/70">
                    <td className="px-3 py-1.5">
                      {r.slug && r.status !== "todo" ? (
                        <Link href={`/markets/${r.slug}`} className="text-zinc-200 hover:text-emerald-300">
                          {r.name}
                        </Link>
                      ) : (
                        <span className="text-zinc-500">{r.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{r.companies || "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{r.pains || "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{r.opportunities || "—"}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-zinc-400">{r.experiments || "—"}</td>
                    <td className={`px-3 py-1.5 text-xs ${st.cls}`}>
                      {st.icon} {st.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Рынки</h2>
        {markets.length === 0 && (
          <p className="text-sm text-zinc-500">Рынков пока нет. Запусти исследование первого рынка.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {markets.map((b) => {
            const range = sizeRange(b.market);
            const growth = latestFact(b.market?.growth);
            const opps = (b.opportunities?.opportunities ?? [])
              .filter((o) => o.status === "candidate" || o.status === "testing")
              .sort((a, z) => z.launch_score.total - a.launch_score.total);
            const top = opps[0];
            return (
              <Link
                key={b.slug}
                href={`/markets/${b.slug}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-600"
              >
                <h3 className="font-semibold text-zinc-100 group-hover:text-emerald-300">
                  {b.market?.name ?? b.slug}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{b.market?.description}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="text-zinc-300">
                    {range ? (
                      <>
                        <span className="text-zinc-500">Объём РФ: </span>
                        {fmtNum(range.min.value)}–{fmtNum(range.max.value)} {range.max.unit}
                        <span className="ml-1 text-xs text-zinc-500">({range.max.period})</span>
                      </>
                    ) : (
                      <span className="text-zinc-600">объём не оценён</span>
                    )}
                  </div>
                  {growth && (
                    <div className="text-xs text-zinc-400">
                      <span className="text-zinc-500">Рост: </span>
                      <FactValue fact={growth} compact />
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-3 text-[11px] text-zinc-500">
                  <span>{b.companies.length} компаний</span>
                  <span>{b.pains?.pains.length ?? 0} болей</span>
                  <span>{b.opportunities?.opportunities.length ?? 0} возможностей</span>
                </div>
                {top && (
                  <div className="mt-3 border-t border-zinc-800 pt-2 text-xs">
                    <span className="text-zinc-500">Топ: </span>
                    <span className="text-zinc-300">{top.name}</span>
                    <span className={`ml-2 font-semibold ${scoreColor(top.launch_score.total)}`}>
                      {top.launch_score.total}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
