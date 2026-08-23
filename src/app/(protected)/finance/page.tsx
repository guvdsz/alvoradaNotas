import type { Metadata } from "next";

import { FinanceContent } from "@/features/inventory/components/finance-content";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default function FinancePage() {
  return <FinanceContent />;
}
