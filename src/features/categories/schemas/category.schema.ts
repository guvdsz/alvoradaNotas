import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da categoria")
    .max(80, "Use no máximo 80 caracteres"),
});

export type CategorySchema = z.infer<typeof categorySchema>;
