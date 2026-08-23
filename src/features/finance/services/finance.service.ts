"use client";

import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import type { FinanceDashboardData } from "@/features/finance/types/finance";
import { mapMovement } from "@/features/movements/services/movement.mapper";
import type { StockMovement } from "@/features/movements/types/movement";
import { getFirebaseDb } from "@/lib/firebase/client";
import { handleDataServiceError } from "@/lib/firebase/data-service";

export async function getFinanceDashboard(): Promise<FinanceDashboardData> {
  try {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const sevenDaysStart = addLocalDays(todayStart, -6);
    const thirtyDaysStart = addLocalDays(todayStart, -29);
    const sixtyDaysStart = addLocalDays(todayStart, -59);
    const snapshot = await getDocs(
      query(
        collection(getFirebaseDb(), "stockMovements"),
        where("createdAt", ">=", Timestamp.fromDate(sixtyDaysStart)),
        orderBy("createdAt", "desc"),
      ),
    );
    const movements = snapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );
    const exits = movements.filter((movement) => movement.type === "exit");
    const pricedSales = exits.filter(
      (movement) => movement.saleValueInCents !== null,
    );
    const salesLast30Days = pricedSales.filter(
      (sale) => new Date(sale.createdAt) >= thirtyDaysStart,
    );
    const salesPrevious30Days = pricedSales.filter((sale) => {
      const createdAt = new Date(sale.createdAt);
      return createdAt >= sixtyDaysStart && createdAt < thirtyDaysStart;
    });
    const salesLast30DaysInCents = sumSales(salesLast30Days);
    const previous30DaysInCents = sumSales(salesPrevious30Days);
    const productTotals = new Map<
      string,
      FinanceDashboardData["topProductsLast30Days"][number]
    >();

    for (const sale of salesLast30Days) {
      const current = productTotals.get(sale.productId);
      productTotals.set(sale.productId, {
        productId: sale.productId,
        productName: sale.productName,
        salesValueInCents:
          (current?.salesValueInCents ?? 0) + (sale.saleValueInCents ?? 0),
        salesCount: (current?.salesCount ?? 0) + 1,
      });
    }

    const dailySalesLast7Days = Array.from({ length: 7 }, (_, index) => {
      const dayStart = addLocalDays(sevenDaysStart, index);
      const nextDayStart = addLocalDays(dayStart, 1);
      const sales = pricedSales.filter((sale) => {
        const createdAt = new Date(sale.createdAt);
        return createdAt >= dayStart && createdAt < nextDayStart;
      });

      return {
        date: dayStart.toISOString(),
        salesValueInCents: sumSales(sales),
        salesCount: sales.length,
      };
    });

    return {
      summary: {
        salesTodayInCents: sumSales(
          pricedSales.filter(
            (sale) => new Date(sale.createdAt) >= todayStart,
          ),
        ),
        salesLast7DaysInCents: sumSales(
          pricedSales.filter(
            (sale) => new Date(sale.createdAt) >= sevenDaysStart,
          ),
        ),
        salesLast30DaysInCents,
        averageTicketLast30DaysInCents: salesLast30Days.length
          ? Math.round(salesLast30DaysInCents / salesLast30Days.length)
          : 0,
        salesCountLast30Days: salesLast30Days.length,
        largestSaleLast30DaysInCents: salesLast30Days.length
          ? Math.max(
              ...salesLast30Days.map((sale) => sale.saleValueInCents ?? 0),
            )
          : 0,
        previous30DaysInCents,
        growthLast30DaysPercentage: previous30DaysInCents
          ? ((salesLast30DaysInCents - previous30DaysInCents) /
              previous30DaysInCents) *
            100
          : null,
      },
      dailySalesLast7Days,
      topProductsLast30Days: [...productTotals.values()]
        .sort((a, b) => b.salesValueInCents - a.salesValueInCents)
        .slice(0, 5),
      recentSales: pricedSales.slice(0, 8),
    };
  } catch (error) {
    handleDataServiceError(
      "Financeiro",
      error,
      "Não foi possível carregar os dados financeiros.",
    );
  }
}

function sumSales(sales: StockMovement[]) {
  return sales.reduce(
    (total, sale) => total + (sale.saleValueInCents ?? 0),
    0,
  );
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}
