import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto"),
  category: z.string().trim().min(2, "Informe a categoria"),
  unit: z.enum(["unit", "gram", "milliliter"]),
  minimumStock: z.number().int().nonnegative(),
  purchasePriceInCents: z.number().int().nonnegative(),
  salePriceInCents: z.number().int().nonnegative(),
  barcode: z.string().trim().optional(),
});

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  type: z.enum(["entry", "exit", "adjustment", "reversal"]),
  quantityInBaseUnit: z.number().int().positive(),
  reason: z.string().trim().min(2, "Informe o motivo"),
  idempotencyKey: z.string().uuid(),
});

export type ProductSchema = z.infer<typeof productSchema>;
export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
