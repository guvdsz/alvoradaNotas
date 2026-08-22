"use server";

import { redirect } from "next/navigation";

import { loginSchema, type LoginSchema } from "@/lib/schemas/auth.schema";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAction(
  input: LoginSchema,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados de acesso inválidos.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: "Configure as credenciais do Supabase no arquivo .env.local.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
