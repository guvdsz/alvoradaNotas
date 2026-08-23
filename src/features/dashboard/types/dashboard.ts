import type { StockMovement } from "@/features/movements/types/movement";

export type InventorySummaryData = {
  productsCount: number;
  entriesToday: number;
  exitsToday: number;
  lowStockCount: number;
};

export type InventoryDashboardData = {
  summary: InventorySummaryData;
  recentMovements: StockMovement[];
};
