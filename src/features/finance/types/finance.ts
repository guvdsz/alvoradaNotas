import type { StockMovement } from "@/features/movements/types/movement";

export type FinanceDailyTotal = {
  date: string;
  salesValueInCents: number;
  salesCount: number;
};

export type FinanceProductTotal = {
  productId: string;
  productName: string;
  salesValueInCents: number;
  salesCount: number;
};

export type FinanceDashboardData = {
  summary: {
    salesTodayInCents: number;
    salesLast7DaysInCents: number;
    salesLast30DaysInCents: number;
    averageTicketLast30DaysInCents: number;
    salesCountLast30Days: number;
    largestSaleLast30DaysInCents: number;
    previous30DaysInCents: number;
    growthLast30DaysPercentage: number | null;
  };
  dailySalesLast7Days: FinanceDailyTotal[];
  topProductsLast30Days: FinanceProductTotal[];
  recentSales: StockMovement[];
};
