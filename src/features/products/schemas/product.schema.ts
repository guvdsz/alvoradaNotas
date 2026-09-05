import { z } from "zod";

import { hasAtMostDecimalPlaces } from "@/lib/utils/number";

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
      .max(10_000_000, "Preço muito alto")
      .refine(
        (value) => hasAtMostDecimalPlaces(value, 2),
        "Use no máximo duas casas decimais",
      ),
    barcode: z
      .string()
      .trim()
      .max(64, "Use no máximo 64 caracteres")
      .optional(),
  })
  .superRefine((data, context) => {
    const validMinimumStock =
      data.unit === "kilogram"
        ? hasAtMostDecimalPlaces(data.minimumStock, 3)
        : Number.isInteger(data.minimumStock);

    if (!validMinimumStock) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minimumStock"],
        message:
          data.unit === "kilogram"
            ? "Use no máximo três casas decimais"
            : "Use um número inteiro para esta unidade",
      });
    }
  });

export type ProductSchema = z.infer<typeof productSchema>;
