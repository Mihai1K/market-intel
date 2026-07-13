"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { id: string; label: string; badge?: number; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 text-sm transition ${
              active === t.id
                ? "border-emerald-500 text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
            {t.badge !== undefined && (
              <span className="ml-1.5 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="pt-5">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  );
}
