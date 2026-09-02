import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFix - Assistência Técnica Especializada",
  description: "A plataforma mais rápida e segura para conectar você às melhores assistências técnicas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
