"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  PackagePlus,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import {
  stockMovementFormSchema,
  type StockMovementFormSchema,
} from "@/features/inventory/schemas/inventory.schema";
import {
  InventoryServiceError,
  listProducts,
  listStockMovements,
  registerStockMovement,
} from "@/features/inventory/services/inventory.service";
import type {
  Product,
  StockMovement,
} from "@/features/inventory/types/inventory";
import {
  baseUnitLabels,
  formatCurrency,
  formatStock,
  unitLabels,
} from "@/features/inventory/utils/formatters";
import { hasValidStockPrecision } from "@/features/inventory/utils/stock-math";

const defaultValues: StockMovementFormSchema = {
  productId: "",
  type: "entry",
  quantityInBaseUnit: 0,
  saleValue: 0,
  reason: "",
};

type MovementFilter = "all" | "entry" | "exit";

export function MovementManager({
  initialType = "entry",
}: {
  initialType?: "entry" | "exit";
}) {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StockMovementFormSchema>({
    resolver: zodResolver(stockMovementFormSchema),
    mode: "onChange",
    defaultValues: { ...defaultValues, type: initialType },
  });
  const selectedProductId = useWatch({ control, name: "productId" });
  const selectedType = useWatch({ control, name: "type" });
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );
  const selectedProductSaleValue =
    (selectedProduct?.priceInCents ?? 0) / 100;

  useEffect(() => {
    setValue(
      "saleValue",
      selectedType === "exit" ? selectedProductSaleValue : 0,
      { shouldDirty: false, shouldValidate: false },
    );
  }, [selectedProductId, selectedProductSaleValue, selectedType, setValue]);

  useEffect(() => {
    let mounted = true;
    void Promise.all([listProducts(), listStockMovements()])
      .then(([loadedProducts, loadedMovements]) => {
        if (!mounted) return;
        setProducts(loadedProducts);
        setMovements(loadedMovements);
      })
      .catch((error) => {
        if (mounted) setServerError(getErrorMessage(error));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleMovements = useMemo(
    () =>
      filter === "all"
        ? movements
        : movements.filter((movement) => movement.type === filter),
    [filter, movements],
  );

  function changeMovementType(type: "entry" | "exit") {
    if (type === selectedType) return;

    setServerError(null);
    setSuccessMessage(null);
    clearErrors();
    setValue("type", type, { shouldDirty: true, shouldValidate: false });
    setValue(
      "saleValue",
      type === "exit" ? selectedProductSaleValue : 0,
      { shouldDirty: false, shouldValidate: false },
    );
  }

  async function onSubmit(data: StockMovementFormSchema) {
    setServerError(null);
    setSuccessMessage(null);

    if (!user) {
      setServerError("Sua sessão expirou. Entre novamente.");
      return;
    }

    const product = products.find((item) => item.id === data.productId);
    if (!product) {
      setError("productId", { message: "Selecione um produto válido" });
      return;
    }

    if (!hasValidStockPrecision(data.quantityInBaseUnit, product.unit)) {
      setError("quantityInBaseUnit", {
        message:
          product.unit === "kilogram"
            ? "Use no máximo três casas decimais"
            : "Use uma quantidade inteira para este produto",
      });
      return;
    }

    try {
      await registerStockMovement(
        { ...data, idempotencyKey: crypto.randomUUID() },
        user.id,
      );
      const [updatedProducts, updatedMovements] = await Promise.all([
        listProducts(),
        listStockMovements(),
      ]);
      setProducts(updatedProducts);
      setMovements(updatedMovements);
      setSuccessMessage(
        data.type === "entry"
          ? "Entrada registrada com sucesso."
          : "Saída registrada com sucesso.",
      );
      reset({
        productId: data.productId,
        type: data.type,
        quantityInBaseUnit: 0,
        saleValue:
          data.type === "exit" ? product.priceInCents / 100 : 0,
        reason: "",
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-semibold text-brand-600">Estoque</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          Movimentações
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Registre entradas e saídas com atualização automática do estoque.
        </p>
      </div>

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[0.9fr_1.35fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className={`rounded-xl p-2.5 ${selectedType === "entry" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
              {selectedType === "entry" ? (
                <ArrowDownToLine className="size-5" />
              ) : (
                <ArrowUpFromLine className="size-5" />
              )}
            </span>
            <div>
              <h2 className="font-bold text-stone-900">Novo lançamento</h2>
              <p className="text-xs text-stone-500">
                A quantidade no estoque é atualizada automaticamente.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-stone-500">
              <LoaderCircle className="size-5 animate-spin text-brand-600" />
              Carregando produtos...
            </div>
          ) : serverError && products.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-5 text-center">
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {serverError}
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
                <Boxes className="size-7" />
              </span>
              <p className="mt-4 text-sm font-semibold text-stone-700">
                Cadastre um produto primeiro
              </p>
              <Link
                href="/products/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"
              >
                <PackagePlus className="size-4" /> Novo produto
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <input type="hidden" {...register("type")} />
              <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => changeMovementType("entry")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${selectedType === "entry" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                >
                  <ArrowDownToLine className="size-4" /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => changeMovementType("exit")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${selectedType === "exit" ? "bg-white text-orange-700 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
                >
                  <ArrowUpFromLine className="size-4" /> Saída
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="movement-product" className="text-sm font-semibold text-stone-700">
                  Produto
                </label>
                <select
                  id="movement-product"
                  className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3.5 text-sm text-stone-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                  {...register("productId")}
                >
                  <option value="">Selecione um produto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — estoque {formatStock(product.currentStock, product.unit)}
                    </option>
                  ))}
                </select>
                {errors.productId?.message && (
                  <p className="text-xs font-medium text-red-600">
                    {errors.productId.message}
                  </p>
                )}
              </div>

              <Input
                id="movement-quantity"
                label={`Quantidade${selectedProduct ? ` (${baseUnitLabels[selectedProduct.unit]})` : ""}`}
                type="number"
                min={selectedProduct?.unit === "kilogram" ? 0.001 : 1}
                step={selectedProduct?.unit === "kilogram" ? "0.001" : "1"}
                placeholder={selectedProduct?.unit === "kilogram" ? "Ex.: 0,5" : "Ex.: 10"}
                error={errors.quantityInBaseUnit?.message}
                {...register("quantityInBaseUnit", { valueAsNumber: true })}
              />

              {selectedProduct && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                  <p className="text-xs font-semibold text-stone-500">Quantidade no estoque</p>
                  <p className="mt-1 text-lg font-bold text-stone-900">
                    {formatStock(selectedProduct.currentStock, selectedProduct.unit)}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    Unidade de controle: {unitLabels[selectedProduct.unit]} ({baseUnitLabels[selectedProduct.unit]})
                  </p>
                </div>
              )}

              {selectedType === "exit" && (
                <Input
                  id="movement-sale-value"
                  label="Valor total da venda (R$)"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Ex.: 35,90"
                  helperText="Informe o valor total recebido por esta saída."
                  error={errors.saleValue?.message}
                  {...register("saleValue", { valueAsNumber: true })}
                />
              )}

              <Input
                id="movement-reason"
                label="Motivo"
                placeholder={selectedType === "entry" ? "Ex.: Compra de fornecedor" : "Ex.: Venda no balcão"}
                error={errors.reason?.message}
                {...register("reason")}
              />

              {serverError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {serverError}
                </p>
              )}
              {successMessage && (
                <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="size-4" /> {successMessage}
                </p>
              )}

              <Button
                type="submit"
                isLoading={isSubmitting}
                loadingText="Registrando..."
                iconLeft={selectedType === "entry" ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
                className="w-full"
              >
                {selectedType === "entry" ? "Registrar entrada" : "Registrar saída"}
              </Button>
            </form>
          )}
        </section>

        <MovementHistory
          movements={visibleMovements}
          loading={loading}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </div>
  );
}

function MovementHistory({
  movements,
  loading,
  filter,
  onFilterChange,
}: {
  movements: StockMovement[];
  loading: boolean;
  filter: MovementFilter;
  onFilterChange: (filter: MovementFilter) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-stone-900">Histórico</h2>
          <p className="mt-1 text-xs text-stone-500">Últimos 100 lançamentos registrados.</p>
        </div>
        <div className="flex rounded-xl bg-stone-100 p-1">
          {(["all", "entry", "exit"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === option ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              {option === "all" ? "Todas" : option === "entry" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-stone-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Carregando histórico...
        </div>
      ) : movements.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
          <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
            <ClipboardList className="size-7" />
          </span>
          <p className="mt-4 text-sm font-semibold text-stone-700">
            Nenhuma movimentação encontrada
          </p>
          <p className="mt-1 text-xs text-stone-400">
            Os lançamentos aparecerão aqui após o primeiro registro.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          {movements.map((movement) => (
            <MovementItem key={movement.id} movement={movement} />
          ))}
        </div>
      )}
    </section>
  );
}

function MovementItem({ movement }: { movement: StockMovement }) {
  const entry = movement.type === "entry";
  return (
    <article className="flex items-start gap-3 p-4 sm:p-5">
      <span className={`rounded-xl p-2.5 ${entry ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
        {entry ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="truncate text-sm font-semibold text-stone-800">
            {movement.productName}
          </p>
          <p className={`text-sm font-bold ${entry ? "text-emerald-700" : "text-orange-700"}`}>
            {entry ? "+" : "−"}
            {formatStock(movement.quantityInBaseUnit, movement.productUnit)}
          </p>
        </div>
        <p className="mt-1 text-xs text-stone-500">{movement.reason}</p>
        {!entry && movement.saleValueInCents !== null && (
          <p className="mt-1 text-xs font-semibold text-stone-700">
            Valor da venda: {formatCurrency(movement.saleValueInCents)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
          <span>{formatMovementDate(movement.createdAt)}</span>
          <span>
            Estoque: {formatStock(movement.previousStock, movement.productUnit)} → {formatStock(movement.resultingStock, movement.productUnit)}
          </span>
        </div>
      </div>
    </article>
  );
}

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof InventoryServiceError
    ? error.message
    : "Não foi possível concluir a operação.";
}
