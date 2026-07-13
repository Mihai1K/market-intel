import Link from "next/link";
import { getAllMarkets, getOpportunityOfTheWeek, sizeRange, latestFact } from "@/lib/data";
import { fmtNum, scoreColor } from "@/lib/format";
import { OpportunityCard } from "@/components/OpportunityCard";
import { FactValue } from "@/components/FactValue";

export const dynamic = "force-dynamic";

export default function Home() {
  const markets = getAllMarkets();
  const otw = getOpportunityOfTheWeek();

  return (
    <div className="space-y-10">
      {otw && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Возможность недели · {otw.marketName}
          </h2>
          <OpportunityCard opp={otw.opp} />
          <div className="mt-2 text-right">
            <Link
              href={`/markets/${otw.slug}`}
              className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300"
            >
              все возможности рынка →
            </Link>
          </div>
        </section>
      )}

      <section>
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
