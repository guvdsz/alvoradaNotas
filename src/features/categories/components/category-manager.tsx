"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderOpen, LoaderCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { DataErrorState } from "@/components/ui/data-error-state";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { CategoryManagerSkeleton } from "@/features/categories/components/category-manager-skeleton";
import {
  categorySchema,
  type CategorySchema,
} from "@/features/categories/schemas/category.schema";
import {
  CategoryServiceError,
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "@/features/categories/services/category.service";
import type { Category } from "@/features/categories/types/category";

export function CategoryManager() {
  const user = useAuthStore((state) => state.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CategorySchema>({
    resolver: zodResolver(categorySchema),
    mode: "onChange",
    defaultValues: { name: "" },
  });

  useEffect(() => {
    let mounted = true;
    void listCategories()
      .then((items) => {
        if (mounted) setCategories(items);
      })
      .catch((error) => {
        if (mounted) setLoadError(getErrorMessage(error));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [reloadKey]);

  function retryLoading() {
    setServerError(null);
    setLoadError(null);
    setLoading(true);
    setReloadKey((current) => current + 1);
  }

  async function onSubmit(data: CategorySchema) {
    if (!user) {
      setServerError("Sua sessão expirou. Entre novamente.");
      return;
    }

    setServerError(null);
    try {
      if (editingId) {
        await updateCategory(editingId, data);
        setCategories((current) =>
          sortCategories(
            current.map((category) =>
              category.id === editingId
                ? { ...category, name: data.name }
                : category,
            ),
          ),
        );
      } else {
        const category = await createCategory(data, user.id);
        setCategories((current) => sortCategories([...current, category]));
      }
      cancelEditing();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  function startEditing(category: Category) {
    setServerError(null);
    setEditingId(category.id);
    reset({ name: category.name });
    window.setTimeout(() => setFocus("name"), 0);
  }

  function cancelEditing() {
    setServerError(null);
    setEditingId(null);
    reset({ name: "" });
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;

    const category = categoryToDelete;
    setDeletingId(category.id);
    setServerError(null);
    try {
      await deleteCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      if (editingId === category.id) cancelEditing();
      setCategoryToDelete(null);
    } catch (error) {
      setServerError(getErrorMessage(error));
      setCategoryToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <CategoryManagerSkeleton />;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-semibold text-brand-600">Catálogo</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          Categorias
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Organize os produtos em grupos que podem ser reutilizados.
        </p>
      </div>

      {loadError ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
          <DataErrorState message={loadError} onRetry={retryLoading} />
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-stone-300 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
            {editingId ? <Pencil className="size-5" /> : <Plus className="size-5" />}
          </span>
          <div>
            <h2 className="font-bold text-stone-900">
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>
            <p className="text-xs text-stone-500">
              Use nomes curtos, como Queijos, Bebidas ou Mercearia.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-end"
        >
          <div className="w-full flex-1">
            <Input
              id="category-name"
              label="Nome da categoria"
              placeholder="Ex.: Queijos"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            {editingId && (
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEditing}
                iconLeft={<X className="size-4" />}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Salvando..."
              iconLeft={editingId ? <Save className="size-4" /> : <Plus className="size-4" />}
              className="flex-1 sm:flex-none"
            >
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
          </section>

          {serverError && (
            <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {serverError}
            </p>
          )}

          <section className="mt-6 overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4">
          <h2 className="font-bold text-stone-900">Categorias cadastradas</h2>
          <p className="mt-1 text-xs text-stone-500">
            Uma categoria em uso por algum produto não pode ser excluída.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
              <FolderOpen className="size-7" />
            </span>
            <p className="mt-4 text-sm font-semibold text-stone-700">
              Nenhuma categoria cadastrada
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Cadastre a primeira categoria no formulário acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-4 px-5 py-4">
                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700" aria-hidden="true">
                  <FolderOpen className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                  {category.name}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEditing(category)}
                    aria-label={`Editar ${category.name}`}
                    className="inline-flex size-11 items-center justify-center rounded-xl text-stone-600 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerError(null);
                      setCategoryToDelete(category);
                    }}
                    disabled={deletingId !== null}
                    aria-label={`Excluir ${category.name}`}
                    className="inline-flex size-11 items-center justify-center rounded-xl text-stone-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === category.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </section>

          <ConfirmationDialog
            open={categoryToDelete !== null}
            title={`Excluir a categoria “${categoryToDelete?.name ?? ""}”?`}
            description="Essa ação não pode ser desfeita. Categorias vinculadas a produtos não podem ser excluídas."
            confirmLabel="Excluir categoria"
            isLoading={deletingId !== null}
            loadingLabel="Excluindo..."
            onConfirm={() => void confirmDelete()}
            onOpenChange={(open) => {
              if (!open && deletingId === null) setCategoryToDelete(null);
            }}
          />
        </>
      )}
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof CategoryServiceError
    ? error.message
    : "Não foi possível concluir a operação.";
}

function sortCategories(categories: Category[]) {
  return [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}
