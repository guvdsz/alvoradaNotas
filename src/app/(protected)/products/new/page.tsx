import type { Metadata } from "next";

import { ProductForm } from "@/features/inventory/components/product-form";

export const metadata: Metadata = {
  title: "Novo produto",
};

export default function NewProductPage() {
  return <ProductForm />;
}
