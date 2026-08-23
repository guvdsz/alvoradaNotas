import type { Metadata } from "next";

import { CategoryManager } from "@/features/categories/components/category-manager";

export const metadata: Metadata = {
  title: "Categorias",
};

export default function CategoriesPage() {
  return <CategoryManager />;
}
