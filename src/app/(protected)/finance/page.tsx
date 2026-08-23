import type { Metadata } from "next";

import { FinanceContent } from "@/features/finance/components/finance-content";

export const metadata: Metadata = {
  title: "Financeiro",
};

export default function FinancePage() {
  return <FinanceContent />;
}
