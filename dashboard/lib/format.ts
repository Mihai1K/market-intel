export function fmtNum(v: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v);
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const METHOD_LABEL: Record<string, string> = {
  reported: "раскрыто",
  estimated: "оценка",
  derived: "расчёт",
};

export const METHOD_COLOR: Record<string, string> = {
  reported: "text-emerald-400 border-emerald-900",
  estimated: "text-amber-400 border-amber-900",
  derived: "text-sky-400 border-sky-900",
};

export function scoreColor(total: number): string {
  if (total >= 80) return "text-emerald-400";
  if (total >= 65) return "text-lime-400";
  if (total >= 50) return "text-amber-400";
  return "text-zinc-400";
}

export function scoreBarColor(total: number): string {
  if (total >= 80) return "bg-emerald-500";
  if (total >= 65) return "bg-lime-500";
  if (total >= 50) return "bg-amber-500";
  return "bg-zinc-500";
}

export const STATUS_LABEL: Record<string, string> = {
  candidate: "кандидат",
  testing: "в тесте",
  "tested-ok": "тест ок",
  "tested-fail": "тест провален",
  rejected: "отклонена",
};

export const WF_STATUS: Record<string, { label: string; cls: string }> = {
  manual: { label: "вручную", cls: "bg-rose-950 text-rose-300 border-rose-900" },
  semi: { label: "частично", cls: "bg-amber-950 text-amber-300 border-amber-900" },
  automated: { label: "автоматизировано", cls: "bg-emerald-950 text-emerald-300 border-emerald-900" },
};
