"use client";

import { FirebaseError } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type {
  CategorySchema,
  ProductSchema,
  StockMovementSchema,
} from "@/features/inventory/schemas/inventory.schema";
import type {
  Category,
  FinanceDashboardData,
  InventoryDashboardData,
  Product,
  ProductUnit,
  StockMovement,
  StockMovementType,
} from "@/features/inventory/types/inventory";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  calculateResultingStock,
  hasValidStockPrecision,
  normalizeStockQuantity,
} from "@/features/inventory/utils/stock-math";

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

  console.error(
    error instanceof FirebaseError
      ? `[Inventory] Falha no serviço de dados (${error.code}).`
      : "[Inventory] Falha inesperada no serviço de dados.",
    error,
  );

  throw new InventoryServiceError(fallback);
}

function dateToIso(value: unknown) {
  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : new Date().toISOString();
}

function readProductUnit(value: unknown): ProductUnit {
  return value === "gram" ||
    value === "kilogram" ||
    value === "milliliter" ||
    value === "unit"
    ? value
    : "unit";
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
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
    createdAt: dateToIso(data.createdAt),
    createdBy: String(data.createdBy ?? ""),
  };
}

function mapCategory(id: string, data: Record<string, unknown>): Category {
  return {
    id,
    name: String(data.name ?? ""),
    createdAt: dateToIso(data.createdAt),
  };
}

export async function listProducts(): Promise<Product[]> {
  try {
    const database = getFirebaseDb();
    const [productsSnapshot, categoriesSnapshot] = await Promise.all([
      getDocs(query(collection(database, "products"), orderBy("name"))),
      getDocs(query(collection(database, "categories"), orderBy("name"))),
    ]);
    const categoryNames = new Map(
      categoriesSnapshot.docs.map((item) => [item.id, String(item.data().name)]),
    );

    return productsSnapshot.docs.map((item) => {
      const product = mapProduct(item.id, item.data());
      return {
        ...product,
        categoryName:
          categoryNames.get(product.categoryId) ?? product.categoryName,
      };
    });
  } catch (error) {
    inventoryError(error, "Não foi possível carregar os produtos.");
  }
}

export async function createProduct(input: ProductSchema, userId: string) {
  try {
    await ensureBarcodeIsAvailable(input.barcode);

    await addDoc(collection(getFirebaseDb(), "products"), {
      name: input.name,
      categoryId: input.categoryId,
      unit: input.unit,
      currentStock: 0,
      minimumStock: input.minimumStock,
      priceInCents: Math.round(input.price * 100),
      barcode: input.barcode || null,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    inventoryError(error, "Não foi possível cadastrar o produto.");
  }
}

export async function getProduct(productId: string): Promise<Product> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), "products", productId));

    if (!snapshot.exists()) {
      throw new InventoryServiceError("Produto não encontrado.");
    }

    const product = mapProduct(snapshot.id, snapshot.data());
    if (!product.categoryId) return product;

    const categorySnapshot = await getDoc(
      doc(getFirebaseDb(), "categories", product.categoryId),
    );
    return {
      ...product,
      categoryName: categorySnapshot.exists()
        ? String(categorySnapshot.data().name)
        : "Categoria removida",
    };
  } catch (error) {
    inventoryError(error, "Não foi possível carregar o produto.");
  }
}

export async function updateProduct(productId: string, input: ProductSchema) {
  try {
    await ensureBarcodeIsAvailable(input.barcode, productId);
    await updateDoc(doc(getFirebaseDb(), "products", productId), {
      name: input.name,
      categoryId: input.categoryId,
      unit: input.unit,
      minimumStock: input.minimumStock,
      priceInCents: Math.round(input.price * 100),
      barcode: input.barcode || null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    inventoryError(error, "Não foi possível atualizar o produto.");
  }
}

export async function deleteProduct(productId: string) {
  try {
    await deleteDoc(doc(getFirebaseDb(), "products", productId));
  } catch (error) {
    inventoryError(error, "Não foi possível excluir o produto.");
  }
}

async function ensureBarcodeIsAvailable(
  barcode?: string,
  ignoredProductId?: string,
) {
  if (!barcode) return;

  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), "products"),
      where("barcode", "==", barcode),
      limit(2),
    ),
  );
  const duplicated = snapshot.docs.some((item) => item.id !== ignoredProductId);

  if (duplicated) {
    throw new InventoryServiceError(
      "Já existe um produto com esse código de barras.",
    );
  }
}

export async function listCategories(): Promise<Category[]> {
  try {
    const snapshot = await getDocs(
      query(collection(getFirebaseDb(), "categories"), orderBy("name")),
    );
    return snapshot.docs.map((item) => mapCategory(item.id, item.data()));
  } catch (error) {
    inventoryError(error, "Não foi possível carregar as categorias.");
  }
}

export async function createCategory(
  input: CategorySchema,
  userId: string,
): Promise<Category> {
  try {
    await ensureCategoryNameIsAvailable(input.name);
    const reference = await addDoc(collection(getFirebaseDb(), "categories"), {
      name: input.name,
      nameNormalized: normalizeCategoryName(input.name),
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: reference.id,
      name: input.name,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    inventoryError(error, "Não foi possível cadastrar a categoria.");
  }
}

export async function updateCategory(
  categoryId: string,
  input: CategorySchema,
) {
  try {
    await ensureCategoryNameIsAvailable(input.name, categoryId);
    await updateDoc(doc(getFirebaseDb(), "categories", categoryId), {
      name: input.name,
      nameNormalized: normalizeCategoryName(input.name),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    inventoryError(error, "Não foi possível atualizar a categoria.");
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const productsSnapshot = await getDocs(
      query(
        collection(getFirebaseDb(), "products"),
        where("categoryId", "==", categoryId),
        limit(1),
      ),
    );
    if (!productsSnapshot.empty) {
      throw new InventoryServiceError(
        "Esta categoria está vinculada a produtos e não pode ser excluída.",
      );
    }
    await deleteDoc(doc(getFirebaseDb(), "categories", categoryId));
  } catch (error) {
    inventoryError(error, "Não foi possível excluir a categoria.");
  }
}

async function ensureCategoryNameIsAvailable(
  name: string,
  ignoredCategoryId?: string,
) {
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), "categories"),
      where("nameNormalized", "==", normalizeCategoryName(name)),
      limit(2),
    ),
  );
  if (snapshot.docs.some((item) => item.id !== ignoredCategoryId)) {
    throw new InventoryServiceError("Já existe uma categoria com esse nome.");
  }
}

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("pt-BR");
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

      if (!productSnapshot.exists()) {
        throw new InventoryServiceError("Produto não encontrado.");
      }

      const product = productSnapshot.data();
      const productUnit = readProductUnit(product.unit);
      if (!hasValidStockPrecision(input.quantityInBaseUnit, productUnit)) {
        throw new InventoryServiceError(
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
    inventoryError(error, "Não foi possível registrar a movimentação.");
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
    inventoryError(error, "Não foi possível carregar as movimentações.");
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

export async function getFinanceDashboard(): Promise<FinanceDashboardData> {
  try {
    const now = new Date();
    const todayStart = startOfLocalDay(now);
    const sevenDaysStart = addLocalDays(todayStart, -6);
    const thirtyDaysStart = addLocalDays(todayStart, -29);
    const sixtyDaysStart = addLocalDays(todayStart, -59);
    const snapshot = await getDocs(
      query(
        collection(getFirebaseDb(), "stockMovements"),
        where("createdAt", ">=", Timestamp.fromDate(sixtyDaysStart)),
        orderBy("createdAt", "desc"),
      ),
    );
    const movements = snapshot.docs.map((item) =>
      mapMovement(item.id, item.data()),
    );
    const exits = movements.filter((movement) => movement.type === "exit");
    const pricedSales = exits.filter(
      (movement) => movement.saleValueInCents !== null,
    );
    const salesLast30Days = pricedSales.filter(
      (sale) => new Date(sale.createdAt) >= thirtyDaysStart,
    );
    const salesPrevious30Days = pricedSales.filter((sale) => {
      const createdAt = new Date(sale.createdAt);
      return createdAt >= sixtyDaysStart && createdAt < thirtyDaysStart;
    });
    const salesLast30DaysInCents = sumSales(salesLast30Days);
    const previous30DaysInCents = sumSales(salesPrevious30Days);
    const productTotals = new Map<
      string,
      FinanceDashboardData["topProductsLast30Days"][number]
    >();

    for (const sale of salesLast30Days) {
      const current = productTotals.get(sale.productId);
      productTotals.set(sale.productId, {
        productId: sale.productId,
        productName: sale.productName,
        salesValueInCents:
          (current?.salesValueInCents ?? 0) + (sale.saleValueInCents ?? 0),
        salesCount: (current?.salesCount ?? 0) + 1,
      });
    }

    const dailySalesLast7Days = Array.from({ length: 7 }, (_, index) => {
      const dayStart = addLocalDays(sevenDaysStart, index);
      const nextDayStart = addLocalDays(dayStart, 1);
      const sales = pricedSales.filter((sale) => {
        const createdAt = new Date(sale.createdAt);
        return createdAt >= dayStart && createdAt < nextDayStart;
      });

      return {
        date: dayStart.toISOString(),
        salesValueInCents: sumSales(sales),
        salesCount: sales.length,
      };
    });

    return {
      summary: {
        salesTodayInCents: sumSales(
          pricedSales.filter(
            (sale) => new Date(sale.createdAt) >= todayStart,
          ),
        ),
        salesLast7DaysInCents: sumSales(
          pricedSales.filter(
            (sale) => new Date(sale.createdAt) >= sevenDaysStart,
          ),
        ),
        salesLast30DaysInCents,
        averageTicketLast30DaysInCents: salesLast30Days.length
          ? Math.round(salesLast30DaysInCents / salesLast30Days.length)
          : 0,
        salesCountLast30Days: salesLast30Days.length,
        largestSaleLast30DaysInCents: salesLast30Days.length
          ? Math.max(
              ...salesLast30Days.map((sale) => sale.saleValueInCents ?? 0),
            )
          : 0,
        previous30DaysInCents,
        growthLast30DaysPercentage: previous30DaysInCents
          ? ((salesLast30DaysInCents - previous30DaysInCents) /
              previous30DaysInCents) *
            100
          : null,
      },
      dailySalesLast7Days,
      topProductsLast30Days: [...productTotals.values()]
        .sort((a, b) => b.salesValueInCents - a.salesValueInCents)
        .slice(0, 5),
      recentSales: pricedSales.slice(0, 8),
    };
  } catch (error) {
    inventoryError(error, "Não foi possível carregar os dados financeiros.");
  }
}

function sumSales(sales: StockMovement[]) {
  return sales.reduce(
    (total, sale) => total + (sale.saleValueInCents ?? 0),
    0,
  );
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function isSameLocalDay(isoDate: string, reference: Date) {
  const date = new Date(isoDate);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}
