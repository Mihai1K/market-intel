import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompany, getMarketBundle, type Fact } from "@/lib/data";
import { fmtNum, hostname, METHOD_COLOR, METHOD_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

function FinanceTable({ title, facts }: { title: string; facts?: Fact[] }) {
  if (!facts?.length) {
    return (
      <div className="rounded-lg border border-zinc-800 p-3">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{title}</div>
        <div className="mt-1 text-sm text-zinc-600">нет в открытых источниках</div>
      </div>
    );
  }
  const sorted = [...facts].sort((a, b) => (a.period > b.period ? 1 : -1));
  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{title}</div>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {sorted.map((f, i) => (
            <tr key={i} className="border-t border-zinc-800/50 first:border-0">
              <td className="py-1 pr-3 text-xs tabular-nums text-zinc-500">{f.period}</td>
              <td className={`py-1 pr-3 text-right tabular-nums ${f.value < 0 ? "text-rose-400" : "text-zinc-100"}`}>
                {fmtNum(f.value)} <span className="text-[10px] text-zinc-500">{f.unit}</span>
              </td>
              <td className="py-1 text-right">
                <span className={`mr-2 rounded border px-1 text-[10px] ${METHOD_COLOR[f.method]}`}>
                  {f.basis ?? METHOD_LABEL[f.method]}
                </span>
                <a href={f.source_url} target="_blank" rel="noreferrer" className="text-[11px] text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                  {hostname(f.source_url)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string; company: string }>;
}) {
  const { slug, company } = await params;
  const c = getCompany(slug, company);
  if (!c) notFound();
  const marketName = getMarketBundle(slug).market?.name ?? slug;

  return (
    <div className="max-w-4xl">
      <nav className="mb-4 text-xs text-zinc-500">
        <Link href={`/markets/${slug}`} className="underline decoration-zinc-800 hover:text-zinc-300">
          {marketName}
        </Link>{" "}
        / {c.name}
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">{c.name}</h1>
        <p className="mt-1 text-sm text-zinc-400">{c.description}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          {c.legal_name && <span>{c.legal_name}</span>}
          {c.inn && <span>ИНН {c.inn}</span>}
          {c.founded && <span>осн. {c.founded}</span>}
          <span className="text-zinc-400">{c.segment}</span>
          <a href={c.website} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300">
            {hostname(c.website)}
          </a>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <FinanceTable title="Выручка" facts={c.revenue} />
        <FinanceTable title="Чистая прибыль" facts={c.net_profit} />
        <FinanceTable title="Сотрудники" facts={c.headcount} />
      </div>

      {!!c.disclosed_metrics?.length && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
            Метрики, раскрытые самой компанией
          </h2>
          <ul className="space-y-1">
            {c.disclosed_metrics.map((d, i) => (
              <li key={i} className="text-sm text-zinc-300">
                <span className="text-zinc-500">{d.metric}: </span>
                {fmtNum(d.value)} {d.unit}
                <span className="ml-1 text-xs text-zinc-500">({d.period})</span>{" "}
                <a href={d.source_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                  {hostname(d.source_url)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {!!c.pricing?.length && (
          <section className="rounded-lg border border-zinc-800 p-4">
            <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Тарифы</h2>
            <ul className="space-y-1.5">
              {c.pricing.map((p, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-zinc-300">{p.plan}</span>
                  <span className="text-zinc-100">
                    {p.price}{" "}
                    <a href={p.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-zinc-500 hover:text-zinc-300">↗</a>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-zinc-800 p-4">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Отзывы и жалобы</h2>
          {c.review_rating ? (
            <p className="text-sm text-zinc-200">
              {c.review_rating.rating} {c.review_rating.scale && <span className="text-zinc-500">{c.review_rating.scale}</span>}
              {c.review_rating.count_note && <span className="ml-1 text-xs text-zinc-500">({c.review_rating.count_note})</span>}{" "}
              <a href={c.review_rating.source_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                {hostname(c.review_rating.source_url)}
              </a>
            </p>
          ) : (
            <p className="text-sm text-zinc-600">рейтинг не найден</p>
          )}
          <ul className="mt-2 space-y-1">
            {(c.top_complaints ?? []).map((t, i) => (
              <li key={i} className="text-xs text-zinc-400">
                • {t.complaint}{" "}
                <a href={t.source_url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-zinc-400">
                  [{hostname(t.source_url)}]
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {!!c.funding?.length && (
        <section className="mt-6">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Инвестиции и M&A</h2>
          <ul className="space-y-1">
            {c.funding.map((f, i) => (
              <li key={i} className="text-sm text-zinc-300">
                {f.date && <span className="mr-2 text-xs tabular-nums text-zinc-500">{f.date}</span>}
                {f.event}{" "}
                <a href={f.source_url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 underline decoration-zinc-800 hover:text-zinc-300">
                  [{hostname(f.source_url)}]
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!c.data_gaps?.length && (
        <section className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Нет в открытых источниках</h2>
          <p className="text-xs text-zinc-500">{c.data_gaps.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
