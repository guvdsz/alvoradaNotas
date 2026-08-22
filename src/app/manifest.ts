import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alvorada Estoque",
    short_name: "Alvorada",
    description:
      "Controle de estoque e movimentações do Empório Laticínios Alvorada.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#f59e0b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/brand/alvorada-logo.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
