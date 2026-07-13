import Link from "next/link";
import { getGlobalOpportunities, getMarketSlugs, getLaunchTrends, getDecisions } from "@/lib/data";
import { scoreColor, STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function RatingPage() {
  const opps = getGlobalOpportunities();
  const marketsCount = getMarketSlugs().length;
  const trends = getLaunchTrends();
  const decisions = getDecisions();
  const decisionFor = (slug: string, id: string) =>
    decisions.find((d) => d.market === slug && d.opportunity_id === id);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-50">
        Глобальный рейтинг возможностей
      </h1>
      <p className="mb-6 max-w-3xl text-sm text-zinc-400">
        Все возможности всех рынков в одной таблице, сортировка по Launch Score — «можно ли
        заработать первые деньги за 30 дней». Рейтинг обновляется после каждого нового
        исследованного рынка.
      </p>

      {marketsCount < 5 && (
        <div className="mb-6 rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-200">
          Исследовано рынков: {marketsCount}. Рейтинг станет осмысленным для выбора «куда идти»
          после 10–15 рынков — пока это лучший вариант среди исследованного, а не среди всего.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 text-right">#</th>
              <th className="px-3 py-2">Возможность</th>
              <th className="px-3 py-2">Рынок</th>
              <th className="px-3 py-2 text-right">Launch</th>
              <th className="px-3 py-2 text-right">Scale</th>
              <th className="px-3 py-2 text-right">Founder Fit</th>
              <th className="px-3 py-2">Статус</th>
            </tr>
          </thead>
          <tbody>
            {opps.map((g, i) => (
              <tr key={`${g.slug}-${g.opp.id}`} className="border-t border-zinc-800/70 hover:bg-zinc-900/40">
                <td className="px-3 py-2 text-right tabular-nums text-zinc-600">{i + 1}</td>
                <td className="px-3 py-2">
                  <Link href={`/markets/${g.slug}`} className="font-medium text-zinc-100 hover:text-emerald-300">
                    {g.opp.name}
                  </Link>
                  <div className="mt-0.5 line-clamp-1 max-w-md text-xs text-zinc-500">{g.opp.what}</div>
                  {(() => {
                    const d = decisionFor(g.slug, g.opp.id);
                    if (!d) return null;
                    return (
                      <div className="mt-1 max-w-md text-xs text-amber-400/90" title={d.reason}>
                        решение {d.date}: {d.decision === "rejected" ? "отклонено" : d.decision === "deferred" ? "отложено" : d.decision} — {d.reason.slice(0, 90)}…
                      </div>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 text-zinc-400">
                  <Link href={`/markets/${g.slug}`} className="hover:text-zinc-200">
                    {g.marketName}
                  </Link>
                </td>
                <td className={`px-3 py-2 text-right text-base font-semibold tabular-nums ${scoreColor(g.opp.launch_score.total)}`}>
                  {g.opp.launch_score.total}
                  {(() => {
                    const t = trends.get(`${g.slug}/${g.opp.id}`);
                    if (!t || t.prev === t.current) return null;
                    const up = t.current > t.prev;
                    return (
                      <span
                        className={`ml-1 text-xs ${up ? "text-emerald-400" : "text-rose-400"}`}
                        title={`было ${t.prev} (${t.prevDate})`}
                      >
                        {up ? "↑" : "↓"}
                        {Math.abs(t.current - t.prev)}
                      </span>
                    );
                  })()}
                </td>
                <td className={`px-3 py-2 text-right tabular-nums ${scoreColor(g.opp.scale_score.total)}`}>
                  {g.opp.scale_score.total}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                  {g.founderFitScore !== null ? `${g.founderFitScore}/10` : "—"}
                </td>
                <td className="px-3 py-2">
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                    {STATUS_LABEL[g.opp.status] ?? g.opp.status}
                  </span>
                </td>
              </tr>
            ))}
            {!opps.length && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-zinc-600">
                  возможностей пока нет — исследуй первый рынок
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-zinc-600">
        Founder Fit — компонент Launch Score, оценённый против data/founder.json. Полные карточки с
        обоснованием каждой оценки — на странице рынка.
      </p>
    </div>
  );
}
