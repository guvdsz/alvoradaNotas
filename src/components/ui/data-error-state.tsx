"use client";

import { CircleAlert, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function DataErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center",
        className,
      )}
    >
      <span className="rounded-2xl bg-red-50 p-4 text-red-700">
        <CircleAlert className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 font-bold text-stone-900">
        Não foi possível carregar os dados
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
        {message}
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={onRetry}
        iconLeft={<RotateCw className="size-4" />}
        className="mt-5"
      >
        Tentar novamente
      </Button>
    </div>
  );
}
