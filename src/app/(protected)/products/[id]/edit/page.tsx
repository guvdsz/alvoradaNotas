import type { Metadata } from "next";

import { ProductForm } from "@/features/products/components/product-form";

export const metadata: Metadata = {
  title: "Editar produto",
};

export default async function EditProductPage({
  params,
}: PageProps<"/products/[id]/edit">) {
  const { id } = await params;
  return <ProductForm productId={id} />;
}
