import { allLearnings, allPosts } from "contentlayer2/generated";
import { getBaseUrl } from "@/lib/utils";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function GET() {
  const baseUrl = getBaseUrl();
  const entries = [
    ...allPosts.map((post) => ({
      title: post.title,
      description: post.description,
      date: post.date,
      url: new URL(post.slug, baseUrl).toString(),
    })),
    ...allLearnings.map((essay) => ({
      title: essay.title,
      description: essay.description,
      date: essay.date,
      url: new URL(essay.slug, baseUrl).toString(),
    })),
  ].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const items = entries
    .map(
      (entry) => `
    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <guid isPermaLink="true">${escapeXml(entry.url)}</guid>
      <pubDate>${new Date(entry.date).toUTCString()}</pubDate>
      ${entry.description ? `<description>${escapeXml(entry.description)}</description>` : ""}
    </item>`,
    )
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Josh Mayer</title>
    <link>${baseUrl}</link>
    <description>Notes, essays, and projects from Josh Mayer.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
