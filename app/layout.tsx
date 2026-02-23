// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./providers-client";
import { QueueSystemInitializer } from "./queue-system-initializer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="font-inter">
        <QueueSystemInitializer />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
