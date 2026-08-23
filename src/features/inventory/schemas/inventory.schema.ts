import { z } from "zod";

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome do produto")
    .max(120, "Use no máximo 120 caracteres"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  unit: z.enum(["unit", "gram", "kilogram", "milliliter"]),
  minimumStock: z
    .number({ message: "Informe o estoque mínimo" })
    .nonnegative("O estoque mínimo não pode ser negativo")
    .max(1_000_000_000, "Quantidade muito alta"),
  price: z
    .number({ message: "Informe o valor do produto" })
    .nonnegative("O preço não pode ser negativo")
    .max(10_000_000, "Preço muito alto"),
  barcode: z
    .string()
    .trim()
    .max(64, "Use no máximo 64 caracteres")
    .optional(),
}).superRefine((data, context) => {
  if (data.unit !== "kilogram" && !Number.isInteger(data.minimumStock)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["minimumStock"],
      message: "Use um número inteiro para esta unidade",
    });
  }
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da categoria")
    .max(80, "Use no máximo 80 caracteres"),
});

const stockMovementBaseSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  type: z.enum(["entry", "exit"]),
  quantityInBaseUnit: z
    .number({ message: "Informe a quantidade" })
    .positive("A quantidade deve ser maior que zero")
    .max(1_000_000_000, "Quantidade muito alta"),
  saleValue: z
    .number({ message: "Informe o valor total da venda" })
    .nonnegative("O valor da venda não pode ser negativo")
    .max(10_000_000, "Valor da venda muito alto"),
  reason: z
    .string()
    .trim()
    .min(2, "Informe o motivo")
    .max(240, "Use no máximo 240 caracteres"),
  idempotencyKey: z.string().uuid(),
});

function validateSaleValue(
  data: { type: "entry" | "exit"; saleValue: number },
  context: z.RefinementCtx,
) {
  if (data.type === "exit" && data.saleValue <= 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["saleValue"],
      message: "Informe o valor total da venda",
    });
  }
}

export const stockMovementSchema =
  stockMovementBaseSchema.superRefine(validateSaleValue);

export const stockMovementFormSchema = stockMovementBaseSchema
  .omit({ idempotencyKey: true })
  .superRefine(validateSaleValue);

export type ProductSchema = z.infer<typeof productSchema>;
export type CategorySchema = z.infer<typeof categorySchema>;
export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
export type StockMovementFormSchema = z.infer<
  typeof stockMovementFormSchema
>;
