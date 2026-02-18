// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "./providers-client";

export const metadata: Metadata = {
  title: "MGOS-AIOS",
  description: "MGOS-AIOS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
