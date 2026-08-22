import Link from "next/link";
import {
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  WalletCards,
} from "lucide-react";

import { logoutAction } from "@/actions/auth.action";
import { BrandLogo } from "@/components/brand/brand-logo";
import { requireUser } from "@/lib/auth/session";

const futureNavigation = [
  { label: "Produtos", icon: PackageSearch },
  { label: "Movimentações", icon: Boxes },
  { label: "Financeiro", icon: WalletCards },
  { label: "Relatórios", icon: ChartNoAxesCombined },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-stone-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-stone-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-24 items-center border-b border-stone-100 px-6">
          <BrandLogo className="w-32" />
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="Menu principal">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-700"
          >
            <LayoutDashboard className="size-5" />
            Visão geral
          </Link>

          {futureNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <span
                key={item.label}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-400"
              >
                <Icon className="size-5" />
                {item.label}
                <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-stone-300">
                  em breve
                </span>
              </span>
            );
          })}
        </nav>

        <div className="border-t border-stone-100 p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-stone-800">
              Administrador
            </p>
            <p className="truncate text-xs text-stone-400">{user.email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur sm:px-8 lg:px-10">
          <BrandLogo className="w-28 lg:hidden" />
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-stone-800">
              Controle do empório
            </p>
            <p className="text-xs text-stone-400">Estoque e movimentações</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500" />
            Online
          </span>
        </header>

        <main className="p-4 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
