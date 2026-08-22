import type { Metadata } from "next";

import { DashboardContent } from "@/features/inventory/components/dashboard-content";

export const metadata: Metadata = {
  title: "Visão geral",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
