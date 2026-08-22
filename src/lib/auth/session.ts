import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  await connection();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const requireUser = cache(async () => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});
