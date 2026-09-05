import type { StockMovementType } from "@/features/movements/types/movement";
import type { ProductUnit } from "@/features/products/types/product";
import { hasAtMostDecimalPlaces } from "@/lib/utils/number";

const precisionByUnit: Record<ProductUnit, number> = {
  unit: 1,
  gram: 1,
  kilogram: 1_000,
  milliliter: 1,
};

export function hasValidStockPrecision(value: number, unit: ProductUnit) {
  return unit === "kilogram"
    ? hasAtMostDecimalPlaces(value, 3)
    : Number.isInteger(value);
}

export function normalizeStockQuantity(value: number, unit: ProductUnit) {
  const precision = precisionByUnit[unit];
  return Math.round(value * precision) / precision;
}

export function calculateResultingStock(
  currentStock: number,
  movementQuantity: number,
  movementType: StockMovementType,
  unit: ProductUnit,
) {
  const precision = precisionByUnit[unit];
  const currentStockAsInteger = Math.round(currentStock * precision);
  const movementAsInteger = Math.round(movementQuantity * precision);
  const resultingStockAsInteger =
    movementType === "entry"
      ? currentStockAsInteger + movementAsInteger
      : currentStockAsInteger - movementAsInteger;

  return resultingStockAsInteger / precision;
}
