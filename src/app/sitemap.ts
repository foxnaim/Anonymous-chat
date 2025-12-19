import type { MetadataRoute } from "next";

const routes = ["", "/pricing", "/features"].map((route) => ({
  url: `https://anonymouschat.example${route}`,
  lastModified: new Date(),
  changeFrequency: "weekly" as const,
  priority: route === "" ? 1 : 0.6
}));

export default function sitemap(): MetadataRoute.Sitemap {
  return routes;
}

