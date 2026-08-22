"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/features/auth/stores/auth-store";
import {
  createClient,
  isSupabaseBrowserConfigured,
} from "@/lib/supabase/client";

export function AuthStateListener() {
  const router = useRouter();
  const setStatus = useAuthStore((state) => state.setStatus);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setUser(null);
      return;
    }

    const supabase = createClient();
    setStatus("loading");

    void supabase.auth.getUser().then(({ data }) => {
      setUser(
        data.user
          ? { id: data.user.id, email: data.user.email ?? null }
          : null,
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null,
      );

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setStatus, setUser]);

  return null;
}
