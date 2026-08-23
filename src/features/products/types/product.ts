export type ProductUnit = "unit" | "gram" | "kilogram" | "milliliter";

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: ProductUnit;
  currentStock: number;
  minimumStock: number;
  priceInCents: number;
  barcode: string | null;
  createdAt: string;
};
