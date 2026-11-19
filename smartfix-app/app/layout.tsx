import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.APP_URL || "https://smartfix.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SmartFix - Assistência Técnica Especializada",
    template: "%s | SmartFix",
  },
  description: "A plataforma mais rápida e segura para conectar você às melhores assistências técnicas.",
  applicationName: "SmartFix",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "SmartFix",
    title: "SmartFix - Assistência Técnica Especializada",
    description: "Encontre assistências verificadas, compare opções e acompanhe seu reparo.",
    images: [{ url: "/images/smartfix-hero.png", width: 1536, height: 1536, alt: "SmartFix" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartFix - Assistência Técnica Especializada",
    description: "Encontre assistências verificadas e acompanhe seu reparo.",
    images: ["/images/smartfix-hero.png"],
  },
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
