import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://joshmayer.net/sitemap.xml",
    host: "https://joshmayer.net",
  };
}
