"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderOpen, LoaderCircle, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/features/auth/stores/auth-store";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        if (mounted) setServerError(getErrorMessage(error));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    setEditingId(category.id);
    reset({ name: category.name });
    window.setTimeout(() => setFocus("name"), 0);
  }

  function cancelEditing() {
    setEditingId(null);
    reset({ name: "" });
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;

    setDeletingId(category.id);
    setServerError(null);
    try {
      await deleteCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      if (editingId === category.id) cancelEditing();
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
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

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
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

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-bold text-stone-900">Categorias cadastradas</h2>
          <p className="mt-1 text-xs text-stone-500">
            Uma categoria em uso por algum produto não pode ser excluída.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-52 items-center justify-center gap-3 text-sm font-medium text-stone-500">
            <LoaderCircle className="size-5 animate-spin text-brand-600" />
            Carregando categorias...
          </div>
        ) : categories.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
            <span className="rounded-2xl bg-stone-100 p-4 text-stone-400">
              <FolderOpen className="size-7" />
            </span>
            <p className="mt-4 text-sm font-semibold text-stone-700">
              Nenhuma categoria cadastrada
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Cadastre a primeira categoria no formulário acima.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-4 px-5 py-4">
                <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
                  <FolderOpen className="size-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                  {category.name}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEditing(category)}
                    aria-label={`Editar ${category.name}`}
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    aria-label={`Excluir ${category.name}`}
                    className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
