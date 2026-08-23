import { z } from "zod";

export const productSchema = z
  .object({
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
  })
  .superRefine((data, context) => {
    if (data.unit !== "kilogram" && !Number.isInteger(data.minimumStock)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimumStock"],
        message: "Use um número inteiro para esta unidade",
      });
    }
  });

export type ProductSchema = z.infer<typeof productSchema>;
