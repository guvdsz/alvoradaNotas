import type { Metadata } from "next";

import { ProductList } from "@/features/inventory/components/product-list";

export const metadata: Metadata = {
  title: "Produtos",
};

export default function ProductsPage() {
  return <ProductList />;
}
