"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowUpFromLine,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  ReceiptText,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

import { DataErrorState } from "@/components/ui/data-error-state";
import { FinanceSkeleton } from "@/features/finance/components/finance-skeleton";
import { getFinanceDashboard } from "@/features/finance/services/finance.service";
import type { FinanceDashboardData } from "@/features/finance/types/finance";
import type { StockMovement } from "@/features/movements/types/movement";
import { formatStock } from "@/features/products/utils/product-formatters";
import { formatCurrency } from "@/lib/utils/formatters";

export function FinanceContent() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    void getFinanceDashboard()
      .then((financeData) => {
        if (active) setData(financeData);
      })
      .catch((error) => {
        if (active) {
          setLoadError(
            "Verifique sua conexão e tente carregar os indicadores novamente.",
          );
        }
        console.error("[Financeiro] Não foi possível carregar os dados.", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retryLoading() {
    setLoadError(null);
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  if (loading) {
    return <FinanceSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Resultados</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            Financeiro
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Acompanhe o faturamento calculado a partir das saídas registradas
            como vendas.
          </p>
        </div>
        <Link
          href="/movements?type=exit"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
        >
          <ArrowUpFromLine className="size-4" />
          Registrar venda
        </Link>
      </section>

      {loadError ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
          <DataErrorState message={loadError} onRetry={retryLoading} />
        </section>
      ) : (
        data && <FinanceDashboard data={data} />
      )}
    </div>
  );
}

function FinanceDashboard({ data }: { data: FinanceDashboardData }) {
  const { summary } = data;
  const cards = [
    {
      label: "Vendas hoje",
      value: summary.salesTodayInCents,
      detail: "Faturamento registrado hoje",
      icon: CircleDollarSign,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Últimos 7 dias",
      value: summary.salesLast7DaysInCents,
      detail: "Hoje e os 6 dias anteriores",
      icon: CalendarDays,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Últimos 30 dias",
      value: summary.salesLast30DaysInCents,
      detail: "Faturamento do período atual",
      icon: ChartNoAxesCombined,
      tone: "bg-brand-50 text-brand-700",
    },
    {
      label: "Média por saída",
      value: summary.averageExitValueLast30DaysInCents,
      detail: "Valor médio por saída em 30 dias",
      icon: ReceiptText,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <>
      <section
        aria-label="Resumo financeiro"
        className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map((card) => (
          <FinanceMetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <DailySales data={data} />
        <PeriodIndicators data={data} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <TopProducts data={data} />
        <RecentSales sales={data.recentSales} />
      </section>

      <p className="mt-6 text-xs leading-5 text-stone-500">
        Os valores representam faturamento bruto das saídas com valor de venda.
        Custos e lucro não estão incluídos neste cálculo.
      </p>
    </>
  );
}

function FinanceMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-stone-300/80 bg-white p-5 shadow-[0_1px_2px_rgba(41,37,36,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 break-words text-xl font-bold tabular-nums tracking-tight text-stone-900 [overflow-wrap:anywhere] min-[360px]:text-2xl sm:text-3xl">
            {formatCurrency(value)}
          </p>
        </div>
        <span className={`shrink-0 rounded-xl p-2.5 ${tone}`}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 text-xs text-stone-500">{detail}</p>
    </article>
  );
}

function DailySales({ data }: { data: FinanceDashboardData }) {
  const highestValue = Math.max(
    ...data.dailySalesLast7Days.map((day) => day.salesValueInCents),
    1,
  );

  return (
    <article className="rounded-2xl border border-stone-300/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-bold text-stone-900">Vendas por dia</h2>
      <p className="mt-1 text-sm text-stone-500">
        Evolução do faturamento nos últimos 7 dias.
      </p>
      <div className="mt-6 space-y-4">
        {data.dailySalesLast7Days.map((day) => {
          const width = (day.salesValueInCents / highestValue) * 100;
          return (
            <div key={day.date} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[6rem_minmax(0,1fr)_7rem]">
              <p className="text-xs font-semibold capitalize text-stone-600">
                {formatShortDate(day.date)}
              </p>
              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width]"
                  style={{ width: `${width}%` }}
                />
              </div>
              <div className="col-start-2 flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 text-xs sm:col-start-auto sm:block sm:text-right">
                <span className="font-bold tabular-nums text-stone-800">
                  {formatCurrency(day.salesValueInCents)}
                </span>
                <span className="text-xs text-stone-500 sm:block">
                  {day.salesCount} venda{day.salesCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function PeriodIndicators({ data }: { data: FinanceDashboardData }) {
  const { summary } = data;
  const growth = summary.growthLast30DaysPercentage;
  const positiveGrowth = growth !== null && growth >= 0;

  return (
    <article className="rounded-2xl border border-stone-300/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-bold text-stone-900">Indicadores de 30 dias</h2>
      <p className="mt-1 text-sm text-stone-500">
        Leitura rápida do período atual.
      </p>
      <div className="mt-6 divide-y divide-stone-100">
        <IndicatorRow
          icon={ShoppingBag}
          label="Saídas registradas"
          value={summary.exitsCountLast30Days.toLocaleString("pt-BR")}
        />
        <IndicatorRow
          icon={Trophy}
          label="Maior saída"
          value={formatCurrency(summary.largestExitLast30DaysInCents)}
        />
        <div className="flex items-center gap-3 py-4">
          <span className={`rounded-xl p-2.5 ${growth === null ? "bg-stone-100 text-stone-500" : positiveGrowth ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {growth === null ? (
              <ChartNoAxesCombined className="size-4" />
            ) : positiveGrowth ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-stone-500">Comparação com 30 dias anteriores</p>
            <p className="mt-0.5 font-bold text-stone-900">
              {growth === null
                ? "Sem base para comparação"
                : `${formatPercentage(Math.abs(growth))} ${positiveGrowth ? "acima" : "abaixo"}`}
            </p>
          </div>
        </div>
        <div className="pt-4 text-xs text-stone-500">
          Período anterior: {formatCurrency(summary.previous30DaysInCents)}
        </div>
      </div>
    </article>
  );
}

function IndicatorRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-0">
      <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="mt-0.5 break-words font-bold text-stone-900">{value}</p>
      </div>
    </div>
  );
}

function TopProducts({ data }: { data: FinanceDashboardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-300/80 bg-white shadow-sm">
      <div className="border-b border-stone-100 p-5 sm:p-6">
        <h2 className="font-bold text-stone-900">Produtos em destaque</h2>
        <p className="mt-1 text-sm text-stone-500">
          Maior faturamento nos últimos 30 dias.
        </p>
      </div>
      {data.topProductsLast30Days.length ? (
        <div className="divide-y divide-stone-100">
          {data.topProductsLast30Days.map((product, index) => {
            const share = data.summary.salesLast30DaysInCents
              ? (product.salesValueInCents /
                  data.summary.salesLast30DaysInCents) *
                100
              : 0;
            return (
              <div key={product.productId} className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {product.productName}
                    </p>
                    <p className="text-xs text-stone-500">
                      {product.salesCount} venda{product.salesCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="max-w-[45%] shrink-0 break-words text-right text-sm font-bold tabular-nums text-stone-900 [overflow-wrap:anywhere]">
                    {formatCurrency(product.salesValueInCents)}
                  </p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <FinanceEmptyState text="Ainda não há vendas com valor neste período." />
      )}
    </article>
  );
}

function RecentSales({ sales }: { sales: StockMovement[] }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-300/80 bg-white shadow-sm">
      <div className="border-b border-stone-100 p-5 sm:p-6">
        <h2 className="font-bold text-stone-900">Vendas recentes</h2>
        <p className="mt-1 text-sm text-stone-500">
          Últimas saídas com valor informado.
        </p>
      </div>
      {sales.length ? (
        <div className="divide-y divide-stone-100">
          {sales.map((sale) => (
            <div key={sale.id} className="flex items-center gap-3 p-4 sm:p-5">
              <span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                <CircleDollarSign className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {sale.productName}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {formatStock(sale.quantityInBaseUnit, sale.productUnit)} · {formatSaleDate(sale.createdAt)}
                </p>
              </div>
              <p className="max-w-[42%] shrink-0 break-words text-right text-sm font-bold tabular-nums text-stone-900 [overflow-wrap:anywhere]">
                {formatCurrency(sale.saleValueInCents ?? 0)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <FinanceEmptyState text="As vendas com valor aparecerão aqui." />
      )}
    </article>
  );
}

function FinanceEmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
        <CircleDollarSign className="size-7" />
      </span>
      <p className="mt-4 text-sm font-semibold text-stone-700">Sem dados financeiros</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">{text}</p>
    </div>
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatSaleDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}
