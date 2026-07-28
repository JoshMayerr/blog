import type { MetadataRoute } from "next";
import { allLearnings, allPages, allPosts } from "contentlayer2/generated";

import { getBaseUrl } from "@/lib/utils";

const baseUrl = getBaseUrl();

function absoluteUrl(path: string) {
  return new URL(path, baseUrl).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/posts"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/projects"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/learning"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const pageRoutes: MetadataRoute.Sitemap = allPages.map((page) => ({
    url: absoluteUrl(`/${page.slugAsParams}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: absoluteUrl(post.slug),
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const learningRoutes: MetadataRoute.Sitemap = allLearnings.map((essay) => ({
    url: absoluteUrl(essay.slug),
    lastModified: new Date(essay.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...pageRoutes, ...postRoutes, ...learningRoutes];
}
