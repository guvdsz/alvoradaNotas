import type { Product, ProductUnit } from "@/features/products/types/product";
import { firestoreDateToIso } from "@/lib/firebase/data-service";
import { hasAtMostDecimalPlaces } from "@/lib/utils/number";

export function readProductUnit(value: unknown): ProductUnit {
  if (
    value === "gram" ||
    value === "kilogram" ||
    value === "milliliter" ||
    value === "unit"
  ) {
    return value;
  }

  throw new TypeError("Unidade de produto inválida.");
}

export function mapProduct(
  id: string,
  data: Record<string, unknown>,
): Product {
  const unit = readProductUnit(data.unit);

  return {
    id,
    name: readRequiredText(data.name, "nome"),
    categoryId: readRequiredText(data.categoryId, "categoria"),
    categoryName: String(data.categoryName ?? data.category ?? "Sem categoria"),
    unit,
    currentStock: readStock(data.currentStock, unit, "quantidade atual"),
    minimumStock: readStock(data.minimumStock, unit, "quantidade mínima"),
    priceInCents: readMoneyInCents(data.priceInCents),
    barcode: typeof data.barcode === "string" ? data.barcode : null,
    createdAt: firestoreDateToIso(data.createdAt),
  };
}

function readRequiredText(value: unknown, field: string) {
  if (typeof value === "string" && value.trim()) return value;
  throw new TypeError(`Produto com ${field} inválido.`);
}

function readStock(value: unknown, unit: ProductUnit, field: string) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (
    Number.isFinite(number) &&
    number >= 0 &&
    number <= 1_000_000_000 &&
    (unit === "kilogram"
      ? hasAtMostDecimalPlaces(number, 3)
      : Number.isInteger(number))
  ) {
    return number;
  }

  throw new TypeError(`Produto com ${field} inválida.`);
}

function readMoneyInCents(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= 1_000_000_000
  ) {
    return value;
  }
  throw new TypeError("Produto com valor inválido.");
}
