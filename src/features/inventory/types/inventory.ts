export type ProductUnit = "unit" | "gram" | "kilogram" | "milliliter";

export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: ProductUnit;
  currentStock: number;
  minimumStock: number;
  priceInCents: number;
  barcode: string | null;
  createdAt: string;
};

export type StockMovementType =
  | "entry"
  | "exit"
  | "adjustment"
  | "reversal";

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  productUnit: ProductUnit;
  type: StockMovementType;
  quantityInBaseUnit: number;
  saleValueInCents: number | null;
  previousStock: number;
  resultingStock: number;
  reason: string;
  createdAt: string;
  createdBy: string;
};

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
