import type { Score } from "@/lib/data";
import { scoreBarColor, scoreColor } from "@/lib/format";

export function ScoreBar({ label, score }: { label: string; score: Score }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="w-24 shrink-0 text-xs uppercase tracking-wide text-zinc-500">{label}</span>
        <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${scoreBarColor(score.total)}`}
            style={{ width: `${score.total}%` }}
          />
        </span>
        <span className={`w-10 shrink-0 text-right text-sm font-semibold tabular-nums ${scoreColor(score.total)}`}>
          {score.total}
        </span>
        <span className="text-xs text-zinc-600 transition group-open:rotate-90">▸</span>
      </summary>
      <ul className="mt-2 space-y-1 border-l border-zinc-800 pl-4">
        {score.components.map((c) => (
          <li key={c.name} className="text-xs text-zinc-400">
            <span className="text-zinc-300">{c.name}</span>{" "}
            <span className="tabular-nums text-zinc-200">{c.score}/10</span>
            <span className="text-zinc-600"> × {c.weight}</span> — {c.why}
          </li>
        ))}
      </ul>
    </details>
  );
}
