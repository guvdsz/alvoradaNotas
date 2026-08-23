"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import type { InventoryDashboardData } from "@/features/dashboard/types/dashboard";
import { mapMovement } from "@/features/movements/services/movement.mapper";
import { mapProduct } from "@/features/products/services/product.mapper";
import { getFirebaseDb } from "@/lib/firebase/client";
import { handleDataServiceError } from "@/lib/firebase/data-service";

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

    const products = productsSnapshot.docs.map((item) =>
      mapProduct(item.id, item.data()),
    );
    const productUnits = new Map(
      products.map((product) => [product.id, product.unit]),
    );
    const movements = movementsSnapshot.docs.map((item) => {
      const movement = mapMovement(item.id, item.data());
      return {
        ...movement,
        productUnit:
          productUnits.get(movement.productId) ?? movement.productUnit,
      };
    });
    const today = new Date();

    return {
      summary: {
        productsCount: products.length,
        lowStockCount: products.filter(
          (product) => product.currentStock <= product.minimumStock,
        ).length,
        entriesToday: movements.filter(
          (movement) =>
            movement.type === "entry" &&
            isSameLocalDay(movement.createdAt, today),
        ).length,
        exitsToday: movements.filter(
          (movement) =>
            movement.type === "exit" &&
            isSameLocalDay(movement.createdAt, today),
        ).length,
      },
      recentMovements: movements.slice(0, 6),
    };
  } catch (error) {
    handleDataServiceError(
      "Dashboard",
      error,
      "Não foi possível carregar o painel de estoque.",
    );
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
