import "server-only";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/features/inventory/types/inventory";

export async function listProducts(): Promise<Product[]> {
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, name, category, unit, current_stock, minimum_stock, purchase_price_in_cents, sale_price_in_cents, barcode, active",
    )
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar os produtos.");
  }

  return (data ?? []).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    currentStock: product.current_stock,
    minimumStock: product.minimum_stock,
    purchasePriceInCents: product.purchase_price_in_cents,
    salePriceInCents: product.sale_price_in_cents,
    barcode: product.barcode,
    active: product.active,
  }));
}
