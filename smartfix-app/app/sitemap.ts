import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || "https://smartfix.com.br";
  const modified = new Date();
  return [
    { url: baseUrl, lastModified: modified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/login`, lastModified: modified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/cadastro`, lastModified: modified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/termos`, lastModified: modified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacidade`, lastModified: modified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
