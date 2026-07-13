import { getAllMarkets } from "@/lib/data";
import { PainsList } from "@/components/PainsList";

export const dynamic = "force-dynamic";

export default function PainsPage() {
  const markets = getAllMarkets();
  const marketNames: Record<string, string> = {};
  const pains = markets.flatMap((b) => {
    marketNames[b.slug] = b.market?.name ?? b.slug;
    return (b.pains?.pains ?? []).map((p) => ({ ...p, market: b.slug }));
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-50">База болей</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Все подтверждённые боли по всем рынкам. Проблемы рождают продукты.
      </p>
      <PainsList pains={pains} marketNames={marketNames} />
    </div>
  );
}
