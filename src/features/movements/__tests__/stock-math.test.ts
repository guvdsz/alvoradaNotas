import { describe, expect, it } from "vitest";

import {
  calculateResultingStock,
  hasValidStockPrecision,
  normalizeStockQuantity,
} from "@/features/movements/utils/stock-math";

describe("stock-math", () => {
  it("evita deriva decimal ao retirar e repor quilogramas", () => {
    const afterExit = calculateResultingStock(5, 0.5, "exit", "kilogram");
    const afterEntry = calculateResultingStock(
      afterExit,
      0.5,
      "entry",
      "kilogram",
    );

    expect(afterExit).toBe(4.5);
    expect(afterEntry).toBe(5);
  });

  it("mantém três casas decimais para quilogramas", () => {
    expect(normalizeStockQuantity(1.2344, "kilogram")).toBe(1.234);
    expect(normalizeStockQuantity(1.2345, "kilogram")).toBe(1.235);
    expect(hasValidStockPrecision(1.234, "kilogram")).toBe(true);
    expect(hasValidStockPrecision(1.2345, "kilogram")).toBe(false);
  });

  it.each(["unit", "gram", "milliliter"] as const)(
    "aceita somente inteiros para %s",
    (unit) => {
      expect(hasValidStockPrecision(12, unit)).toBe(true);
      expect(hasValidStockPrecision(12.5, unit)).toBe(false);
    },
  );

  it("soma e subtrai quantidades inteiras", () => {
    expect(calculateResultingStock(500, 125, "entry", "gram")).toBe(625);
    expect(calculateResultingStock(500, 125, "exit", "gram")).toBe(375);
  });
});
