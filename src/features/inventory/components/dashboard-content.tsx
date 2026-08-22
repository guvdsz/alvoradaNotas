"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, DatabaseZap, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { InventorySummary } from "@/features/inventory/components/inventory-summary";
import { getInventoryDashboard, InventoryServiceError } from "@/features/inventory/services/inventory.service";
import type { InventoryDashboardData } from "@/features/inventory/types/inventory";

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<InventoryDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getInventoryDashboard()
      .then((dashboard) => { if (active) setData(dashboard); })
      .catch((reason) => { if (active) setError(reason instanceof InventoryServiceError ? reason.message : "Não foi possível carregar o painel."); });
    return () => { active = false; };
  }, []);

  const firstName = user?.email?.split("@")[0];

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">Olá{firstName ? `, ${firstName}` : ""}!</h1>
          <p className="mt-2 text-sm text-stone-500">Acompanhe o movimento e a situação do estoque do empório.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" iconLeft={<ArrowDownToLine className="size-4" />} disabled>Nova entrada</Button>
          <Button iconLeft={<ArrowUpFromLine className="size-4" />} disabled>Registrar saída</Button>
        </div>
      </section>

      {error && (
        <div role="alert" className="mt-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <DatabaseZap className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-semibold">Firestore não está acessível</p><p className="mt-1 text-xs leading-5">{error}</p></div>
        </div>
      )}

      <div className="mt-8"><InventorySummary data={data?.summary} loading={!data && !error} /></div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
          <h2 className="font-bold text-stone-900">Movimentações recentes</h2>
          <p className="mt-1 text-sm text-stone-500">Últimas entradas e saídas registradas.</p>
          {data?.recentMovements.length ? (
            <div className="mt-5 divide-y divide-stone-100">
              {data.recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center gap-3 py-3">
                  <span className={movement.type === "entry" ? "rounded-xl bg-emerald-50 p-2 text-emerald-700" : "rounded-xl bg-orange-50 p-2 text-orange-700"}>{movement.type === "entry" ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-stone-800">{movement.productName}</p><p className="truncate text-xs text-stone-400">{movement.reason}</p></div>
                  <div className="text-right"><p className="text-sm font-bold text-stone-800">{movement.type === "entry" ? "+" : "−"}{movement.quantityInBaseUnit}</p><p className="text-[11px] text-stone-400">{formatMovementDate(movement.createdAt)}</p></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-stone-100 p-4 text-stone-400"><PackagePlus className="size-7" /></span>
              <p className="mt-4 text-sm font-semibold text-stone-700">Nenhuma movimentação ainda</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-stone-400">Os lançamentos do Cloud Firestore aparecerão aqui.</p>
            </div>
          )}
        </article>
        <article className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-cream-100 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Infraestrutura</p>
          <h2 className="mt-3 text-xl font-bold text-stone-900">Firebase conectado</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">A aplicação usa Firebase Authentication e Cloud Firestore. Entradas e saídas serão processadas em transações atômicas.</p>
          <div className="mt-6 rounded-xl border border-white/80 bg-white/70 p-4 text-xs leading-5 text-stone-600">Publique o arquivo <code>firestore.rules</code> antes de usar dados reais.</div>
        </article>
      </section>
    </div>
  );
}
