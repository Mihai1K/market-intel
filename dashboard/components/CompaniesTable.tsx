"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface CompanyRow {
  id: string;
  name: string;
  segment: string;
  revenue: number | null;
  revenueUnit: string;
  revenuePeriod: string;
  revenueUrl: string;
  profit: number | null;
  profitUnit: string;
  profitUrl: string;
  headcount: number | null;
  headcountUrl: string;
  vacancies: number | null;
  rating: number | null;
}

type SortKey = "name" | "revenue" | "profit" | "headcount" | "vacancies" | "rating";

const fmt = (v: number | null) =>
  v === null ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v);

export function CompaniesTable({ rows, marketSlug }: { rows: CompanyRow[]; marketSlug: string }) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "string" && typeof bv === "string")
        return asc ? av.localeCompare(bv, "ru") : bv.localeCompare(av, "ru");
      return asc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [rows, sortKey, asc]);

  const header = (key: SortKey, label: string, align = "text-right") => (
    <th
      className={`cursor-pointer select-none px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-300 ${align}`}
      onClick={() => {
        if (sortKey === key) setAsc(!asc);
        else { setSortKey(key); setAsc(key === "name"); }
      }}
    >
      {label} {sortKey === key ? (asc ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-zinc-900/80">
          <tr>
            {header("name", "Компания", "text-left")}
            <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">Сегмент</th>
            {header("revenue", "Выручка")}
            {header("profit", "Прибыль")}
            {header("headcount", "Сотрудники")}
            {header("vacancies", "Вакансии")}
            {header("rating", "Рейтинг")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-t border-zinc-800/70 hover:bg-zinc-900/40">
              <td className="px-3 py-2">
                <Link href={`/markets/${marketSlug}/companies/${r.id}`} className="font-medium text-zinc-100 hover:text-emerald-300">
                  {r.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-zinc-400">{r.segment}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.revenue !== null ? (
                  <span>
                    {fmt(r.revenue)} <span className="text-[10px] text-zinc-500">{r.revenueUnit} · {r.revenuePeriod}</span>
                    {r.revenueUrl && (
                      <a href={r.revenueUrl} target="_blank" rel="noreferrer" className="ml-1 text-[10px] text-zinc-500 hover:text-zinc-300">↗</a>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.profit !== null ? (
                  <span className={r.profit < 0 ? "text-rose-400" : "text-zinc-200"}>
                    {fmt(r.profit)} <span className="text-[10px] text-zinc-500">{r.profitUnit}</span>
                    {r.profitUrl && (
                      <a href={r.profitUrl} target="_blank" rel="noreferrer" className="ml-1 text-[10px] text-zinc-500 hover:text-zinc-300">↗</a>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {r.headcount !== null ? (
                  <span>
                    {fmt(r.headcount)}
                    {r.headcountUrl && (
                      <a href={r.headcountUrl} target="_blank" rel="noreferrer" className="ml-1 text-[10px] text-zinc-500 hover:text-zinc-300">↗</a>
                    )}
                  </span>
                ) : (
                  <span className="text-zinc-600">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(r.vacancies)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{r.rating !== null ? r.rating : <span className="text-zinc-600">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
