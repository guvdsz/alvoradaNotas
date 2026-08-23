import type { Metadata } from "next";

import { MovementManager } from "@/features/inventory/components/movement-manager";

export const metadata: Metadata = {
  title: "Movimentações",
};

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  return <MovementManager initialType={type === "exit" ? "exit" : "entry"} />;
}
