import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do produto")
    .max(120, "Use no máximo 120 caracteres"),
  category: z
    .string()
    .trim()
    .min(2, "Informe a categoria")
    .max(80, "Use no máximo 80 caracteres"),
  unit: z.enum(["unit", "gram", "milliliter"]),
  minimumStock: z
    .number({ message: "Informe o estoque mínimo" })
    .int("Use um número inteiro")
    .nonnegative("O estoque mínimo não pode ser negativo")
    .max(1_000_000_000, "Quantidade muito alta"),
  purchasePrice: z
    .number({ message: "Informe o preço de compra" })
    .nonnegative("O preço não pode ser negativo")
    .max(10_000_000, "Preço muito alto"),
  salePrice: z
    .number({ message: "Informe o preço de venda" })
    .nonnegative("O preço não pode ser negativo")
    .max(10_000_000, "Preço muito alto"),
  barcode: z
    .string()
    .trim()
    .max(64, "Use no máximo 64 caracteres")
    .optional(),
});

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["entry", "exit"]),
  quantityInBaseUnit: z
    .number({ message: "Informe a quantidade" })
    .int("Use um número inteiro")
    .positive("A quantidade deve ser maior que zero")
    .max(1_000_000_000, "Quantidade muito alta"),
  reason: z
    .string()
    .trim()
    .min(2, "Informe o motivo")
    .max(240, "Use no máximo 240 caracteres"),
  idempotencyKey: z.string().uuid(),
});

export type ProductSchema = z.infer<typeof productSchema>;
export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
