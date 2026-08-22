"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import { loginAction } from "@/actions/auth.action";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginSchema, type LoginSchema } from "@/lib/schemas/auth.schema";

export function LoginForm({ configured }: { configured: boolean }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  async function onSubmit(data: LoginSchema) {
    setServerError(null);
    const result = await loginAction(data);

    if (!result.success) {
      setServerError(result.error);
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
