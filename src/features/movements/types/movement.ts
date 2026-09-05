import type { ProductUnit } from "@/features/products/types/product";

export type StockMovementType = "entry" | "exit";

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
