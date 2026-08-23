import type { ProductUnit } from "@/features/inventory/types/inventory";

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

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatStock(value: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: unit === "kilogram" ? 3 : 0,
  }).format(value)} ${baseUnitLabels[unit]}`;
}
