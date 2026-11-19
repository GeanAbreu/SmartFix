import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://smartfix.com.br";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/cliente/", "/parceiro/"] },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
