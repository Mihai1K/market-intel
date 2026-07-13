import type { Fact } from "@/lib/data";
import { fmtNum, hostname, METHOD_COLOR, METHOD_LABEL } from "@/lib/format";

export function FactValue({ fact, compact = false }: { fact: Fact | null; compact?: boolean }) {
  if (!fact) return <span className="text-zinc-600">нет в открытых источниках</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <span className="font-medium text-zinc-100">
        {fmtNum(fact.value)} {fact.unit}
      </span>
      <span className="text-xs text-zinc-500">{fact.period}</span>
      {!compact && (
        <>
          <span className={`rounded border px-1 text-[10px] leading-4 ${METHOD_COLOR[fact.method]}`}>
            {METHOD_LABEL[fact.method]}
            {fact.basis ? ` · ${fact.basis}` : ""}
          </span>
          <a
            href={fact.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-500 underline decoration-zinc-700 hover:text-zinc-300"
            title={fact.source_name}
          >
            {hostname(fact.source_url)}
          </a>
        </>
      )}
    </span>
  );
}

export function FactCell({ fact }: { fact: Fact | null }) {
  if (!fact) return <span className="text-zinc-600">—</span>;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-zinc-100">{fmtNum(fact.value)}</span>
      <span className="text-[10px] text-zinc-500">{fact.unit}</span>
      <a
        href={fact.source_url}
        target="_blank"
        rel="noreferrer"
        title={`${fact.source_name} · ${fact.period} · ${METHOD_LABEL[fact.method]}`}
        className="text-[10px] text-zinc-500 hover:text-zinc-300"
      >
        ↗
      </a>
    </span>
  );
}
