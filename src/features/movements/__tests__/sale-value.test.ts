import { describe, expect, it } from "vitest";

import { calculateSuggestedSaleValue } from "@/features/movements/utils/sale-value";

describe("calculateSuggestedSaleValue", () => {
  it("multiplica o preço pela quantidade de unidades", () => {
    expect(calculateSuggestedSaleValue(1_050, 5)).toBe(52.5);
  });

  it("calcula o valor proporcional para quilogramas", () => {
    expect(calculateSuggestedSaleValue(4_000, 0.5)).toBe(20);
  });

  it.each([undefined, null, 0, Number.NaN])(
    "sugere uma unidade quando a quantidade está vazia (%s)",
    (quantity) => {
      expect(calculateSuggestedSaleValue(1_999, quantity)).toBe(19.99);
    },
  );

  it("arredonda o total para centavos", () => {
    expect(calculateSuggestedSaleValue(1_999, 0.5)).toBe(10);
  });
});
