export type ProductUnit = "unit" | "gram" | "milliliter";

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: ProductUnit;
  currentStock: number;
  minimumStock: number;
  purchasePriceInCents: number;
  salePriceInCents: number;
  barcode: string | null;
  active: boolean;
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
