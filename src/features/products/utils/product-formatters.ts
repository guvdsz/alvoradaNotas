import type { ProductUnit } from "@/features/products/types/product";

export const unitLabels: Record<ProductUnit, string> = {
  unit: "Unidade",
  gram: "Grama",
  kilogram: "Quilograma",
  milliliter: "Mililitro",
};

export const baseUnitLabels: Record<ProductUnit, string> = {
  unit: "un.",
  gram: "g",
  kilogram: "kg",
  milliliter: "ml",
};

export const unitPriceLabels: Record<ProductUnit, string> = {
  unit: "Preço por unidade (R$)",
  gram: "Preço por grama (R$)",
  kilogram: "Preço por quilograma (R$)",
  milliliter: "Preço por mililitro (R$)",
};

export function formatStock(value: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: unit === "kilogram" ? 3 : 0,
  }).format(value)} ${baseUnitLabels[unit]}`;
}
