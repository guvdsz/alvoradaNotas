"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  categorySchema,
  type CategorySchema,
} from "@/features/categories/schemas/category.schema";
import type { Category } from "@/features/categories/types/category";
import { getFirebaseDb } from "@/lib/firebase/client";
import {
  DataServiceError,
  firestoreDateToIso,
  handleDataServiceError,
} from "@/lib/firebase/data-service";

export { DataServiceError as CategoryServiceError };

function mapCategory(id: string, data: Record<string, unknown>): Category {
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw new TypeError("Categoria com nome inválido.");
  }

  return {
    id,
    name: data.name,
    createdAt: firestoreDateToIso(data.createdAt),
  };
}

export async function listCategories(): Promise<Category[]> {
  try {
    const snapshot = await getDocs(
      query(collection(getFirebaseDb(), "categories"), orderBy("name")),
    );
    return snapshot.docs.map((item) => mapCategory(item.id, item.data()));
  } catch (error) {
    handleDataServiceError(
      "Categorias",
      error,
      "Não foi possível carregar as categorias.",
    );
  }
}

export async function createCategory(
  input: CategorySchema,
  userId: string,
): Promise<Category> {
  try {
    const parsedInput = categorySchema.parse(input);
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new DataServiceError("Sua sessão expirou. Entre novamente.");
    }
    await ensureCategoryNameIsAvailable(parsedInput.name);
    const reference = await addDoc(collection(getFirebaseDb(), "categories"), {
      name: parsedInput.name,
      nameNormalized: normalizeCategoryName(parsedInput.name),
      createdBy: normalizedUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      id: reference.id,
      name: parsedInput.name,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    handleDataServiceError(
      "Categorias",
      error,
      "Não foi possível cadastrar a categoria.",
    );
  }
}

export async function updateCategory(
  categoryId: string,
  input: CategorySchema,
) {
  try {
    const parsedInput = categorySchema.parse(input);
    await ensureCategoryNameIsAvailable(parsedInput.name, categoryId);
    await updateDoc(doc(getFirebaseDb(), "categories", categoryId), {
      name: parsedInput.name,
      nameNormalized: normalizeCategoryName(parsedInput.name),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleDataServiceError(
      "Categorias",
      error,
      "Não foi possível atualizar a categoria.",
    );
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
      throw new DataServiceError(
        "Esta categoria está vinculada a produtos e não pode ser excluída.",
      );
    }
    await deleteDoc(doc(getFirebaseDb(), "categories", categoryId));
  } catch (error) {
    handleDataServiceError(
      "Categorias",
      error,
      "Não foi possível excluir a categoria.",
    );
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
    throw new DataServiceError("Já existe uma categoria com esse nome.");
  }
}

function normalizeCategoryName(name: string) {
  return name.trim().toLocaleLowerCase("pt-BR");
}
