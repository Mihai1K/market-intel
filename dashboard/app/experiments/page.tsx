import Link from "next/link";
import { getExperiments, getDecisions, getAllMarkets } from "@/lib/data";
import { fmtNum } from "@/lib/format";

export const dynamic = "force-dynamic";

const VERDICT: Record<string, { label: string; cls: string }> = {
  running: { label: "идёт", cls: "border-sky-900 bg-sky-950/40 text-sky-300" },
  confirmed: { label: "подтверждена", cls: "border-emerald-900 bg-emerald-950/40 text-emerald-300" },
  partial: { label: "частично", cls: "border-amber-900 bg-amber-950/40 text-amber-300" },
  failed: { label: "провалена", cls: "border-rose-900 bg-rose-950/40 text-rose-300" },
};

const DECISION: Record<string, { label: string; cls: string }> = {
  rejected: { label: "отклонено", cls: "border-rose-900 bg-rose-950/40 text-rose-300" },
  deferred: { label: "отложено", cls: "border-amber-900 bg-amber-950/40 text-amber-300" },
  testing: { label: "в тесте", cls: "border-sky-900 bg-sky-950/40 text-sky-300" },
  accepted: { label: "принято", cls: "border-emerald-900 bg-emerald-950/40 text-emerald-300" },
};

export default function ExperimentsPage() {
  const experiments = getExperiments();
  const decisions = [...getDecisions()].sort((a, b) => (a.date < b.date ? 1 : -1));
  const marketNames: Record<string, string> = {};
  for (const b of getAllMarkets()) marketNames[b.slug] = b.market?.name ?? b.slug;

  const num = (v?: number) => (v === undefined ? "—" : fmtNum(v));

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-50">Эксперименты</h1>
        <p className="mb-6 max-w-3xl text-sm text-zinc-400">
          Реальные проверки гипотез: расходы, заявки, продажи, CAC, вывод. Числа здесь — собственные
          данные, а не интернет. Через год эта таблица — самый дорогой актив платформы.
        </p>
        {experiments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
            Экспериментов пока нет. Первый появится, когда возможность из{" "}
            <Link href="/rating" className="text-emerald-400 underline decoration-emerald-900 hover:text-emerald-300">
              рейтинга
            </Link>{" "}
            уйдёт в тест: лендинг → трафик → заявки → запись результата сюда.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Идея</th>
                  <th className="px-3 py-2">Тип / канал</th>
                  <th className="px-3 py-2 text-right">Потрачено, ₽</th>
                  <th className="px-3 py-2 text-right">Клики</th>
                  <th className="px-3 py-2 text-right">Лиды</th>
                  <th className="px-3 py-2 text-right">Продажи</th>
                  <th className="px-3 py-2 text-right">CAC, ₽</th>
                  <th className="px-3 py-2">Вердикт</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((e) => {
                  const v = VERDICT[e.verdict];
                  return (
                    <tr key={e.id} className="border-t border-zinc-800/70 align-top hover:bg-zinc-900/40">
                      <td className="px-3 py-2">
                        <Link href={`/markets/${e.market}`} className="font-medium text-zinc-100 hover:text-emerald-300">
                          {e.opportunity_id}
                        </Link>
                        <div className="text-xs text-zinc-500">
                          {marketNames[e.market] ?? e.market} · {e.started_at}
                          {e.finished_at ? ` — ${e.finished_at}` : ""}
                        </div>
                        {e.conclusion && <div className="mt-1 max-w-md text-xs text-zinc-400">{e.conclusion}</div>}
                      </td>
                      <td className="px-3 py-2 text-zinc-300">
                        {e.type}
                        <div className="text-xs text-zinc-500">{e.channel}</div>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(e.spend_rub ?? e.budget_rub)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(e.clicks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-100">{num(e.leads)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-emerald-300">{num(e.sales)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(e.cac_rub)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${v.cls}`}>{v.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold text-zinc-100">Журнал решений</h2>
        <p className="mb-4 max-w-3xl text-xs text-zinc-500">
          Почему идея отклонена или отложена — чтобы через год не возвращаться к отвергнутому без новых причин.
        </p>
        <ul className="space-y-3">
          {decisions.map((d, i) => {
            const dd = DECISION[d.decision];
            return (
              <li key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] ${dd.cls}`}>{dd.label}</span>
                  <span className="text-sm font-medium text-zinc-100">{d.opportunity_name}</span>
                  <span className="text-xs text-zinc-500">
                    {marketNames[d.market] ?? d.market} · {d.date} · {d.author}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{d.reason}</p>
                {d.revisit && (
                  <p className="mt-1 text-xs text-zinc-500">
                    <span className="text-zinc-400">Вернуться:</span> {d.revisit}
                  </p>
                )}
              </li>
            );
          })}
          {!decisions.length && <li className="text-sm text-zinc-500">решений пока нет</li>}
        </ul>
      </section>
    </div>
  );
}
