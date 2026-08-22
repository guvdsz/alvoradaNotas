"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  loginSchema,
  type LoginSchema,
} from "@/features/auth/schemas/auth.schema";
import {
  AuthenticationError,
  login,
} from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  async function onSubmit(data: LoginSchema) {
    setServerError(null);

    try {
      await login(data);
      router.replace("/dashboard");
    } catch (error) {
      setServerError(
        error instanceof AuthenticationError
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="seu@email.com"
        icon={<Mail size={18} />}
        error={errors.email?.message}
        disabled={!configured}
        {...register("email")}
      />

      <Input
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Digite sua senha"
        icon={<LockKeyhole size={18} />}
        error={errors.password?.message}
        disabled={!configured}
        {...register("password")}
      />

      {serverError && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-medium text-red-700"
        >
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        isLoading={isSubmitting}
        loadingText="Entrando..."
        iconRight={<ArrowRight size={18} />}
        disabled={!configured}
        className="mt-1 w-full"
      >
        Entrar
      </Button>
    </form>
  );
}
