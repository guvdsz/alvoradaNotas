"use server";

import { requireUser } from "@/lib/auth/session";
import {
  stockMovementSchema,
  type StockMovementSchema,
} from "@/lib/schemas/inventory.schema";

export type InventoryActionResult =
  | { success: true }
  | { success: false; error: string };

export async function registerStockMovementAction(
  input: StockMovementSchema,
): Promise<InventoryActionResult> {
  await requireUser();

  const parsed = stockMovementSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Movimentação inválida.",
    };
  }

  // A persistência será conectada à RPC transacional após aplicar o schema SQL.
  return {
    success: false,
    error: "O schema de estoque ainda precisa ser aplicado no Supabase.",
  };
}
