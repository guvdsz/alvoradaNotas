"use client";

import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import type {
  ProductSchema,
  StockMovementSchema,
} from "@/features/inventory/schemas/inventory.schema";
import type {
  InventoryDashboardData,
  Product,
  ProductUnit,
  StockMovement,
  StockMovementType,
} from "@/features/inventory/types/inventory";
import { getFirebaseDb } from "@/lib/firebase/client";

export class InventoryServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InventoryServiceError";
  }
}

function inventoryError(error: unknown, fallback: string): never {
  if (error instanceof InventoryServiceError) {
    throw error;
  }

  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      throw new InventoryServiceError(
        "Acesso negado. Publique as regras do Firestore e tente novamente.",
      );
    }

    if (error.code === "unavailable") {
      throw new InventoryServiceError(
        "O Firestore está indisponível. Verifique sua conexão.",
      );
    }
  }

  throw new InventoryServiceError(fallback);
}

function dateToIso(value: unknown) {
  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : new Date().toISOString();
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: String(data.name ?? ""),
    category: String(data.category ?? ""),
    unit: data.unit as ProductUnit,
    currentStock: Number(data.currentStock ?? 0),
    minimumStock: Number(data.minimumStock ?? 0),
    purchasePriceInCents: Number(data.purchasePriceInCents ?? 0),
    salePriceInCents: Number(data.salePriceInCents ?? 0),
    barcode: typeof data.barcode === "string" ? data.barcode : null,
    active: data.active !== false,
    createdAt: dateToIso(data.createdAt),
  };
}

function mapMovement(
  id: string,
  data: Record<string, unknown>,
): StockMovement {
  return {
    id,
    productId: String(data.productId ?? ""),
    productName: String(data.productName ?? "Produto"),
    productUnit: data.productUnit as ProductUnit,
    type: data.type as StockMovementType,
    quantityInBaseUnit: Number(data.quantityInBaseUnit ?? 0),
    previousStock: Number(data.previousStock ?? 0),
    resultingStock: Number(data.resultingStock ?? 0),
    reason: String(data.reason ?? ""),
    createdAt: dateToIso(data.createdAt),
    createdBy: String(data.createdBy ?? ""),
  };
}

export async function listProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(
      query(collection(getFirebaseDb(), "products"), orderBy("name")),
    );

    return snapshot.docs
      .map((item) => mapProduct(item.id, item.data()))
      .filter((product) => product.active);
  } catch (error) {
    inventoryError(error, "Não foi possível carregar os produtos.");
  }
}

export async function createProduct(input: ProductSchema, userId: string) {
  try {
    await addDoc(collection(getFirebaseDb(), "products"), {
      name: input.name,
      category: input.category,
      unit: input.unit,
      currentStock: 0,
      minimumStock: input.minimumStock,
      purchasePriceInCents: Math.round(input.purchasePrice * 100),
      salePriceInCents: Math.round(input.salePrice * 100),
      barcode: input.barcode || null,
      active: true,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    inventoryError(error, "Não foi possível cadastrar o produto.");
  }
}

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

      if (existingMovement.exists()) {
        return;
      }

      const productSnapshot = await transaction.get(productReference);

      if (!productSnapshot.exists() || productSnapshot.data().active === false) {
        throw new InventoryServiceError("Produto não encontrado ou inativo.");
      }

      const product = productSnapshot.data();
      const previousStock = Number(product.currentStock ?? 0);
      const resultingStock =
        input.type === "entry"
          ? previousStock + input.quantityInBaseUnit
          : previousStock - input.quantityInBaseUnit;

      if (resultingStock < 0) {
        throw new InventoryServiceError(
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
        productUnit: product.unit,
        type: input.type,
        quantityInBaseUnit: input.quantityInBaseUnit,
        previousStock,
        resultingStock,
        reason: input.reason,
        createdBy: userId,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    inventoryError(error, "Não foi possível registrar a movimentação.");
  }
}

export async function getInventoryDashboard(): Promise<InventoryDashboardData> {
  try {
    const database = getFirebaseDb();
    const [productsSnapshot, movementsSnapshot] = await Promise.all([
      getDocs(query(collection(database, "products"), orderBy("name"))),
      getDocs(
        query(
          collection(database, "stockMovements"),
          orderBy("createdAt", "desc"),
          limit(50),
        ),
      ),
    ]);

    const products = productsSnapshot.docs
      .map((item) => mapProduct(item.id, item.data()))
      .filter((product) => product.active);
    const movements = movementsSnapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );
    const today = new Date();

    return {
      summary: {
        productsCount: products.length,
        lowStockCount: products.filter(
          (product) => product.currentStock <= product.minimumStock,
        ).length,
        entriesToday: movements.filter(
          (movement) =>
            movement.type === "entry" && isSameLocalDay(movement.createdAt, today),
        ).length,
        exitsToday: movements.filter(
          (movement) =>
            movement.type === "exit" && isSameLocalDay(movement.createdAt, today),
        ).length,
      },
      recentMovements: movements.slice(0, 6),
    };
  } catch (error) {
    inventoryError(error, "Não foi possível carregar o painel de estoque.");
  }
}

function isSameLocalDay(isoDate: string, reference: Date) {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}
