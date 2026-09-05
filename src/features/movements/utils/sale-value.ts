export function calculateSuggestedSaleValue(
  unitPriceInCents: number,
  quantityInControlUnit?: number | null,
) {
  if (!Number.isFinite(unitPriceInCents) || unitPriceInCents <= 0) return 0;

  const quantity =
    typeof quantityInControlUnit === "number" &&
    Number.isFinite(quantityInControlUnit) &&
    quantityInControlUnit > 0
      ? quantityInControlUnit
      : 1;

  return Math.round(unitPriceInCents * quantity) / 100;
}
