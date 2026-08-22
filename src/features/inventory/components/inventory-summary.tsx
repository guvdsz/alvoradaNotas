import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes } from "lucide-react";

import type { InventorySummaryData } from "@/features/inventory/types/inventory";

const emptySummary: InventorySummaryData = {
  productsCount: 0,
  entriesToday: 0,
  exitsToday: 0,
  lowStockCount: 0,
};

export function InventorySummary({
  data = emptySummary,
  loading = false,
}: {
  data?: InventorySummaryData;
  loading?: boolean;
}) {
  const metrics = [
    { label: "Produtos cadastrados", value: data.productsCount, detail: data.productsCount === 0 ? "Nenhum produto cadastrado" : "Produtos ativos no estoque", icon: Boxes, tone: "bg-blue-50 text-blue-700" },
    { label: "Entradas hoje", value: data.entriesToday, detail: data.entriesToday === 0 ? "Nenhuma entrada registrada" : "Entradas registradas hoje", icon: ArrowDownToLine, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Saídas hoje", value: data.exitsToday, detail: data.exitsToday === 0 ? "Nenhuma saída registrada" : "Saídas registradas hoje", icon: ArrowUpFromLine, tone: "bg-orange-50 text-orange-700" },
    { label: "Estoque baixo", value: data.lowStockCount, detail: data.lowStockCount === 0 ? "Tudo certo por enquanto" : "Produtos pedindo reposição", icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
  ];
  return (
    <section
      aria-label="Resumo do estoque"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <article
            key={metric.label}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(41,37,36,0.04)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-stone-500">
                  {metric.label}
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
                  {loading ? "—" : metric.value}
                </p>
              </div>
              <span className={`rounded-xl p-2.5 ${metric.tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-xs text-stone-500">{metric.detail}</p>
          </article>
        );
      })}
    </section>
  );
}
