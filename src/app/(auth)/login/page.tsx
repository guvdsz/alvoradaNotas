import type { Metadata } from "next";
import { Settings2 } from "lucide-react";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/features/auth/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage() {
  const configured = isSupabaseConfigured();
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="mb-8 text-center lg:text-left">
        <BrandLogo className="mx-auto mb-5 w-36 lg:hidden" />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-600">
          Área administrativa
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
          Boas-vindas
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          Entre com seu e-mail para acessar o controle do empório.
        </p>
      </div>

      {!configured && (
        <div className="mb-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <Settings2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">
              Supabase ainda não configurado
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              Copie <code>.env.example</code> para <code>.env.local</code> e
              informe as credenciais do projeto.
            </p>
          </div>
        </div>
      )}

      <LoginForm configured={configured} />

      <p className="mt-8 text-center text-xs leading-5 text-stone-400">
        Acesso restrito a pessoas autorizadas pelo empório.
      </p>
    </>
  );
}
