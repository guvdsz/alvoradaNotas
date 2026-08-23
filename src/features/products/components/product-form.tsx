"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Barcode,
  Boxes,
  CircleDollarSign,
  PackagePlus,
  Save,
  Tags,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { listCategories } from "@/features/categories/services/category.service";
import type { Category } from "@/features/categories/types/category";
import {
  productSchema,
  type ProductSchema,
} from "@/features/products/schemas/product.schema";
import {
  createProduct,
  getProduct,
  ProductServiceError,
  updateProduct,
} from "@/features/products/services/product.service";
import { ProductFormSkeleton } from "@/features/products/components/product-form-skeleton";
import {
  baseUnitLabels,
  formatStock,
} from "@/features/products/utils/product-formatters";

const defaultValues: ProductSchema = {
  name: "",
  categoryId: "",
  unit: "unit",
  minimumStock: 0,
  price: 0,
  barcode: "",
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductSchema>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues,
  });
  const selectedUnit = useWatch({ control, name: "unit" });

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      listCategories(),
      productId ? getProduct(productId) : Promise.resolve(null),
    ])
      .then(([loadedCategories, product]) => {
        if (!mounted) return;

        setCategories(loadedCategories);
        if (product) {
          const categoryId =
            product.categoryId ||
            loadedCategories.find(
              (category) => category.name === product.categoryName,
            )?.id ||
            "";
          reset({
            name: product.name,
            categoryId,
            unit: product.unit,
            minimumStock: product.minimumStock,
            price: product.priceInCents / 100,
            barcode: product.barcode ?? "",
          });
          setCurrentStock(product.currentStock);
        }
      })
      .catch((error) => {
        if (mounted) {
          setServerError(
            error instanceof ProductServiceError
              ? error.message
              : "Não foi possível carregar os dados do produto.",
          );
        }
      })
      .finally(() => {
        if (mounted) setLoadingProduct(false);
      });

    return () => {
      mounted = false;
    };
  }, [productId, reset]);

  async function onSubmit(data: ProductSchema) {
    setServerError(null);
    if (!user) {
      setServerError("Sua sessão expirou. Entre novamente.");
      return;
    }

    try {
      if (productId) await updateProduct(productId, data);
      else await createProduct(data, user.id);
      router.push("/products");
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof ProductServiceError
          ? error.message
          : "Não foi possível salvar o produto.",
      );
    }
  }

  if (loadingProduct) {
    return <ProductFormSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="size-4" />
        Voltar para produtos
      </Link>

      <div className="mt-5">
        <p className="text-sm font-semibold text-brand-600">Produtos</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          {productId ? "Editar produto" : "Novo produto"}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Preencha as informações comerciais e os limites de estoque.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle
            icon={<PackagePlus className="size-5" />}
            title="Identificação"
            description="Como o produto será encontrado no estoque."
          />

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input
              id="name"
              label="Nome do produto"
              placeholder="Ex.: Queijo Minas Frescal"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="categoryId" className="text-sm font-semibold text-stone-700">
                  Categoria
                </label>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  <Tags className="size-3.5" />
                  Gerenciar
                </Link>
              </div>
              <select
                id="categoryId"
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                {...register("categoryId")}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId?.message && (
                <p className="text-xs font-medium text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
              {categories.length === 0 && (
                <p className="text-xs text-amber-700">
                  Cadastre uma categoria antes de salvar o produto.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="unit" className="text-sm font-semibold text-stone-700">
                Forma de controle
              </label>
              <select
                id="unit"
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                {...register("unit")}
              >
                <option value="unit">Por unidade</option>
                <option value="gram">Por grama — exemplo: 500 g</option>
                <option value="kilogram">Por quilograma — exemplo: 0,5 kg</option>
                <option value="milliliter">Por volume — controle em mililitros</option>
              </select>
              {errors.unit?.message && (
                <p className="text-xs font-medium text-red-600">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <Input
              id="barcode"
              label="Código de barras"
              placeholder="Opcional"
              inputMode="numeric"
              icon={<Barcode className="size-4" />}
              error={errors.barcode?.message}
              {...register("barcode")}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle
            icon={<Boxes className="size-5" />}
            title="Estoque"
            description="Defina quando o produto precisa de reposição."
            tone="blue"
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Input
              id="minimumStock"
              label={`Estoque mínimo (${baseUnitLabels[selectedUnit]})`}
              type="number"
              min={0}
              step={selectedUnit === "kilogram" ? "0.001" : "1"}
              error={errors.minimumStock?.message}
              {...register("minimumStock", { valueAsNumber: true })}
            />
            {productId && currentStock !== null ? (
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-xs font-semibold text-stone-500">Quantidade no estoque</p>
                <p className="mt-1 text-lg font-bold text-stone-900">
                  {formatStock(currentStock, selectedUnit)}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  Alterado apenas por movimentações.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/60 px-4 py-3 text-xs leading-5 text-stone-500">
                O produto começa com quantidade zero no estoque. A entrada inicial será registrada no módulo de movimentações.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <SectionTitle
            icon={<CircleDollarSign className="size-5" />}
            title="Valor"
            description="Informe o valor correspondente à forma de controle escolhida."
            tone="green"
          />
          <div className="mt-6 max-w-sm">
            <Input
              id="price"
              label="Valor do produto (R$)"
              type="number"
              min={0}
              step="0.01"
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />
          </div>
        </section>

        {serverError && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {serverError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Salvando..."
            iconLeft={productId ? <Save className="size-4" /> : <PackagePlus className="size-4" />}
            disabled={categories.length === 0}
          >
            {productId ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  description,
  tone = "brand",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone?: "brand" | "blue" | "green";
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`rounded-xl p-2.5 ${toneClasses[tone]}`}>{icon}</span>
      <div>
        <h2 className="font-bold text-stone-900">{title}</h2>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
    </div>
  );
}
