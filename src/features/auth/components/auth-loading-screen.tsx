"use client";

import { LoaderCircle } from "lucide-react";

import { useAuthStore } from "@/features/auth/stores/auth-store";

export function AuthLoadingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const status = useAuthStore((state) => state.status);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50">
        <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Verificando acesso...
        </div>
      </div>
    );
  }

  return children;
}
