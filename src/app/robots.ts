import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://worldpickleball.world/sitemap.xml",
    host: "https://worldpickleball.world",
  };
}
