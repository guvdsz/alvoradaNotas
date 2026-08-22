import type { Metadata } from "next";
import { ArrowDownToLine, ArrowUpFromLine, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { InventorySummary } from "@/features/inventory/components/inventory-summary";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Visão geral",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.split(" ")[0]
      : user.email?.split("@")[0];

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Visão geral</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            Olá{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Acompanhe o movimento e a situação do estoque do empório.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            iconLeft={<ArrowDownToLine className="size-4" />}
            disabled
          >
            Nova entrada
          </Button>
          <Button
            iconLeft={<ArrowUpFromLine className="size-4" />}
            disabled
          >
            Registrar saída
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <InventorySummary />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
          <div>
            <h2 className="font-bold text-stone-900">Movimentações recentes</h2>
            <p className="mt-1 text-sm text-stone-500">
              Últimas entradas, saídas e ajustes.
            </p>
          </div>

          <div className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
              <PackagePlus className="size-7" />
            </span>
            <p className="mt-4 text-sm font-semibold text-stone-700">
              Nenhuma movimentação ainda
            </p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-stone-400">
              Quando o schema de estoque for aplicado, os lançamentos aparecerão
              aqui.
            </p>
          </div>
        </article>

        <article className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-cream-100 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            Próximo passo
          </p>
          <h2 className="mt-3 text-xl font-bold text-stone-900">
            Preparar o banco de estoque
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            A autenticação e a estrutura da aplicação estão prontas. Agora falta
            criar as tabelas, políticas RLS e a função transacional de
            movimentação no Supabase.
          </p>
          <div className="mt-6 rounded-xl border border-white/80 bg-white/70 p-4 text-xs leading-5 text-stone-600">
            Valores serão armazenados em centavos e quantidades por peso em
            gramas, evitando erros de arredondamento.
          </div>
        </article>
      </section>
    </div>
  );
}
