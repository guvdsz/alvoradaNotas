import { Timestamp } from "firebase/firestore";
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

import { registerStockMovement } from "@/features/movements/services/movement.service";

const idempotencyKey = "00000000-0000-4000-8000-000000000000";
const validInput = {
  productId: "product-1",
  type: "exit" as const,
  quantityInBaseUnit: 0.5,
  saleValue: 20,
  reason: "Venda no balcão",
  idempotencyKey,
};

type FakeSnapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown>;
  id?: string;
};

function missingSnapshot(): FakeSnapshot {
  return { exists: () => false, data: () => ({}) };
}

function existingSnapshot(data: Record<string, unknown>): FakeSnapshot {
  return { exists: () => true, data: () => data };
}

function arrangeTransaction({
  movement = missingSnapshot(),
  product = existingSnapshot({
    name: "Queijo",
    unit: "kilogram",
    currentStock: 5,
  }),
}: {
  movement?: FakeSnapshot;
  product?: FakeSnapshot;
} = {}) {
  const transaction = {
    get: vi.fn(async (reference: { path: string }) =>
      reference.path.startsWith("stockMovements/") ? movement : product,
    ),
    update: vi.fn(),
    set: vi.fn(),
  };

  firestoreMocks.runTransaction.mockImplementation(
    async (_database: unknown, operation: (value: typeof transaction) => unknown) =>
      operation(transaction),
  );

  return transaction;
}

describe("registerStockMovement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registra saída e histórico na mesma transação sem deriva decimal", async () => {
    const transaction = arrangeTransaction();

    const result = await registerStockMovement(validInput, "user-1");

    expect(result.wasCreated).toBe(true);
    expect(result.resultingStock).toBe(4.5);
    expect(result.movement.productUnit).toBe("kilogram");
    expect(result.movement.saleValueInCents).toBe(2_000);
    expect(transaction.update).toHaveBeenCalledWith(
      { path: "products/product-1" },
      expect.objectContaining({ currentStock: 4.5 }),
    );
    expect(transaction.set).toHaveBeenCalledWith(
      { path: `stockMovements/${idempotencyKey}` },
      expect.objectContaining({
        productUnit: "kilogram",
        quantityInBaseUnit: 0.5,
        previousStock: 5,
        resultingStock: 4.5,
        saleValueInCents: 2_000,
      }),
    );
  });

  it("registra entrada sem valor de venda", async () => {
    const transaction = arrangeTransaction();

    const result = await registerStockMovement(
      { ...validInput, type: "entry", saleValue: 0 },
      "user-1",
    );

    expect(result.resultingStock).toBe(5.5);
    expect(result.movement.saleValueInCents).toBeNull();
    expect(transaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ saleValueInCents: null }),
    );
  });

  it("impede uma saída maior que a quantidade disponível", async () => {
    const transaction = arrangeTransaction();

    await expect(
      registerStockMovement(
        { ...validInput, quantityInBaseUnit: 5.001 },
        "user-1",
      ),
    ).rejects.toThrow("Estoque insuficiente");
    expect(transaction.update).not.toHaveBeenCalled();
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("recusa quantidade armazenada com precisão inválida", async () => {
    const transaction = arrangeTransaction({
      product: existingSnapshot({
        name: "Queijo",
        unit: "kilogram",
        currentStock: 5.0001,
      }),
    });

    await expect(registerStockMovement(validInput, "user-1")).rejects.toThrow(
      "quantidade atual deste produto é inválida",
    );
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it("reaproveita o lançamento quando a chave idempotente já existe", async () => {
    const transaction = arrangeTransaction({
      movement: existingSnapshot({
        productId: "product-1",
        productName: "Queijo",
        productUnit: "kilogram",
        type: "exit",
        quantityInBaseUnit: 0.5,
        saleValueInCents: 2_000,
        previousStock: 5,
        resultingStock: 4.5,
        reason: "Venda no balcão",
        createdAt: Timestamp.fromDate(new Date("2026-09-05T12:00:00Z")),
        createdBy: "user-1",
      }),
    });

    const result = await registerStockMovement(validInput, "user-1");

    expect(result.wasCreated).toBe(false);
    expect(result.resultingStock).toBe(5);
    expect(transaction.get).toHaveBeenCalledTimes(2);
    expect(transaction.update).not.toHaveBeenCalled();
    expect(transaction.set).not.toHaveBeenCalled();
  });

  it("recusa reutilizar a chave com outra precisão de quantidade", async () => {
    const transaction = arrangeTransaction({
      movement: existingSnapshot({
        productId: "product-1",
        productName: "Queijo",
        productUnit: "kilogram",
        type: "exit",
        quantityInBaseUnit: 0.5,
        saleValueInCents: 2_000,
        previousStock: 5,
        resultingStock: 4.5,
        reason: "Venda no balcão",
        createdAt: Timestamp.fromDate(new Date("2026-09-05T12:00:00Z")),
        createdBy: "user-1",
      }),
    });

    await expect(
      registerStockMovement(
        { ...validInput, quantityInBaseUnit: 0.5004 },
        "user-1",
      ),
    ).rejects.toThrow("conflita com um lançamento");
    expect(transaction.get).toHaveBeenCalledTimes(1);
  });

  it("revalida o payload dentro do serviço", async () => {
    const transaction = arrangeTransaction();

    await expect(
      registerStockMovement(
        { ...validInput, saleValue: 20.001 },
        "user-1",
      ),
    ).rejects.toThrow("duas casas decimais");
    expect(transaction.get).not.toHaveBeenCalled();
  });
});
