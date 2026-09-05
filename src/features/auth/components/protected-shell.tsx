"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PackageSearch,
  Tags,
  WalletCards,
  X,
} from "lucide-react";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { ConnectionStatus } from "@/components/ui/connection-status";
import { logout } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { cn } from "@/lib/utils/cn";

const navigation = [
  {
    label: "Visão geral",
    mobileLabel: "Início",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produtos",
    mobileLabel: "Produtos",
    href: "/products",
    icon: PackageSearch,
  },
  {
    label: "Categorias",
    mobileLabel: "Categorias",
    href: "/categories",
    icon: Tags,
  },
  {
    label: "Movimentações",
    mobileLabel: "Movimentações",
    href: "/movements",
    icon: Boxes,
  },
  {
    label: "Financeiro",
    mobileLabel: "Financeiro",
    href: "/finance",
    icon: WalletCards,
  },
];

const mobileNavigation = navigation.filter(
  (item) => item.href !== "/categories",
);

function NavigationItems({ pathname }: { pathname: string }) {
  return navigation.map((item) => {
    const Icon = item.icon;
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset",
          active
            ? "bg-brand-50 text-brand-700"
            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
        {item.label}
      </Link>
    );
  });
}

function AccessLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-cream-50"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
        <LoaderCircle
          className="size-5 animate-spin text-brand-600"
          aria-hidden="true"
        />
        Verificando acesso...
      </div>
    </div>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  async function handleLogout() {
    setLogoutError(null);
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("[Auth] Não foi possível encerrar a sessão.", error);
      setLogoutError(
        "Não foi possível sair agora. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (status !== "authenticated" || !user) {
    return <AccessLoading />;
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-stone-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-24 items-center border-b border-stone-100 px-6">
          <BrandWordmark size="md" />
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Menu principal">
          <NavigationItems pathname={pathname} />
        </nav>
        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-stone-800">
              Administrador
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingOut ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <LogOut className="size-4" aria-hidden="true" />
            )}
            Sair
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="safe-area-header sticky top-0 z-10 flex items-center justify-between border-b border-stone-300/80 bg-white/95 px-4 backdrop-blur sm:px-8 lg:h-20 lg:px-10 lg:pt-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-800">
              Controle do empório
            </p>
            <p className="hidden text-xs text-stone-600 lg:block">
              Estoque e movimentações
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ConnectionStatus />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sair"
              title="Sair"
              className="inline-flex size-11 items-center justify-center rounded-xl text-stone-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
            >
              {isLoggingOut ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <LogOut className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </header>
        {logoutError && (
          <div
            role="alert"
            className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 sm:mx-8 lg:mx-10"
          >
            <p className="min-w-0 flex-1">{logoutError}</p>
            <button
              type="button"
              onClick={() => setLogoutError(null)}
              aria-label="Fechar aviso"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <main className="min-w-0 overflow-x-hidden p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:p-8 sm:pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:p-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Navegação rápida"
        className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-stone-300 bg-white/95 px-1 pt-1 shadow-[0_-10px_30px_rgba(41,37,36,0.08)] backdrop-blur lg:hidden"
      >
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="w-full truncate text-center">
                {item.mobileLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
