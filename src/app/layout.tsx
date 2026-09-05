import type { Metadata, Viewport } from "next";

import { AuthStateListener } from "@/features/auth/components/auth-state-listener";

import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Alvorada Notas",
  title: {
    default: "Alvorada Notas",
    template: "%s | Alvorada Notas",
  },
  description:
    "Controle de estoque e movimentações do Empório Laticínios Alvorada.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alvorada Notas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#b45309",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-cream-50 text-stone-900">
        <AuthStateListener />
        {children}
      </body>
    </html>
  );
}
