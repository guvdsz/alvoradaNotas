"use client";

import {
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from "firebase/auth";

import type { LoginSchema } from "@/features/auth/schemas/auth.schema";
import { getFirebaseAuth } from "@/lib/firebase/client";

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

function getAuthenticationMessage(error: AuthError) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-disabled":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente novamente.";
    case "auth/network-request-failed":
      return "Sem conexão. Verifique sua internet.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

export async function login(input: LoginSchema) {
  try {
    await signInWithEmailAndPassword(
      getFirebaseAuth(),
      input.email,
      input.password,
    );
  } catch (error) {
    console.error("[Auth] Não foi possível autenticar o usuário.", error);
    throw new AuthenticationError(getAuthenticationMessage(error as AuthError));
  }
}

export async function logout() {
  await signOut(getFirebaseAuth());
}
