"use client";

import { FirebaseError } from "firebase/app";
import { Timestamp } from "firebase/firestore";

export class DataServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataServiceError";
  }
}

export function handleDataServiceError(
  scope: string,
  error: unknown,
  fallback: string,
): never {
  if (error instanceof DataServiceError) {
    throw error;
  }

  console.error(
    error instanceof FirebaseError
      ? `[${scope}] Falha no serviço de dados (${error.code}).`
      : `[${scope}] Falha inesperada no serviço de dados.`,
    error,
  );

  throw new DataServiceError(fallback);
}

export function firestoreDateToIso(value: unknown) {
  return value instanceof Timestamp
    ? value.toDate().toISOString()
    : new Date().toISOString();
}
