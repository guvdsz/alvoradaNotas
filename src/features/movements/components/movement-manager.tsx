"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackagePlus,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { DataErrorState } from "@/components/ui/data-error-state";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import {
  stockMovementFormSchema,
  type StockMovementFormSchema,
} from "@/features/movements/schemas/movement.schema";
import {
  listStockMovements,
  MovementServiceError,
  registerStockMovement,
} from "@/features/movements/services/movement.service";
import {
  MovementFormSkeleton,
  MovementHistorySkeleton,
  MovementManagerSkeleton,
} from "@/features/movements/components/movement-manager-skeleton";
import type { StockMovement } from "@/features/movements/types/movement";
import { calculateSuggestedSaleValue } from "@/features/movements/utils/sale-value";
import { hasValidStockPrecision } from "@/features/movements/utils/stock-math";
import { listProducts } from "@/features/products/services/product.service";
import type { Product } from "@/features/products/types/product";
import {
  baseUnitLabels,
  formatStock,
  unitLabels,
} from "@/features/products/utils/product-formatters";
import { formatCurrency } from "@/lib/utils/formatters";

const defaultValues: StockMovementFormSchema = {
  productId: "",
  type: "entry",
  quantityInBaseUnit: 0,
  saleValue: 0,
  reason: "",
};

type MovementFilter = "all" | "entry" | "exit";

type SubmissionAttempt = {
  fingerprint: string;
  idempotencyKey: string;
};

export function MovementManager({
  initialType = "entry",
}: {
  initialType?: "entry" | "exit";
}) {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [movementsError, setMovementsError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MovementFilter>("all");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const productsRequestId = useRef(0);
  const movementsRequestId = useRef(0);
  const submissionAttempt = useRef<SubmissionAttempt | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    resetField,
    clearErrors,
    setError,
    setValue,
    control,
    formState: { dirtyFields, errors, isSubmitting },
  } = useForm<StockMovementFormSchema>({
    resolver: zodResolver(stockMovementFormSchema),
    mode: "onChange",
    defaultValues: { ...defaultValues, type: initialType },
  });
  const selectedProductId = useWatch({ control, name: "productId" });
  const selectedType = useWatch({ control, name: "type" });
  const selectedQuantity = useWatch({
    control,
    name: "quantityInBaseUnit",
  });
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId,
  );
  const suggestedSaleValue = useMemo(
    () =>
      calculateSuggestedSaleValue(
        selectedProduct?.priceInCents ?? 0,
        selectedQuantity,
      ),
    [selectedProduct?.priceInCents, selectedQuantity],
  );
  const pricingContext = `${selectedType}:${selectedProductId}`;
  const previousPricingContext = useRef(pricingContext);

  useEffect(() => {
    const contextChanged = previousPricingContext.current !== pricingContext;
    previousPricingContext.current = pricingContext;
    const nextValue = selectedType === "exit" ? suggestedSaleValue : 0;

    if (contextChanged) {
      resetField("saleValue", { defaultValue: nextValue });
      return;
    }

    if (!dirtyFields.saleValue) {
      setValue("saleValue", nextValue, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [
    dirtyFields.saleValue,
    pricingContext,
    resetField,
    selectedType,
    setValue,
    suggestedSaleValue,
  ]);

  const loadProducts = useCallback(async () => {
    const requestId = ++productsRequestId.current;
    setProductsLoading(true);
    setProductsError(null);

    try {
      const loadedProducts = await listProducts();
      if (productsRequestId.current === requestId) {
        setProducts(loadedProducts);
      }
    } catch (error) {
      if (productsRequestId.current === requestId) {
        setProductsError(getErrorMessage(error));
      }
    } finally {
      if (productsRequestId.current === requestId) {
        setProductsLoading(false);
      }
    }
  }, []);

  const loadMovements = useCallback(async () => {
    const requestId = ++movementsRequestId.current;
    setMovementsLoading(true);
    setMovementsError(null);

    try {
      const loadedMovements = await listStockMovements();
      if (movementsRequestId.current === requestId) {
        setMovements(loadedMovements);
      }
    } catch (error) {
      if (movementsRequestId.current === requestId) {
        setMovementsError(getErrorMessage(error));
      }
    } finally {
      if (movementsRequestId.current === requestId) {
        setMovementsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      void loadProducts();
      void loadMovements();
    });

    return () => {
      active = false;
      productsRequestId.current += 1;
      movementsRequestId.current += 1;
    };
  }, [loadMovements, loadProducts]);

  const visibleMovements = useMemo(
    () =>
      filter === "all"
        ? movements
        : movements.filter((movement) => movement.type === filter),
    [filter, movements],
  );

  function changeMovementType(type: "entry" | "exit") {
    if (type === selectedType) return;

    setSubmitError(null);
    setSuccessMessage(null);
    clearErrors();
    setValue("type", type, { shouldDirty: true, shouldValidate: false });
    resetField("saleValue", {
      defaultValue: type === "exit" ? suggestedSaleValue : 0,
    });
  }

  async function onSubmit(data: StockMovementFormSchema) {
    setSubmitError(null);
    setSuccessMessage(null);

    if (!user) {
      setSubmitError("Sua sessão expirou. Entre novamente.");
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
      const fingerprint = createSubmissionFingerprint(data);
      if (submissionAttempt.current?.fingerprint !== fingerprint) {
        submissionAttempt.current = {
          fingerprint,
          idempotencyKey: crypto.randomUUID(),
        };
      }
      const currentAttempt = submissionAttempt.current;

      const result = await registerStockMovement(
        {
          ...data,
          idempotencyKey: currentAttempt.idempotencyKey,
        },
        user.id,
      );

      submissionAttempt.current = null;
      setProducts((current) =>
        current.map((item) =>
          item.id === result.movement.productId
            ? { ...item, currentStock: result.resultingStock }
            : item,
        ),
      );
      setMovements((current) =>
        [
          result.movement,
          ...current.filter((item) => item.id !== result.movement.id),
        ].slice(0, 100),
      );
      setSuccessMessage(
        result.movement.type === "entry"
          ? "Entrada registrada com sucesso."
          : "Saída registrada com sucesso.",
      );
      reset({
        productId: result.movement.productId,
        type: result.movement.type,
        quantityInBaseUnit: 0,
        saleValue: result.movement.type === "exit" ? product.priceInCents / 100 : 0,
        reason: "",
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  }

  if (productsLoading && movementsLoading) {
    return <MovementManagerSkeleton />;
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
        {productsLoading ? (
          <MovementFormSkeleton />
        ) : (
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

          {productsError ? (
            <DataErrorState
              message={productsError}
              onRetry={() => void loadProducts()}
              className="min-h-72"
            />
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
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                <PackagePlus className="size-4" /> Novo produto
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(event) => void handleSubmit(onSubmit)(event)}
              aria-busy={isSubmitting}
              className="mt-6"
            >
              <fieldset
                disabled={isSubmitting}
                className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-80"
              >
              <input type="hidden" {...register("type")} />
              <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => changeMovementType("entry")}
                  aria-pressed={selectedType === "entry"}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset ${selectedType === "entry" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
                >
                  <ArrowDownToLine className="size-4" /> Entrada
                </button>
                <button
                  type="button"
                  onClick={() => changeMovementType("exit")}
                  aria-pressed={selectedType === "exit"}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset ${selectedType === "exit" ? "bg-white text-orange-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
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
                  aria-invalid={Boolean(errors.productId)}
                  aria-describedby={
                    errors.productId ? "movement-product-error" : undefined
                  }
                  className="h-12 w-full rounded-xl border border-stone-500 bg-white px-3.5 text-base text-stone-900 outline-none transition focus:border-brand-700 focus:ring-2 focus:ring-brand-200 sm:text-sm"
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
                  <p
                    id="movement-product-error"
                    className="text-xs font-medium text-red-700"
                  >
                    {errors.productId.message}
                  </p>
                )}
              </div>

              <Input
                id="movement-quantity"
                label={`Quantidade${selectedProduct ? ` (${baseUnitLabels[selectedProduct.unit]})` : ""}`}
                type="number"
                inputMode="decimal"
                min={selectedProduct?.unit === "kilogram" ? 0.001 : 1}
                max={1_000_000_000}
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
                  <p className="mt-1 text-xs text-stone-600">
                    Unidade de controle: {unitLabels[selectedProduct.unit]} ({baseUnitLabels[selectedProduct.unit]})
                  </p>
                </div>
              )}

              {selectedType === "exit" && (
                <Input
                  id="movement-sale-value"
                  label="Valor total da venda (R$)"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={10_000_000}
                  step="0.01"
                  placeholder="Ex.: 35,90"
                  helperText={`Sugestão pela quantidade: ${formatCurrency(Math.round(suggestedSaleValue * 100))}. Você pode alterar.`}
                  error={errors.saleValue?.message}
                  {...register("saleValue", { valueAsNumber: true })}
                />
              )}

              <Input
                id="movement-reason"
                label="Motivo"
                maxLength={240}
                placeholder={selectedType === "entry" ? "Ex.: Compra de fornecedor" : "Ex.: Venda no balcão"}
                error={errors.reason?.message}
                {...register("reason")}
              />

              {submitError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {submitError}
                </p>
              )}
              {successMessage && (
                <p role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
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
              </fieldset>
            </form>
          )}
        </section>
        )}

        <MovementHistory
          movements={visibleMovements}
          loading={movementsLoading}
          error={movementsError}
          filter={filter}
          onFilterChange={setFilter}
          onRetry={() => void loadMovements()}
        />
      </div>
    </div>
  );
}

function MovementHistory({
  movements,
  loading,
  error,
  filter,
  onFilterChange,
  onRetry,
}: {
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  filter: MovementFilter;
  onFilterChange: (filter: MovementFilter) => void;
  onRetry: () => void;
}) {
  if (loading) {
    return <MovementHistorySkeleton />;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-stone-900">Histórico</h2>
          <p className="mt-1 text-xs text-stone-500">Últimos 100 lançamentos registrados.</p>
        </div>
        <div
          className="flex rounded-xl bg-stone-100 p-1"
          aria-label="Filtrar histórico"
        >
          {(["all", "entry", "exit"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onFilterChange(option)}
              aria-pressed={filter === option}
              className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset ${filter === option ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
            >
              {option === "all" ? "Todas" : option === "entry" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <DataErrorState
          message={error}
          onRetry={onRetry}
          className="min-h-96"
        />
      ) : movements.length === 0 ? (
        <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
          <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
            <ClipboardList className="size-7" />
          </span>
          <p className="mt-4 text-sm font-semibold text-stone-700">
            Nenhuma movimentação encontrada
          </p>
          <p className="mt-1 text-xs text-stone-600">
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
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
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

function createSubmissionFingerprint(data: StockMovementFormSchema) {
  return JSON.stringify([
    data.productId,
    data.type,
    data.quantityInBaseUnit,
    data.saleValue,
    data.reason.trim(),
  ]);
}

function getErrorMessage(error: unknown) {
  return error instanceof MovementServiceError
    ? error.message
    : "Não foi possível concluir a operação.";
}
