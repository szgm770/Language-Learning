import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "לינגו – לימוד שפות בעברית",
    short_name: "לינגו",
    description: "לימוד שפות לדוברי עברית. עובד גם בלי אינטרנט.",
    lang: "he",
    dir: "rtl",
    start_url: withBase("/learn/"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#3346d3",
    icons: [
      { src: withBase("/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: withBase("/icon-maskable.svg"), sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
