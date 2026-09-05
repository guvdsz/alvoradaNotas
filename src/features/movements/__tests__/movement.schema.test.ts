import { describe, expect, it } from "vitest";

import { stockMovementSchema } from "@/features/movements/schemas/movement.schema";

const validMovement = {
  productId: "product-1",
  type: "exit" as const,
  quantityInBaseUnit: 0.5,
  saleValue: 20,
  reason: "Venda no balcão",
  idempotencyKey: "00000000-0000-4000-8000-000000000000",
};

describe("stockMovementSchema", () => {
  it("aceita uma saída com valor positivo e normaliza o motivo", () => {
    const result = stockMovementSchema.parse({
      ...validMovement,
      reason: "  Venda no balcão  ",
    });

    expect(result.reason).toBe("Venda no balcão");
  });

  it("permite entrada sem valor de venda", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        type: "entry",
        saleValue: 0,
      }).success,
    ).toBe(true);
  });

  it("recusa valor de venda escondido em uma entrada", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        type: "entry",
        saleValue: 20,
      }).success,
    ).toBe(false);
  });

  it("recusa saída sem valor de venda", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        saleValue: 0,
      }).success,
    ).toBe(false);
  });

  it("recusa valor com fração de centavo", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        saleValue: 20.001,
      }).success,
    ).toBe(false);
  });

  it("aceita centavos válidos mesmo em valores altos", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        saleValue: 1_234_567.89,
      }).success,
    ).toBe(true);
  });

  it("recusa quantidade nula ou negativa", () => {
    expect(
      stockMovementSchema.safeParse({
        ...validMovement,
        quantityInBaseUnit: 0,
      }).success,
    ).toBe(false);
  });
});
