"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  FolderPlus,
  LoaderCircle,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { DataErrorState } from "@/components/ui/data-error-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  deleteProduct,
  listProducts,
  ProductServiceError,
} from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import {
  formatStock,
  unitLabels,
} from "@/features/products/utils/product-formatters";
import { ProductListSkeleton } from "@/features/products/components/product-list-skeleton";
import { formatCurrency } from "@/lib/utils/formatters";

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestId = useRef(0);

  const loadProducts = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError(null);
    try {
      const loadedProducts = await listProducts();
      if (requestId.current === currentRequest) {
        setProducts(loadedProducts);
      }
    } catch (reason) {
      if (requestId.current === currentRequest) {
        setLoadError(
          reason instanceof ProductServiceError
            ? reason.message
            : "Verifique sua conexão e tente novamente.",
        );
      }
    } finally {
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadProducts();
    });
    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter(
      (product) =>
        !normalizedSearch ||
        product.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch) ||
        product.categoryName
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        product.barcode?.includes(normalizedSearch),
    );
  }, [products, search]);

  async function confirmDelete() {
    if (!productToDelete) return;

    const product = productToDelete;
    setDeletingId(product.id);
    setActionError(null);
    try {
      await deleteProduct(product.id);
      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );
      setProductToDelete(null);
    } catch (reason) {
      setActionError(
        reason instanceof ProductServiceError
          ? reason.message
          : "Não foi possível excluir o produto.",
      );
      setProductToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <ProductListSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-600">Estoque</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
            Produtos
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Organize preços, unidades e níveis mínimos de reposição.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/categories"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <FolderPlus className="size-4" /> Categorias
          </Link>
          <Link
            href="/products/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Plus className="size-4" /> Novo produto
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-4 sm:p-5">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, categoria ou código"
              aria-label="Buscar produtos"
              className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 pl-10 pr-4 text-base outline-none transition placeholder:text-stone-500 focus:border-brand-600 focus:bg-white focus:ring-4 focus:ring-brand-100 sm:text-sm"
            />
          </div>
        </div>

        {actionError && (
          <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {loadError ? (
          <DataErrorState
            message={loadError}
            onRetry={() => void loadProducts()}
            className="min-h-80"
          />
        ) : visibleProducts.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
            <span className="rounded-2xl bg-brand-50 p-4 text-brand-600">
              <PackageOpen className="size-7" />
            </span>
            <h2 className="mt-4 font-bold text-stone-800">
              {products.length === 0
                ? "Nenhum produto cadastrado"
                : "Nenhum resultado encontrado"}
            </h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
              {products.length === 0
                ? "Cadastre o primeiro item para começar a organizar o estoque."
                : "Tente alterar os termos da busca."}
            </p>
            {products.length === 0 && (
              <Link
                href="/products/new"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <Plus className="size-4" /> Cadastrar produto
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-stone-100 lg:hidden">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  deleting={deletingId === product.id}
                  deletionPending={deletingId !== null}
                  onDelete={() => {
                    setActionError(null);
                    setProductToDelete(product);
                  }}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-stone-50/80 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-5 py-3.5">Produto</th>
                    <th className="px-4 py-3.5">Controle</th>
                    <th className="px-4 py-3.5">Estoque</th>
                    <th className="px-4 py-3.5">Valor</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {visibleProducts.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      deleting={deletingId === product.id}
                      deletionPending={deletingId !== null}
                      onDelete={() => {
                        setActionError(null);
                        setProductToDelete(product);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <ConfirmationDialog
        open={productToDelete !== null}
        title={`Excluir o produto “${productToDelete?.name ?? ""}”?`}
        description="Essa ação não pode ser desfeita. O histórico de movimentações será preservado."
        confirmLabel="Excluir produto"
        isLoading={deletingId !== null}
        loadingLabel="Excluindo..."
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setProductToDelete(null);
        }}
      />
    </div>
  );
}

function StockValue({ product }: { product: Product }) {
  const lowStock = product.currentStock <= product.minimumStock;
  return (
    <div>
      <p className={`flex items-center gap-1.5 font-bold ${lowStock ? "text-amber-700" : "text-stone-800"}`}>
        {lowStock && <AlertTriangle className="size-3.5" />}
        {formatStock(product.currentStock, product.unit)}
      </p>
      <p className="mt-0.5 text-xs text-stone-600">
        Mín. {formatStock(product.minimumStock, product.unit)}
      </p>
    </div>
  );
}

function ProductRow({
  product,
  deleting,
  deletionPending,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  deletionPending: boolean;
  onDelete: () => void;
}) {
  return (
    <tr className="text-stone-700">
      <td className="px-5 py-4">
        <p className="font-semibold text-stone-900">{product.name}</p>
        <p className="mt-0.5 text-xs text-stone-500">
          {product.categoryName}
          {product.barcode ? ` · ${product.barcode}` : ""}
        </p>
      </td>
      <td className="px-4 py-4 text-sm">{unitLabels[product.unit]}</td>
      <td className="px-4 py-4 text-sm"><StockValue product={product} /></td>
      <td className="px-4 py-4 text-sm font-semibold text-stone-800">
        {formatCurrency(product.priceInCents)}
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <Link
            href={`/products/${product.id}/edit`}
            aria-label={`Editar ${product.name}`}
            className="inline-flex size-11 items-center justify-center rounded-xl text-stone-600 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Pencil className="size-4" />
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deletionPending}
            aria-label={`Excluir ${product.name}`}
            className="inline-flex size-11 items-center justify-center rounded-xl text-stone-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductCard({
  product,
  deleting,
  deletionPending,
  onDelete,
}: {
  product: Product;
  deleting: boolean;
  deletionPending: boolean;
  onDelete: () => void;
}) {
  return (
    <article className="p-5">
      <div>
        <p className="font-bold text-stone-900">{product.name}</p>
        <p className="mt-1 text-xs text-stone-600">
          {product.categoryName} · {unitLabels[product.unit]}
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3">
        <div>
          <p className="text-xs font-semibold uppercase text-stone-600">Estoque</p>
          <StockValue product={product} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-stone-600">Valor</p>
          <p className="mt-1 font-bold text-stone-800">
            {formatCurrency(product.priceInCents)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/products/${product.id}/edit`}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700"
        >
          <Pencil className="size-3.5" /> Editar
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deletionPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Excluir
        </button>
      </div>
    </article>
  );
}
