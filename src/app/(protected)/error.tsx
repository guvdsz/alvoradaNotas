"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, House } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Aplicação] Falha inesperada em uma área protegida.", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center py-6">
      <section
        role="alert"
        className="w-full rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm sm:p-8"
      >
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-stone-900">
          Não foi possível carregar esta página
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
          Tente novamente. Se o problema continuar, verifique sua conexão e
          recarregue a aplicação.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            <House className="size-4" aria-hidden="true" />
            Ir para a visão geral
          </Link>
          <Button type="button" onClick={reset}>
            Tentar novamente
          </Button>
        </div>
      </section>
    </div>
  );
}
