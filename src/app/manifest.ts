import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alvorada Notas",
    short_name: "Alvorada Notas",
    description:
      "Controle de estoque e movimentações do Empório Laticínios Alvorada.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#b45309",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icons/alvorada-notas-v2-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/alvorada-notas-v2-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/alvorada-notas-maskable-v2-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/alvorada-notas-maskable-v2-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
