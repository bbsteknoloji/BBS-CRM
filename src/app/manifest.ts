import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BBS CRM",
    short_name: "BBS CRM",
    description: "Müşteri yönetimi, satış teklifleri ve sözleşme takip sistemi",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#1e3a5f",
    orientation: "portrait-primary",
    lang: "tr",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["business", "productivity"],
    screenshots: [],
  };
}
