import { z } from "zod";

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

export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
export type StockMovementFormSchema = z.infer<
  typeof stockMovementFormSchema
>;
