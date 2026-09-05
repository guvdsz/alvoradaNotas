"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  productSchema,
  type ProductSchema,
} from "@/features/products/schemas/product.schema";
import {
  mapProduct,
  readProductUnit,
} from "@/features/products/services/product.mapper";
import type { Product } from "@/features/products/types/product";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  DataServiceError,
  handleDataServiceError,
} from "@/lib/firebase/data-service";
import { hasAtMostDecimalPlaces } from "@/lib/utils/number";

export { DataServiceError as ProductServiceError };

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
    handleDataServiceError("Produtos", error, "Não foi possível carregar os produtos.");
  }
}

export async function createProduct(input: ProductSchema, userId: string) {
  try {
    const parsedInput = productSchema.parse(input);
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new DataServiceError("Sua sessão expirou. Entre novamente.");
    }
    await ensureBarcodeIsAvailable(parsedInput.barcode);

    const database = getFirebaseDb();
    const productReference = doc(collection(database, "products"));
    const categoryReference = doc(
      database,
      "categories",
      parsedInput.categoryId,
    );

    await runTransaction(database, async (transaction) => {
      const categorySnapshot = await transaction.get(categoryReference);
      if (!categorySnapshot.exists()) {
        throw new DataServiceError("Selecione uma categoria válida.");
      }

      transaction.set(productReference, {
        name: parsedInput.name,
        categoryId: parsedInput.categoryId,
        unit: parsedInput.unit,
        currentStock: 0,
        minimumStock: parsedInput.minimumStock,
        priceInCents: Math.round(parsedInput.price * 100),
        barcode: parsedInput.barcode || null,
        createdBy: normalizedUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleDataServiceError("Produtos", error, "Não foi possível cadastrar o produto.");
  }
}

export async function getProduct(productId: string): Promise<Product> {
  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), "products", productId));

    if (!snapshot.exists()) {
      throw new DataServiceError("Produto não encontrado.");
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
    handleDataServiceError("Produtos", error, "Não foi possível carregar o produto.");
  }
}

export async function updateProduct(productId: string, input: ProductSchema) {
  try {
    const parsedInput = productSchema.parse(input);
    await ensureBarcodeIsAvailable(parsedInput.barcode, productId);

    const database = getFirebaseDb();
    const productReference = doc(database, "products", productId);
    const categoryReference = doc(
      database,
      "categories",
      parsedInput.categoryId,
    );

    await runTransaction(database, async (transaction) => {
      const [productSnapshot, categorySnapshot] = await Promise.all([
        transaction.get(productReference),
        transaction.get(categoryReference),
      ]);

      if (!productSnapshot.exists()) {
        throw new DataServiceError("Produto não encontrado.");
      }
      if (!categorySnapshot.exists()) {
        throw new DataServiceError("Selecione uma categoria válida.");
      }

      const currentUnit = readProductUnit(productSnapshot.data().unit);
      const currentStock = readCurrentStock(
        productSnapshot.data().currentStock,
        currentUnit,
      );
      if (currentUnit !== parsedInput.unit && currentStock !== 0) {
        throw new DataServiceError(
          "A forma de controle só pode ser alterada quando a quantidade no estoque estiver zerada.",
        );
      }

      transaction.update(productReference, {
        name: parsedInput.name,
        categoryId: parsedInput.categoryId,
        unit: parsedInput.unit,
        minimumStock: parsedInput.minimumStock,
        priceInCents: Math.round(parsedInput.price * 100),
        barcode: parsedInput.barcode || null,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    handleDataServiceError("Produtos", error, "Não foi possível atualizar o produto.");
  }
}

export async function deleteProduct(productId: string) {
  try {
    const database = getFirebaseDb();
    const productReference = doc(database, "products", productId);

    await runTransaction(database, async (transaction) => {
      const productSnapshot = await transaction.get(productReference);
      if (!productSnapshot.exists()) {
        throw new DataServiceError("Produto não encontrado.");
      }

      const currentUnit = readProductUnit(productSnapshot.data().unit);
      const currentStock = readCurrentStock(
        productSnapshot.data().currentStock,
        currentUnit,
      );
      if (currentStock !== 0) {
        throw new DataServiceError(
          "Zere a quantidade no estoque antes de excluir o produto.",
        );
      }

      transaction.delete(productReference);
    });
  } catch (error) {
    handleDataServiceError("Produtos", error, "Não foi possível excluir o produto.");
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
    throw new DataServiceError(
      "Já existe um produto com esse código de barras.",
    );
  }
}

function readCurrentStock(
  value: unknown,
  unit: ReturnType<typeof readProductUnit>,
) {
  const stock = typeof value === "number" ? value : Number.NaN;
  if (
    Number.isFinite(stock) &&
    stock >= 0 &&
    stock <= 1_000_000_000 &&
    (unit === "kilogram"
      ? hasAtMostDecimalPlaces(stock, 3)
      : Number.isInteger(stock))
  ) {
    return stock;
  }

  throw new DataServiceError(
    "A quantidade atual deste produto é inválida.",
  );
}
