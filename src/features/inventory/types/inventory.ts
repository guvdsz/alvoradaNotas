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
};

export type StockMovementType =
  | "entry"
  | "exit"
  | "adjustment"
  | "reversal";

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantityInBaseUnit: number;
  reason: string;
  createdAt: string;
  createdBy: string;
};
