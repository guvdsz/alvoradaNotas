import type {
  ProductUnit,
  StockMovementType,
} from "@/features/inventory/types/inventory";

const precisionByUnit: Record<ProductUnit, number> = {
  unit: 1,
  gram: 1,
  kilogram: 1_000,
  milliliter: 1,
};

export function hasValidStockPrecision(value: number, unit: ProductUnit) {
  const precision = precisionByUnit[unit];
  const scaledValue = value * precision;

  return (
    Number.isFinite(value) &&
    Math.abs(scaledValue - Math.round(scaledValue)) < 1e-9
  );
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
