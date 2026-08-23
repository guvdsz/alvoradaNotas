import type { Product, ProductUnit } from "@/features/products/types/product";
import { firestoreDateToIso } from "@/lib/firebase/data-service";

export function readProductUnit(value: unknown): ProductUnit {
  return value === "gram" ||
    value === "kilogram" ||
    value === "milliliter" ||
    value === "unit"
    ? value
    : "unit";
}

export function mapProduct(
  id: string,
  data: Record<string, unknown>,
): Product {
  return {
    id,
    name: String(data.name ?? ""),
    categoryId: String(data.categoryId ?? ""),
    categoryName: String(data.categoryName ?? data.category ?? "Sem categoria"),
    unit: readProductUnit(data.unit),
    currentStock: Number(data.currentStock ?? 0),
    minimumStock: Number(data.minimumStock ?? 0),
    priceInCents: Number(data.priceInCents ?? 0),
    barcode: typeof data.barcode === "string" ? data.barcode : null,
    createdAt: firestoreDateToIso(data.createdAt),
  };
}
