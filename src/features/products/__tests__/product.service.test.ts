import { beforeEach, describe, expect, it, vi } from "vitest";

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((_database: unknown, ...segments: string[]) => ({
    path: segments.join("/"),
  })),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => "server-timestamp"),
}));

vi.mock("firebase/firestore", async (importOriginal) => {
  const original = await importOriginal<typeof import("firebase/firestore")>();
  return {
    ...original,
    doc: firestoreMocks.doc,
    runTransaction: firestoreMocks.runTransaction,
    serverTimestamp: firestoreMocks.serverTimestamp,
  };
});

vi.mock("@/lib/firebase/client", () => ({
  getFirebaseDb: () => ({ name: "test-database" }),
}));

import {
  deleteProduct,
  updateProduct,
} from "@/features/products/services/product.service";

const validProduct = {
  name: "Queijo Minas",
  categoryId: "category-1",
  unit: "kilogram" as const,
  minimumStock: 1,
  price: 40,
  barcode: "",
};

function arrangeTransaction(currentStock: number, currentUnit = "kilogram") {
  const transaction = {
    get: vi.fn(async (reference: { path: string }) => ({
      exists: () => true,
      data: () =>
        reference.path.startsWith("products/")
          ? { unit: currentUnit, currentStock }
          : { name: "Frios" },
    })),
    update: vi.fn(),
    delete: vi.fn(),
  };

  firestoreMocks.runTransaction.mockImplementation(
    async (_database: unknown, operation: (value: typeof transaction) => unknown) =>
      operation(transaction),
  );

  return transaction;
}

describe("product service stock invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("impede alterar a unidade enquanto houver estoque", async () => {
    const transaction = arrangeTransaction(5);

    await expect(
      updateProduct("product-1", { ...validProduct, unit: "gram" }),
    ).rejects.toThrow("quantidade no estoque estiver zerada");
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("permite alterar a unidade quando o estoque está zerado", async () => {
    const transaction = arrangeTransaction(0);

    await updateProduct("product-1", { ...validProduct, unit: "gram" });

    expect(transaction.update).toHaveBeenCalledWith(
      { path: "products/product-1" },
      expect.objectContaining({ unit: "gram" }),
    );
  });

  it("impede excluir produto que ainda possui estoque", async () => {
    const transaction = arrangeTransaction(1);

    await expect(deleteProduct("product-1")).rejects.toThrow(
      "Zere a quantidade no estoque",
    );
    expect(transaction.delete).not.toHaveBeenCalled();
  });

  it("permite excluir um produto sem estoque", async () => {
    const transaction = arrangeTransaction(0);

    await deleteProduct("product-1");

    expect(transaction.delete).toHaveBeenCalledWith({
      path: "products/product-1",
    });
  });
});
