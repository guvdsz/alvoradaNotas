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

import type { StockMovementSchema } from "@/features/movements/schemas/movement.schema";
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

export async function registerStockMovement(
  input: StockMovementSchema,
  userId: string,
) {
  const database = getFirebaseDb();
  const productReference = doc(database, "products", input.productId);
  const movementReference = doc(
    database,
    "stockMovements",
    input.idempotencyKey,
  );

  try {
    await runTransaction(database, async (transaction) => {
      const existingMovement = await transaction.get(movementReference);

      if (existingMovement.exists()) return;

      const productSnapshot = await transaction.get(productReference);

      if (!productSnapshot.exists()) {
        throw new DataServiceError("Produto não encontrado.");
      }

      const product = productSnapshot.data();
      const productUnit = readProductUnit(product.unit);
      if (!hasValidStockPrecision(input.quantityInBaseUnit, productUnit)) {
        throw new DataServiceError(
          productUnit === "kilogram"
            ? "Use no máximo três casas decimais para quilogramas."
            : "Use uma quantidade inteira para a unidade deste produto.",
        );
      }

      const movementQuantity = normalizeStockQuantity(
        input.quantityInBaseUnit,
        productUnit,
      );
      const previousStock = normalizeStockQuantity(
        Number(product.currentStock ?? 0),
        productUnit,
      );
      const resultingStock = calculateResultingStock(
        previousStock,
        movementQuantity,
        input.type,
        productUnit,
      );

      if (resultingStock < 0) {
        throw new DataServiceError(
          "Estoque insuficiente para registrar esta saída.",
        );
      }

      transaction.update(productReference, {
        currentStock: resultingStock,
        updatedAt: serverTimestamp(),
      });
      transaction.set(movementReference, {
        idempotencyKey: input.idempotencyKey,
        productId: input.productId,
        productName: String(product.name ?? "Produto"),
        productUnit,
        type: input.type,
        quantityInBaseUnit: movementQuantity,
        saleValueInCents:
          input.type === "exit" ? Math.round(input.saleValue * 100) : null,
        previousStock,
        resultingStock,
        reason: input.reason,
        createdBy: userId,
        createdAt: serverTimestamp(),
      });
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
    const [movementsSnapshot, productsSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(database, "stockMovements"),
          orderBy("createdAt", "desc"),
          limit(100),
        ),
      ),
      getDocs(collection(database, "products")),
    ]);
    const productUnits = new Map(
      productsSnapshot.docs.map((item) => [
        item.id,
        readProductUnit(item.data().unit),
      ]),
    );

    return movementsSnapshot.docs.map((item) => {
      const movement = mapMovement(item.id, item.data());
      return {
        ...movement,
        productUnit:
          productUnits.get(movement.productId) ?? movement.productUnit,
      };
    });
  } catch (error) {
    handleDataServiceError(
      "Movimentações",
      error,
      "Não foi possível carregar as movimentações.",
    );
  }
}
