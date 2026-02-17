// app/layout.tsx
import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
