import { allPosts } from "@/.contentlayer/generated";
import type { BlogPost } from "./core";

export function getFunctionPosts(): BlogPost[] {
  return allPosts
    .map((post) => {
      const raw = post.body.raw;
      const urls = [
        ...Array.from(
          raw.matchAll(/\]\((https?:\/\/[^\s)]+|\/[^\s)]+)(?:\s+[^)]*)?\)/g),
          (match) => match[1],
        ),
        ...Array.from(
          raw.matchAll(/https?:\/\/[^\s<>"')\]]+/g),
          (match) => match[0],
        ),
      ];
      const links = Array.from(
        new Set(
          urls.flatMap((value) => {
            try {
              const url = new URL(
                value.replace(/[.,;]+$/, ""),
                "https://www.joshmayer.net",
              );
              if (!["http:", "https:"].includes(url.protocol)) return [];
              url.hash = "";
              if (url.hostname === "joshmayer.net")
                url.hostname = "www.joshmayer.net";
              return [url.href];
            } catch {
              return [];
            }
          }),
        ),
      );
      const text = raw
        .replace(/<[^>]+>/g, "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_`]/g, "")
        .trim();
      const words = (text.match(/\S+/g) ?? []).length;
      return {
        slug: post.slug,
        title: post.title,
        description: post.description ?? "",
        date: post.date,
        text,
        links,
        words,
        minutes: Math.max(1, Math.ceil(words / 225)),
      };
    })
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug),
    );
}
