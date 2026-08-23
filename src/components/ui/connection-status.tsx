"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    function updateConnectionStatus() {
      setIsOnline(window.navigator.onLine);
    }

    updateConnectionStatus();
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);

    return () => {
      window.removeEventListener("online", updateConnectionStatus);
      window.removeEventListener("offline", updateConnectionStatus);
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
