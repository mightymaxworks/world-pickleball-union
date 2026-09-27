import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://worldpickleball.world";

  return [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/governance`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/members`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/competitions`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/standards`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
