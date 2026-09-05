"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    let currentRequest: AbortController | null = null;

    async function verifyConnection() {
      currentRequest?.abort();

      if (!window.navigator.onLine) {
        if (mounted) setIsOnline(false);
        return;
      }

      const controller = new AbortController();
      currentRequest = controller;
      const timeout = window.setTimeout(() => controller.abort(), 5_000);

      try {
        const response = await fetch(`/icon.svg?connection-check=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });

        if (mounted && currentRequest === controller) {
          setIsOnline(response.ok);
        }
      } catch {
        if (mounted && currentRequest === controller) {
          setIsOnline(false);
        }
      } finally {
        window.clearTimeout(timeout);
        if (currentRequest === controller) currentRequest = null;
      }
    }

    function handleOnline() {
      void verifyConnection();
    }

    function handleOffline() {
      currentRequest?.abort();
      currentRequest = null;
      if (mounted) setIsOnline(false);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void verifyConnection();
      }
    }

    void verifyConnection();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void verifyConnection();
      }
    }, 60_000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      currentRequest?.abort();
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const label =
    isOnline === null ? "Verificando" : isOnline ? "Online" : "Offline";

  return (
    <span
      aria-live="polite"
      title={`Estado da conexão: ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold sm:px-3",
        isOnline === null && "bg-stone-100 text-stone-500",
        isOnline === true && "bg-emerald-50 text-emerald-700",
        isOnline === false && "bg-red-50 text-red-700",
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          isOnline === null && "animate-pulse bg-stone-400",
          isOnline === true && "bg-emerald-500",
          isOnline === false && "bg-red-500",
        )}
      />
      {label}
    </span>
  );
}
