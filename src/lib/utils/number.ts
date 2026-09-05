export function hasAtMostDecimalPlaces(
  value: number,
  decimalPlaces: number,
) {
  if (!Number.isFinite(value)) return false;

  const precision = 10 ** decimalPlaces;
  const scaledValue = value * precision;
  const tolerance =
    Number.EPSILON * Math.max(1, Math.abs(scaledValue)) * 4;

  return Math.abs(scaledValue - Math.round(scaledValue)) <= tolerance;
}
