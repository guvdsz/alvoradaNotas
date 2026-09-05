import type {
  StockMovement,
  StockMovementType,
} from "@/features/movements/types/movement";
import { calculateResultingStock } from "@/features/movements/utils/stock-math";
import { readProductUnit } from "@/features/products/services/product.mapper";
import type { ProductUnit } from "@/features/products/types/product";
import { firestoreDateToIso } from "@/lib/firebase/data-service";
import { hasAtMostDecimalPlaces } from "@/lib/utils/number";

export function mapMovement(
  id: string,
  data: Record<string, unknown>,
): StockMovement {
  const productUnit = readProductUnit(data.productUnit);
  const type = readMovementType(data.type);
  const quantityInBaseUnit = readStockValue(
    data.quantityInBaseUnit,
    productUnit,
    false,
  );
  const previousStock = readStockValue(data.previousStock, productUnit, true);
  const resultingStock = readStockValue(data.resultingStock, productUnit, true);

  if (
    calculateResultingStock(
      previousStock,
      quantityInBaseUnit,
      type,
      productUnit,
    ) !== resultingStock
  ) {
    throw new TypeError("Movimentação com saldo resultante inconsistente.");
  }

  return {
    id,
    productId: readRequiredText(data.productId, "produto"),
    productName: readRequiredText(data.productName, "nome do produto"),
    productUnit,
    type,
    quantityInBaseUnit,
    saleValueInCents: readSaleValue(data.saleValueInCents, type),
    previousStock,
    resultingStock,
    reason: readRequiredText(data.reason, "motivo"),
    createdAt: firestoreDateToIso(data.createdAt),
    createdBy: readRequiredText(data.createdBy, "responsável"),
  };
}

function readMovementType(value: unknown): StockMovementType {
  if (value === "entry" || value === "exit") return value;
  throw new TypeError("Tipo de movimentação inválido.");
}

function readRequiredText(value: unknown, field: string) {
  if (typeof value === "string" && value.trim()) return value;
  throw new TypeError(`Movimentação com ${field} inválido.`);
}

function readStockValue(
  value: unknown,
  unit: ProductUnit,
  allowZero: boolean,
) {
  const number = typeof value === "number" ? value : Number.NaN;
  if (
    Number.isFinite(number) &&
    (allowZero ? number >= 0 : number > 0) &&
    number <= 1_000_000_000 &&
    (unit === "kilogram"
      ? hasAtMostDecimalPlaces(number, 3)
      : Number.isInteger(number))
  ) {
    return number;
  }

  throw new TypeError("Movimentação com quantidade inválida.");
}

function readSaleValue(value: unknown, type: StockMovementType) {
  if (type === "entry" && (value === null || value === undefined)) return null;
  if (
    type === "exit" &&
    Number.isSafeInteger(value) &&
    Number(value) > 0 &&
    Number(value) <= 1_000_000_000
  ) {
    return Number(value);
  }

  throw new TypeError("Movimentação com valor de venda inválido.");
}
