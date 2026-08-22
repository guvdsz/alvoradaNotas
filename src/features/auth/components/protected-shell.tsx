"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PackageSearch,
  WalletCards,
} from "lucide-react";

import { BrandWordmark } from "@/components/brand/brand-wordmark";
import { logout } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { cn } from "@/lib/utils/cn";

const navigation = [
  { label: "Visão geral", href: "/dashboard", icon: LayoutDashboard },
  { label: "Produtos", href: "/products", icon: PackageSearch, disabled: true },
  { label: "Movimentações", href: "/movements", icon: Boxes, disabled: true },
  { label: "Financeiro", href: "/finance", icon: WalletCards, disabled: true },
  { label: "Relatórios", href: "/reports", icon: ChartNoAxesCombined, disabled: true },
];

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
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  async function handleLogout() {
    setIsLoggingOut(true);
    await logout();
    router.replace("/login");
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
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            if (item.disabled) {
              return (
                <span key={item.href} aria-disabled="true" className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-400">
                  <Icon className="size-5" />{item.label}
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-stone-300">em breve</span>
                </span>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition", active ? "bg-brand-50 text-brand-700" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900")}>
                <Icon className="size-5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-stone-800">Administrador</p>
            <p className="truncate text-xs text-stone-400">{user.email}</p>
          </div>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50">
            {isLoggingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />} Sair
          </button>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur sm:px-8 lg:px-10">
          <BrandWordmark size="sm" className="lg:hidden" />
          <div className="hidden lg:block"><p className="text-sm font-semibold text-stone-800">Controle do empório</p><p className="text-xs text-stone-400">Estoque e movimentações</p></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />Online</span>
        </header>
        <main className="p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
