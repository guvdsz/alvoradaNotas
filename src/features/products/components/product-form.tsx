"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useController, useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { DataErrorState } from "@/components/ui/data-error-state";
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
  unitPriceLabels,
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const requestId = useRef(0);
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
  const { field: unitField } = useController({ control, name: "unit" });
  const selectedUnit = unitField.value;
  const unitLocked = Boolean(
    productId && currentStock !== null && currentStock !== 0,
  );

  const loadFormData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoadingProduct(true);
    setLoadError(null);
    try {
      const [loadedCategories, product] = await Promise.all([
        listCategories(),
        productId ? getProduct(productId) : Promise.resolve(null),
      ]);

      if (requestId.current !== currentRequest) return;

      setCategories(loadedCategories);
      if (product) {
        reset({
          name: product.name,
          categoryId: product.categoryId,
          unit: product.unit,
          minimumStock: product.minimumStock,
          price: product.priceInCents / 100,
          barcode: product.barcode ?? "",
        });
        setCurrentStock(product.currentStock);
      }
    } catch (error) {
      if (requestId.current === currentRequest) {
        setLoadError(
          error instanceof ProductServiceError
            ? error.message
            : "Verifique sua conexão e tente novamente.",
        );
      }
    } finally {
      if (requestId.current === currentRequest) setLoadingProduct(false);
    }
  }, [productId, reset]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadFormData();
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [loadFormData]);

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

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <DataErrorState
          message={loadError}
          onRetry={() => void loadFormData()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/products"
        className="inline-flex min-h-11 items-center gap-2 rounded-lg pr-3 text-sm font-semibold text-stone-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
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
                  className="relative inline-flex h-5 items-center gap-1 rounded text-xs font-semibold text-brand-700 after:absolute after:-inset-2 after:rounded-lg after:content-[''] hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  <Tags className="size-3.5" />
                  Gerenciar
                </Link>
              </div>
              <select
                id="categoryId"
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby={
                  errors.categoryId ? "categoryId-error" : undefined
                }
                className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:text-sm"
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
                <p id="categoryId-error" className="text-xs font-medium text-red-700">
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
                aria-invalid={Boolean(errors.unit)}
                aria-describedby={
                  errors.unit
                    ? "unit-error"
                    : unitLocked
                      ? "unit-locked-help"
                      : undefined
                }
                disabled={unitLocked}
                className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-base text-stone-900 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-600 sm:text-sm"
                {...unitField}
              >
                <option value="unit">Por unidade</option>
                <option value="gram">Por grama — exemplo: 500 g</option>
                <option value="kilogram">Por quilograma — exemplo: 0,5 kg</option>
                <option value="milliliter">Por volume — controle em mililitros</option>
              </select>
              {errors.unit?.message && (
                <p id="unit-error" className="text-xs font-medium text-red-700">
                  {errors.unit.message}
                </p>
              )}
              {unitLocked && (
                <p id="unit-locked-help" className="text-xs leading-5 text-stone-600">
                  Zere a quantidade no estoque antes de alterar esta forma de
                  controle.
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
              inputMode="decimal"
              min={0}
              max={1_000_000_000}
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
                <p className="mt-1 text-xs text-stone-600">
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
              label={unitPriceLabels[selectedUnit]}
              type="number"
              inputMode="decimal"
              min={0}
              max={10_000_000}
              step="0.01"
              helperText="Este preço é usado para sugerir o valor total das saídas."
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
