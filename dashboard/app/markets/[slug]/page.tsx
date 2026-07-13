import { notFound } from "next/navigation";
import { getMarketBundle, getMarketSlugs, latestFact, sizeRange } from "@/lib/data";
import { fmtNum, hostname, WF_STATUS } from "@/lib/format";
import { Tabs } from "@/components/Tabs";
import { OpportunityCard } from "@/components/OpportunityCard";
import { PainsList } from "@/components/PainsList";
import { CompaniesTable, type CompanyRow } from "@/components/CompaniesTable";
import { FactValue } from "@/components/FactValue";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getMarketSlugs().map((slug) => ({ slug }));
}

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = getMarketBundle(slug);
  if (!b.market) notFound();
  const m = b.market;
  const range = sizeRange(m);

  const opps = [...(b.opportunities?.opportunities ?? [])].sort(
    (a, z) => z.launch_score.total - a.launch_score.total
  );

  const rows: CompanyRow[] = b.companies.map((c) => {
    const rev = latestFact(c.revenue);
    const prof = latestFact(c.net_profit);
    const hc = latestFact(c.headcount);
    return {
      id: c.id,
      name: c.name,
      segment: c.segment,
      revenue: rev?.value ?? null,
      revenueUnit: rev?.unit ?? "",
      revenuePeriod: rev?.period ?? "",
      revenueUrl: rev?.source_url ?? "",
      profit: prof?.value ?? null,
      profitUnit: prof?.unit ?? "",
      profitUrl: prof?.source_url ?? "",
      headcount: hc?.value ?? null,
      headcountUrl: hc?.source_url ?? "",
      vacancies: c.vacancies_now?.value ?? null,
      rating: c.review_rating?.rating ?? null,
    };
  });

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{m.name}</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">{m.description}</p>

        <div className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Объём рынка РФ (вилка)</div>
            {range ? (
              <div className="mt-1 text-lg font-semibold text-zinc-100">
                {fmtNum(range.min.value)}–{fmtNum(range.max.value)} {range.max.unit}
              </div>
            ) : (
              <div className="mt-1 text-zinc-600">не оценён</div>
            )}
            <ul className="mt-1 space-y-0.5">
              {m.market_size_rf.estimates.map((e, i) => (
                <li key={i} className="text-xs text-zinc-500">
                  <FactValue fact={e} />
                  {e.scope && <span className="ml-1 text-zinc-600">({e.scope})</span>}
                </li>
              ))}
            </ul>
            {m.market_size_rf.range_note && (
              <p className="mt-1 text-xs text-zinc-600">{m.market_size_rf.range_note}</p>
            )}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">Рост</div>
            <ul className="mt-1 space-y-0.5">
              {(m.growth ?? []).map((g, i) => (
                <li key={i} className="text-sm text-zinc-300">
                  <FactValue fact={g} />
                  {g.scope && <span className="ml-1 text-xs text-zinc-600">({g.scope})</span>}
                </li>
              ))}
              {!m.growth?.length && <li className="text-zinc-600">нет данных</li>}
            </ul>
          </div>
        </div>
      </header>

      <Tabs
        tabs={[
          {
            id: "opps",
            label: "Возможности",
            badge: opps.length,
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                {opps.map((o, i) => (
                  <OpportunityCard key={o.id} opp={o} rank={i + 1} />
                ))}
                {!opps.length && <p className="text-sm text-zinc-500">возможности ещё не оценены</p>}
              </div>
            ),
          },
          {
            id: "pains",
            label: "Боли",
            badge: b.pains?.pains.length ?? 0,
            content: (
              <div>
                {!!b.pains?.surveys?.length && (
                  <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                    <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Данные опросов</div>
                    <ul className="space-y-1">
                      {b.pains.surveys.map((s, i) => (
                        <li key={i} className="text-sm text-zinc-300">
                          {s.finding}{" "}
                          <a href={s.source_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                            {s.source_name}
                            {s.period ? `, ${s.period}` : ""}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <PainsList pains={b.pains?.pains ?? []} />
              </div>
            ),
          },
          {
            id: "workflows",
            label: "Процессы",
            badge: b.workflows?.workflows.length ?? 0,
            content: (
              <div className="grid gap-6 lg:grid-cols-2">
                {(b.workflows?.workflows ?? []).map((wf) => (
                  <section key={wf.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h3 className="font-semibold text-zinc-100">{wf.name}</h3>
                    <p className="text-xs text-zinc-500">процесс: {wf.actor}</p>
                    <ol className="mt-4 space-y-3">
                      {wf.steps.map((s, i) => {
                        const st = WF_STATUS[s.status];
                        return (
                          <li key={i} className="relative border-l border-zinc-800 pl-4">
                            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-zinc-700" />
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-zinc-200">{s.name}</span>
                              <span className={`rounded border px-1.5 py-0.5 text-[10px] ${st.cls}`}>{st.label}</span>
                              {s.can_ai && <span className="rounded border border-sky-900 px-1.5 py-0.5 text-[10px] text-sky-300">AI</span>}
                              {s.can_bot && <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">бот</span>}
                            </div>
                            {(s.evidence || s.evidence_url) && (
                              <p className="mt-0.5 text-xs text-zinc-500">
                                {s.evidence}
                                {s.evidence_url && (
                                  <a href={s.evidence_url} target="_blank" rel="noreferrer" className="ml-1 underline decoration-zinc-800 hover:text-zinc-300">
                                    [{hostname(s.evidence_url)}]
                                  </a>
                                )}
                              </p>
                            )}
                            {s.time_cost && (
                              <p className="text-xs text-zinc-600">
                                ⏱ {s.time_cost}
                                {s.time_cost_url && (
                                  <a href={s.time_cost_url} target="_blank" rel="noreferrer" className="ml-1 underline decoration-zinc-800 hover:text-zinc-400">
                                    [{hostname(s.time_cost_url)}]
                                  </a>
                                )}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
                {!b.workflows?.workflows.length && <p className="text-sm text-zinc-500">процессы ещё не описаны</p>}
              </div>
            ),
          },
          {
            id: "companies",
            label: "Игроки",
            badge: b.companies.length,
            content: (
              <div>
                <CompaniesTable rows={rows} marketSlug={slug} />
                <p className="mt-2 text-[11px] text-zinc-600">
                  ↗ — ссылка на источник цифры. «—» означает: нет в открытых источниках, а не ноль.
                </p>
              </div>
            ),
          },
          {
            id: "money",
            label: "Деньги рынка",
            content: (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                    Buying power — насколько легко здесь покупают
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full min-w-[560px] text-sm">
                      <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="px-3 py-2">Сегмент клиентов</th>
                          <th className="px-3 py-2">Типичный бюджет</th>
                          <th className="px-3 py-2">Цикл сделки</th>
                          <th className="px-3 py-2">Лёгкость покупки</th>
                          <th className="px-3 py-2">Пруфы</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(m.buying_power ?? []).map((bp, i) => (
                          <tr key={i} className="border-t border-zinc-800/70">
                            <td className="px-3 py-2 text-zinc-200">{bp.segment}</td>
                            <td className="px-3 py-2 text-zinc-300">{bp.typical_budget}</td>
                            <td className="px-3 py-2 text-zinc-400">{bp.deal_cycle ?? "—"}</td>
                            <td className="px-3 py-2 text-amber-300">
                              {"★".repeat(bp.ease_of_purchase)}
                              <span className="text-zinc-700">{"★".repeat(5 - bp.ease_of_purchase)}</span>
                            </td>
                            <td className="px-3 py-2">
                              {bp.evidence.map((e, j) => (
                                <a key={j} href={e.source_url} target="_blank" rel="noreferrer" title={e.note} className="mr-2 text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                                  {hostname(e.source_url)}
                                </a>
                              ))}
                            </td>
                          </tr>
                        ))}
                        {!m.buying_power?.length && (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-zinc-600">нет данных</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {!!m.events?.length && (
                  <section>
                    <h3 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">События рынка</h3>
                    <ul className="space-y-1.5">
                      {m.events.map((e, i) => (
                        <li key={i} className="text-sm text-zinc-300">
                          <span className="mr-2 text-xs tabular-nums text-zinc-500">{e.date}</span>
                          {e.event}{" "}
                          <a href={e.source_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                            [{hostname(e.source_url)}]
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
