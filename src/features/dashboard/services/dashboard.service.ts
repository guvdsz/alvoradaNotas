"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

import type { InventoryDashboardData } from "@/features/dashboard/types/dashboard";
import { mapMovement } from "@/features/movements/services/movement.mapper";
import { mapProduct } from "@/features/products/services/product.mapper";
import { getFirebaseDb } from "@/lib/firebase/client";
import { handleDataServiceError } from "@/lib/firebase/data-service";

export async function getInventoryDashboard(): Promise<InventoryDashboardData> {
  try {
    const database = getFirebaseDb();
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const [productsSnapshot, recentMovementsSnapshot, todayMovementsSnapshot] =
      await Promise.all([
        getDocs(query(collection(database, "products"), orderBy("name"))),
        getDocs(
          query(
            collection(database, "stockMovements"),
            orderBy("createdAt", "desc"),
            limit(6),
          ),
        ),
        getDocs(
          query(
            collection(database, "stockMovements"),
            where("createdAt", ">=", Timestamp.fromDate(todayStart)),
          ),
        ),
      ]);

    const products = productsSnapshot.docs.map((item) =>
      mapProduct(item.id, item.data()),
    );
    const recentMovements = recentMovementsSnapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );
    const todayMovements = todayMovementsSnapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );

    return {
      summary: {
        productsCount: products.length,
        lowStockCount: products.filter(
          (product) => product.currentStock <= product.minimumStock,
        ).length,
        entriesToday: todayMovements.filter(
          (movement) => movement.type === "entry",
        ).length,
        exitsToday: todayMovements.filter(
          (movement) => movement.type === "exit",
        ).length,
      },
      recentMovements,
    };
  } catch (error) {
    handleDataServiceError(
      "Dashboard",
      error,
      "Não foi possível carregar o painel de estoque.",
    );
  }
}
