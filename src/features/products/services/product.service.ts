"use client";

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
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import type { ProductSchema } from "@/features/products/schemas/product.schema";
import { mapProduct } from "@/features/products/services/product.mapper";
import type { Product } from "@/features/products/types/product";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  DataServiceError,
  handleDataServiceError,
} from "@/lib/firebase/data-service";

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
    handleDataServiceError("Produtos", error, "Não foi possível atualizar o produto.");
  }
}

export async function deleteProduct(productId: string) {
  try {
    await deleteDoc(doc(getFirebaseDb(), "products", productId));
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
