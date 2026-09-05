import { describe, expect, it } from "vitest";

import { productSchema } from "@/features/products/schemas/product.schema";

const validProduct = {
  name: "Queijo Minas",
  categoryId: "category-1",
  unit: "unit" as const,
  minimumStock: 2,
  price: 19.9,
  barcode: "7890000000000",
};

describe("productSchema", () => {
  it("normaliza os textos e aceita valores monetários em centavos", () => {
    const result = productSchema.parse({
      ...validProduct,
      name: "  Queijo Minas  ",
      barcode: "  7890000000000  ",
    });

    expect(result.name).toBe("Queijo Minas");
    expect(result.barcode).toBe("7890000000000");
    expect(result.price).toBe(19.9);
  });

  it("aceita até três casas decimais para quilogramas", () => {
    expect(
      productSchema.safeParse({
        ...validProduct,
        unit: "kilogram",
        minimumStock: 0.125,
      }).success,
    ).toBe(true);
  });

  it.each(["unit", "gram", "milliliter"] as const)(
    "recusa quantidade mínima fracionada para %s",
    (unit) => {
      expect(
        productSchema.safeParse({
          ...validProduct,
          unit,
          minimumStock: 1.5,
        }).success,
      ).toBe(false);
    },
  );

  it("recusa mais de três casas decimais em quilogramas", () => {
    expect(
      productSchema.safeParse({
        ...validProduct,
        unit: "kilogram",
        minimumStock: 0.1255,
      }).success,
    ).toBe(false);
  });

  it("recusa valores monetários com frações de centavo", () => {
    expect(
      productSchema.safeParse({ ...validProduct, price: 19.999 }).success,
    ).toBe(false);
  });

  it("aceita centavos válidos mesmo em valores altos", () => {
    expect(
      productSchema.safeParse({
        ...validProduct,
        price: 1_234_567.89,
      }).success,
    ).toBe(true);
  });
});
