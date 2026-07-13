import type { Opportunity } from "@/lib/data";
import { STATUS_LABEL } from "@/lib/format";
import { ScoreBar } from "./ScoreCard";

export function OpportunityCard({ opp, rank }: { opp: Opportunity; rank?: number }) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <header className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-100">
          {rank !== undefined && <span className="mr-2 text-zinc-600">#{rank}</span>}
          {opp.name}
        </h3>
        <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
          {STATUS_LABEL[opp.status] ?? opp.status}
        </span>
      </header>

      <p className="text-sm text-zinc-300">{opp.what}</p>
      <p className="mt-2 text-sm text-zinc-400">
        <span className="text-zinc-500">Почему сейчас:</span> {opp.why_now}
      </p>

      <div className="mt-4 space-y-2">
        <ScoreBar label="Launch" score={opp.launch_score} />
        <ScoreBar label="Scale" score={opp.scale_score} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {opp.founder_fit.pluses.map((p) => (
          <span key={p} className="rounded-full border border-emerald-900 bg-emerald-950/50 px-2 py-0.5 text-[11px] text-emerald-300">
            + {p}
          </span>
        ))}
        {opp.founder_fit.minuses.map((m) => (
          <span key={m} className="rounded-full border border-rose-900 bg-rose-950/50 px-2 py-0.5 text-[11px] text-rose-300">
            − {m}
          </span>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-300">
          MVP, первые клиенты, конкуренты, риски
        </summary>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">MVP за 7 дней</dt>
            <dd className="text-zinc-300">{opp.mvp_7_days}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">MVP за 30 дней</dt>
            <dd className="text-zinc-300">{opp.mvp_30_days}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Первые 10 клиентов</dt>
            <dd className="text-zinc-300">{opp.first_10_clients}</dd>
          </div>
          {!!opp.competitors?.length && (
            <div>
              <dt className="text-zinc-500">Конкуренты</dt>
              <dd className="text-zinc-300">
                <ul className="mt-1 space-y-1">
                  {opp.competitors.map((c) => (
                    <li key={c.name}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noreferrer" className="underline decoration-zinc-700 hover:text-zinc-100">
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}{" "}
                      <span className="text-zinc-500">— {c.note}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          {!!opp.risks?.length && (
            <div>
              <dt className="text-zinc-500">Риски</dt>
              <dd className="text-zinc-300">{opp.risks.join(" · ")}</dd>
            </div>
          )}
        </dl>
      </details>

      {opp.test_plan_7_days && (
        <details className="mt-3" open={opp.status === "testing"}>
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-sky-500 hover:text-sky-300">
            План теста за 7 дней
          </summary>
          <dl className="mt-3 space-y-2 rounded-lg border border-sky-950 bg-sky-950/20 p-3 text-sm">
            {opp.test_plan_7_days.offer && (
              <div><dt className="inline text-zinc-500">Оффер: </dt><dd className="inline text-zinc-200">{opp.test_plan_7_days.offer}</dd></div>
            )}
            {opp.test_plan_7_days.landing && (
              <div><dt className="inline text-zinc-500">Лендинг: </dt><dd className="inline text-zinc-300">{opp.test_plan_7_days.landing}</dd></div>
            )}
            {!!opp.test_plan_7_days.channels?.length && (
              <div><dt className="inline text-zinc-500">Каналы: </dt><dd className="inline text-zinc-300">{opp.test_plan_7_days.channels.join("; ")}</dd></div>
            )}
            {opp.test_plan_7_days.budget && (
              <div><dt className="inline text-zinc-500">Бюджет: </dt><dd className="inline text-zinc-300">{opp.test_plan_7_days.budget}</dd></div>
            )}
            {opp.test_plan_7_days.success_criteria && (
              <div><dt className="inline text-zinc-500">Критерий успеха: </dt><dd className="inline text-emerald-300">{opp.test_plan_7_days.success_criteria}</dd></div>
            )}
          </dl>
        </details>
      )}
    </article>
  );
}
