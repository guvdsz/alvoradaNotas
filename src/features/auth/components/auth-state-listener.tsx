"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";

export function AuthStateListener() {
  const router = useRouter();
  const setStatus = useAuthStore((state) => state.setStatus);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      return;
    }

    setStatus("loading");

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setUser(
        user ? { id: user.uid, email: user.email } : null,
      );
      router.refresh();
    });

    return unsubscribe;
  }, [router, setStatus, setUser]);

  return null;
}
