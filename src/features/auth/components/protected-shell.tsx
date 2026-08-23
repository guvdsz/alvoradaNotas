"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
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
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/products", icon: PackageSearch },
  { label: "Categorias", href: "/categories", icon: Tags },
  { label: "Movimentações", href: "/movements", icon: Boxes },
  { label: "Financeiro", href: "/finance", icon: WalletCards },
];

function NavigationItems({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return navigation.map((item) => {
    const Icon = item.icon;
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
          active
            ? "bg-brand-50 text-brand-700"
            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
        )}
      >
        <Icon className="size-5" />
        {item.label}
      </Link>
    );
  });
}

function AccessLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream-50">
      <div className="flex items-center gap-3 text-sm font-medium text-stone-600">
        <LoaderCircle className="size-5 animate-spin text-brand-600" />
        Verificando acesso...
      </div>
    </div>
  );
}

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    setMobileMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (status !== "authenticated" || !user) {
    return <AccessLoading />;
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-[2px]"
          />
          <aside
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            className="relative flex h-full w-[min(20rem,88vw)] flex-col border-r border-stone-200 bg-white shadow-2xl"
          >
            <div className="flex h-20 items-center justify-between border-b border-stone-100 px-5">
              <BrandWordmark size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex size-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              <NavigationItems
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
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
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-stone-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-24 items-center border-b border-stone-100 px-6">
          <BrandWordmark size="md" />
        </div>
        <nav className="flex-1 space-y-1 p-4" aria-label="Menu principal">
          <NavigationItems pathname={pathname} />
        </nav>
        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-stone-800">Administrador</p>
          </div>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
            {isLoggingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />} Sair
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              aria-controls="mobile-navigation"
              aria-expanded={mobileMenuOpen}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 shadow-sm transition hover:bg-stone-50 hover:text-stone-900"
            >
              <Menu className="size-5" />
            </button>
            <BrandWordmark size="sm" className="hidden min-[400px]:inline-flex" />
            <span className="truncate text-sm font-extrabold text-stone-900 min-[400px]:hidden">
              Alvorada
            </span>
          </div>
          <div className="hidden lg:block"><p className="text-sm font-semibold text-stone-800">Controle do empório</p><p className="text-xs text-stone-400">Estoque e movimentações</p></div>
          <ConnectionStatus />
        </header>
        <main className="min-w-0 overflow-x-hidden p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
