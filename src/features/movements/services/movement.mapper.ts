import type {
  StockMovement,
  StockMovementType,
} from "@/features/movements/types/movement";
import { readProductUnit } from "@/features/products/services/product.mapper";
import { firestoreDateToIso } from "@/lib/firebase/data-service";

export function mapMovement(
  id: string,
  data: Record<string, unknown>,
): StockMovement {
  return {
    id,
    productId: String(data.productId ?? ""),
    productName: String(data.productName ?? "Produto"),
    productUnit: readProductUnit(data.productUnit),
    type: data.type as StockMovementType,
    quantityInBaseUnit: Number(data.quantityInBaseUnit ?? 0),
    saleValueInCents:
      typeof data.saleValueInCents === "number"
        ? data.saleValueInCents
        : null,
    previousStock: Number(data.previousStock ?? 0),
    resultingStock: Number(data.resultingStock ?? 0),
    reason: String(data.reason ?? ""),
    createdAt: firestoreDateToIso(data.createdAt),
    createdBy: String(data.createdBy ?? ""),
  };
}
