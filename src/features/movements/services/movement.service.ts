"use client";

import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import {
  stockMovementSchema,
  type StockMovementSchema,
} from "@/features/movements/schemas/movement.schema";
import { mapMovement } from "@/features/movements/services/movement.mapper";
import type { StockMovement } from "@/features/movements/types/movement";
import {
  calculateResultingStock,
  hasValidStockPrecision,
  normalizeStockQuantity,
} from "@/features/movements/utils/stock-math";
import { readProductUnit } from "@/features/products/services/product.mapper";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  DataServiceError,
  handleDataServiceError,
} from "@/lib/firebase/data-service";

export { DataServiceError as MovementServiceError };

const maximumStock = 1_000_000_000;

export type RegisterStockMovementResult = {
  movement: StockMovement;
  resultingStock: number;
  wasCreated: boolean;
};

export async function registerStockMovement(
  input: StockMovementSchema,
  userId: string,
): Promise<RegisterStockMovementResult> {
  try {
    const parsedInput = parseMovementInput(input);
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new DataServiceError("Sua sessão expirou. Entre novamente.");
    }

    const database = getFirebaseDb();
    const productReference = doc(database, "products", parsedInput.productId);
    const movementReference = doc(
      database,
      "stockMovements",
      parsedInput.idempotencyKey,
    );
    const localCreatedAt = new Date().toISOString();

    return await runTransaction(database, async (transaction) => {
      const existingMovement = await transaction.get(movementReference);

      if (existingMovement.exists()) {
        const movement = mapMovement(
          existingMovement.id,
          existingMovement.data(),
        );
        if (!isSameMovementAttempt(movement, parsedInput, normalizedUserId)) {
          throw new DataServiceError(
            "Esta tentativa de movimentação conflita com um lançamento já registrado.",
          );
        }

        const currentProduct = await transaction.get(productReference);
        if (!currentProduct.exists()) {
          throw new DataServiceError("Produto não encontrado.");
        }
        const currentUnit = readProductUnit(currentProduct.data().unit);
        const currentStock = readStoredStock(
          currentProduct.data().currentStock,
          currentUnit,
        );

        return {
          movement,
          resultingStock: currentStock,
          wasCreated: false,
        };
      }

      const productSnapshot = await transaction.get(productReference);

      if (!productSnapshot.exists()) {
        throw new DataServiceError("Produto não encontrado.");
      }

      const product = productSnapshot.data();
      const productUnit = readProductUnit(product.unit);
      if (!hasValidStockPrecision(parsedInput.quantityInBaseUnit, productUnit)) {
        throw new DataServiceError(
          productUnit === "kilogram"
            ? "Use no máximo três casas decimais para quilogramas."
            : "Use uma quantidade inteira para a unidade deste produto.",
        );
      }

      const movementQuantity = normalizeStockQuantity(
        parsedInput.quantityInBaseUnit,
        productUnit,
      );
      const previousStock = normalizeStockQuantity(
        readStoredStock(product.currentStock, productUnit),
        productUnit,
      );
      const resultingStock = calculateResultingStock(
        previousStock,
        movementQuantity,
        parsedInput.type,
        productUnit,
      );

      if (resultingStock < 0) {
        throw new DataServiceError(
          "Estoque insuficiente para registrar esta saída.",
        );
      }
      if (resultingStock > maximumStock) {
        throw new DataServiceError(
          "A quantidade resultante ultrapassa o limite permitido.",
        );
      }

      transaction.update(productReference, {
        currentStock: resultingStock,
        updatedAt: serverTimestamp(),
      });
      transaction.set(movementReference, {
        idempotencyKey: parsedInput.idempotencyKey,
        productId: parsedInput.productId,
        productName: String(product.name ?? "Produto"),
        productUnit,
        type: parsedInput.type,
        quantityInBaseUnit: movementQuantity,
        saleValueInCents:
          parsedInput.type === "exit"
            ? Math.round(parsedInput.saleValue * 100)
            : null,
        previousStock,
        resultingStock,
        reason: parsedInput.reason,
        createdBy: normalizedUserId,
        createdAt: serverTimestamp(),
      });

      return {
        movement: {
          id: movementReference.id,
          productId: parsedInput.productId,
          productName: String(product.name ?? "Produto"),
          productUnit,
          type: parsedInput.type,
          quantityInBaseUnit: movementQuantity,
          saleValueInCents:
            parsedInput.type === "exit"
              ? Math.round(parsedInput.saleValue * 100)
              : null,
          previousStock,
          resultingStock,
          reason: parsedInput.reason,
          createdAt: localCreatedAt,
          createdBy: normalizedUserId,
        },
        resultingStock,
        wasCreated: true,
      };
    });
  } catch (error) {
    handleDataServiceError(
      "Movimentações",
      error,
      "Não foi possível registrar a movimentação.",
    );
  }
}

export async function listStockMovements(): Promise<StockMovement[]> {
  try {
    const database = getFirebaseDb();
    const movementsSnapshot = await getDocs(
      query(
        collection(database, "stockMovements"),
        orderBy("createdAt", "desc"),
        limit(100),
      ),
    );

    return movementsSnapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );
  } catch (error) {
    handleDataServiceError(
      "Movimentações",
      error,
      "Não foi possível carregar as movimentações.",
    );
  }
}

function parseMovementInput(input: StockMovementSchema) {
  const result = stockMovementSchema.safeParse(input);
  if (result.success) return result.data;

  throw new DataServiceError(
    result.error.issues[0]?.message ?? "Dados da movimentação inválidos.",
  );
}

function isSameMovementAttempt(
  movement: StockMovement,
  input: StockMovementSchema,
  userId: string,
) {
  return (
    hasValidStockPrecision(input.quantityInBaseUnit, movement.productUnit) &&
    movement.productId === input.productId &&
    movement.type === input.type &&
    movement.quantityInBaseUnit ===
      normalizeStockQuantity(input.quantityInBaseUnit, movement.productUnit) &&
    movement.saleValueInCents ===
      (input.type === "exit" ? Math.round(input.saleValue * 100) : null) &&
    movement.reason === input.reason &&
    movement.createdBy === userId
  );
}

function readStoredStock(
  value: unknown,
  unit: ReturnType<typeof readProductUnit>,
) {
  if (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maximumStock &&
    hasValidStockPrecision(value, unit)
  ) {
    return value;
  }

  throw new DataServiceError(
    "A quantidade atual deste produto é inválida. Corrija o cadastro antes de movimentá-lo.",
  );
}
