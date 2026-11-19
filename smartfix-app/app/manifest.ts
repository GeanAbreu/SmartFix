import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartFix",
    short_name: "SmartFix",
    description: "Assistência técnica especializada perto de você.",
    start_url: "/",
    display: "standalone",
    background_color: "#06172b",
    theme_color: "#06172b",
    lang: "pt-BR",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
