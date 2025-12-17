import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://motokitchen.nl";

  const routes = [
    "",
    "/services",
    "/services/weddings",
    "/services/corporate",
    "/services/private-events",
    "/menu",
    "/gallery",
    "/about",
    "/reviews",
    "/faq",
    "/contact",
    "/privacy",
    "/cookies",
    "/terms",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/services") ? 0.9 : 0.8,
  }));
}

