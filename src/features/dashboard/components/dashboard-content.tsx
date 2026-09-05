"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, PackagePlus } from "lucide-react";

import { DataErrorState } from "@/components/ui/data-error-state";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { InventorySummary } from "@/features/dashboard/components/inventory-summary";
import { getInventoryDashboard } from "@/features/dashboard/services/dashboard.service";
import type { InventoryDashboardData } from "@/features/dashboard/types/dashboard";
import { formatStock } from "@/features/products/utils/product-formatters";
import { formatCurrency } from "@/lib/utils/formatters";

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function DashboardContent() {
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadDashboard = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const dashboard = await getInventoryDashboard();
      if (requestId.current === currentRequest) setData(dashboard);
    } catch (error) {
      console.error("[Dashboard] Não foi possível carregar os dados.", error);
      if (requestId.current === currentRequest) {
        setLoadError("Verifique sua conexão e tente novamente.");
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadDashboard();
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Olá!</h1>
          <p className="mt-2 text-sm text-stone-500">Acompanhe o movimento e a situação do estoque do empório.</p>
        </div>
        <div className="grid w-full gap-2 min-[390px]:grid-cols-2 sm:flex sm:w-auto">
          <Link href="/movements?type=entry" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-brand-300 hover:bg-cream-50"><ArrowDownToLine className="size-4" />Nova entrada</Link>
          <Link href="/movements?type=exit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"><ArrowUpFromLine className="size-4" />Registrar saída</Link>
        </div>
      </section>

      {loadError && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <DataErrorState
            message={loadError}
            onRetry={() => void loadDashboard()}
          />
        </section>
      )}

      {data && <div className="mt-8"><InventorySummary data={data.summary} /></div>}

      {data && <section className="mt-6">
        <article className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
          <h2 className="font-bold text-stone-900">Movimentações recentes</h2>
          <p className="mt-1 text-sm text-stone-500">Últimas entradas e saídas registradas.</p>
          {data.recentMovements.length ? (
            <div className="mt-5 divide-y divide-stone-100">
              {data.recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center gap-3 py-3">
                  <span className={movement.type === "entry" ? "rounded-xl bg-emerald-50 p-2 text-emerald-700" : "rounded-xl bg-orange-50 p-2 text-orange-700"}>{movement.type === "entry" ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-800">{movement.productName}</p><p className="truncate text-xs text-stone-600">{movement.reason}</p></div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-stone-800">{movement.type === "entry" ? "+" : "−"}{formatStock(movement.quantityInBaseUnit, movement.productUnit)}</p>
                    {movement.type === "exit" && movement.saleValueInCents !== null && (
                      <p className="text-xs font-semibold text-stone-600">{formatCurrency(movement.saleValueInCents)}</p>
                    )}
                    <p className="text-xs text-stone-500">{formatMovementDate(movement.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-stone-100 p-4 text-stone-400"><PackagePlus className="size-7" /></span>
              <p className="mt-4 text-sm font-semibold text-stone-700">Nenhuma movimentação ainda</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-stone-600">Os lançamentos aparecerão aqui após o primeiro registro.</p>
            </div>
          )}
        </article>
      </section>}
    </div>
  );
}
