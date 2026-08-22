import { CheckCircle2 } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";

const benefits = [
  "Entradas e saídas com histórico",
  "Controle de produtos por peso ou unidade",
  "Visão rápida do estoque da loja",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-cream-50 px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute -left-28 -top-24 size-80 rounded-full bg-brand-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 size-96 rounded-full bg-yellow-200/45 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_80px_rgba(120,78,18,0.14)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-[650px] flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-12 text-white lg:flex">
          <BrandLogo className="w-40 rounded-2xl bg-white/95 p-2 shadow-sm" />

          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-yellow-100">
              Gestão simples para o dia a dia
            </p>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
              O estoque do empório organizado em um só lugar.
            </h1>
            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-5 text-yellow-200" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-orange-100">
            Empório Laticínios Alvorada
          </p>
        </section>

        <section className="flex min-h-[600px] items-center px-6 py-10 sm:px-12 lg:min-h-[650px]">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </section>
      </div>
    </main>
  );
}
