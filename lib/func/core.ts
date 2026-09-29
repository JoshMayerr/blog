export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  text: string;
  links: string[];
  words: number;
  minutes: number;
};
export const dimensions = ["overview", "terms", "links", "text"] as const;
export type Dimension = (typeof dimensions)[number];
export type CollectionInput = {
  title: string;
  items: { slug: string; note?: string }[];
  format: "markdown" | "json";
  includeText: boolean;
};
export type ComparisonInput = { slugs: string[]; dimensions: Dimension[] };

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new Error("Unknown input field.");
}
function string(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error(`${label} must be nonempty text, up to ${max} characters.`);
  return value.trim();
}
function select(posts: BlogPost[], slug: unknown) {
  const post = posts.find((post) => post.slug === slug);
  if (!post)
    throw new Error(
      `Unknown post: ${String(slug)}. Use listPosts to find valid slugs.`,
    );
  return post;
}
export function parseCollection(
  value: unknown,
  posts: BlogPost[],
): CollectionInput {
  const input = object(value);
  keys(input, ["title", "items", "format", "includeText"]);
  const title = string(input.title, "Title", 120);
  if (
    !Array.isArray(input.items) ||
    input.items.length < 1 ||
    input.items.length > 20
  )
    throw new Error("Choose between 1 and 20 posts.");
  const items = input.items.map((value) => {
    const item = object(value);
    keys(item, ["slug", "note"]);
    const post = select(posts, item.slug);
    if (
      item.note !== undefined &&
      (typeof item.note !== "string" || item.note.length > 1000)
    )
      throw new Error("Notes must be text up to 1,000 characters.");
    return {
      slug: post.slug,
      note: (item.note as string | undefined)?.trim() ?? "",
    };
  });
  if (new Set(items.map((item) => item.slug)).size !== items.length)
    throw new Error("Choose each post only once.");
  const format = input.format ?? "markdown";
  if (format !== "markdown" && format !== "json")
    throw new Error("Format must be markdown or json.");
  if (input.includeText !== undefined && typeof input.includeText !== "boolean")
    throw new Error("includeText must be a boolean.");
  return { title, items, format, includeText: input.includeText === true };
}
export function parseComparison(
  value: unknown,
  posts: BlogPost[],
): ComparisonInput {
  const input = object(value);
  keys(input, ["slugs", "dimensions"]);
  if (
    !Array.isArray(input.slugs) ||
    input.slugs.length < 2 ||
    input.slugs.length > 4
  )
    throw new Error("Choose between 2 and 4 posts.");
  const slugs = input.slugs.map((slug) => select(posts, slug).slug);
  if (new Set(slugs).size !== slugs.length)
    throw new Error("Choose distinct posts for comparison.");
  const fields = input.dimensions ?? ["overview", "terms", "links"];
  if (
    !Array.isArray(fields) ||
    !fields.length ||
    fields.some((field) => !dimensions.includes(field)) ||
    new Set(fields).size !== fields.length
  )
    throw new Error(
      "Choose unique dimensions from overview, terms, links, and text.",
    );
  return { slugs, dimensions: fields as Dimension[] };
}
const escapeMarkdown = (text: string) =>
  text.replace(/([\\`*_{}\[\]<>#!|])/g, "\\$1");
export function createCollection(value: unknown, posts: BlogPost[]) {
  const input = parseCollection(value, posts);
  const items = input.items.map((item) => {
    const post = select(posts, item.slug);
    return {
      slug: post.slug,
      title: post.title,
      date: post.date,
      url: `https://www.joshmayer.net${post.slug}`,
      minutes: post.minutes,
      note: item.note ?? "",
      ...(input.includeText ? { text: post.text } : {}),
    };
  });
  const collection = {
    title: input.title,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    items,
  };
  const content =
    input.format === "json"
      ? JSON.stringify(collection, null, 2)
      : `# ${escapeMarkdown(input.title)}\n\n${items.length} posts · approximately ${collection.totalMinutes} minutes\n\n` +
        items
          .map(
            (item, i) =>
              `## ${i + 1}. [${escapeMarkdown(item.title)}](${item.url})\n\n${item.date.slice(0, 10)} · ${item.minutes} min read\n\n${item.note ? `${escapeMarkdown(item.note)}\n\n` : ""}${item.text ? `${item.text}\n\n` : ""}`,
          )
          .join("---\n\n");
  return {
    ...collection,
    input,
    content,
    filename: `${
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "collection"
    }.${input.format === "json" ? "json" : "md"}`,
    mimeType: input.format === "json" ? "application/json" : "text/markdown",
  };
}
export type CollectionResult = ReturnType<typeof createCollection>;
const stopWords = new Set(
  "about after again against almost also always another because been before being believe between both called could does doing down each even every first from going have having here into just like make many more most much must need never only other over really same should since some something still such than that their them then there these they thing things think this those through time under very want well were what when where which while will with without would your you are and the for but not can all any how its our out who has was one two use now get may too way don isn ve ll re".split(
    " ",
  ),
);
function termCounts(text: string) {
  const counts = new Map<string, number>();
  for (const term of text.toLowerCase().match(/[a-z]{3,}/g) ?? []) {
    if (!stopWords.has(term)) counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return counts;
}
export function comparePosts(value: unknown, posts: BlogPost[]) {
  const input = parseComparison(value, posts);
  const selected = input.slugs.map((slug) => select(posts, slug));
  const counts = selected.map((post) => termCounts(post.text));
  const sharedTerms = input.dimensions.includes("terms")
    ? Array.from(counts[0].keys())
        .filter((term) => counts.every((count) => count.has(term)))
        .map((term) => ({
          term,
          counts: counts.map((count) => count.get(term) ?? 0),
        }))
        .sort(
          (a, b) =>
            b.counts.reduce((s, n) => s + n, 0) -
              a.counts.reduce((s, n) => s + n, 0) ||
            a.term.localeCompare(b.term),
        )
        .slice(0, 20)
    : [];
  const sharedLinks = input.dimensions.includes("links")
    ? Array.from(new Set(selected.flatMap((post) => post.links)))
        .map((url) => ({
          url,
          slugs: selected
            .filter((post) => post.links.includes(url))
            .map((post) => post.slug),
        }))
        .filter((link) => link.slugs.length > 1)
    : [];
  return {
    input,
    posts: selected.map((post) => ({
      slug: post.slug,
      title: post.title,
      ...(input.dimensions.includes("overview")
        ? {
            date: post.date,
            description: post.description,
            words: post.words,
            minutes: post.minutes,
            linkCount: post.links.length,
          }
        : {}),
      ...(input.dimensions.includes("text") ? { text: post.text } : {}),
    })),
    sharedTerms,
    sharedLinks,
    methodology:
      "Shared terms are exact, case-insensitive English words of at least three letters appearing in every selected post, excluding common stop words. Links are normalized HTTP(S) URLs appearing in at least two posts. This is a textual comparison, not an AI interpretation or a version diff.",
  };
}
export type ComparisonResult = ReturnType<typeof comparePosts>;
export function listPosts(value: unknown, posts: BlogPost[]) {
  const input = object(value);
  keys(input, ["query", "year"]);
  if (
    input.query !== undefined &&
    (typeof input.query !== "string" || input.query.length > 200)
  )
    throw new Error("Query must be text up to 200 characters.");
  if (
    input.year !== undefined &&
    (typeof input.year !== "string" || !/^\d{4}$/.test(input.year))
  )
    throw new Error("Year must contain four digits.");
  const query = ((input.query as string) ?? "").trim().toLowerCase();
  return posts
    .filter(
      (post) =>
        (!input.year || post.date.startsWith(input.year as string)) &&
        `${post.title} ${post.description} ${post.text}`
          .toLowerCase()
          .includes(query),
    )
    .map(({ slug, title, description, date, minutes }) => ({
      slug,
      title,
      description,
      date,
      minutes,
    }));
}
export const operationDefinitions = [
  {
    name: "listPosts",
    description:
      "Search published blog posts by text and/or year. Returns valid slugs, titles, descriptions, dates, and estimated reading times for collections and comparisons.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", maxLength: 200 },
        year: { type: "string", pattern: "^[0-9]{4}$" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "createCollection",
    description:
      "Create a reading collection in one call, preserving the supplied post order and notes. Returns the collection and downloadable Markdown or JSON content. Does not publish or automatically download files.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1, maxLength: 120 },
        items: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                description:
                  "Full post path from listPosts, such as /posts/aiweb.",
              },
              note: { type: "string", maxLength: 1000 },
            },
            required: ["slug"],
            additionalProperties: false,
          },
        },
        format: {
          type: "string",
          enum: ["markdown", "json"],
          default: "markdown",
        },
        includeText: { type: "boolean", default: false },
      },
      required: ["title", "items"],
      additionalProperties: false,
    },
  },
  {
    name: "comparePosts",
    description:
      "Compare 2–4 distinct published posts in one call. Dimensions: overview (metadata), terms (exact shared words), links (shared URLs), text (side-by-side plain text). No AI-generated semantic claims.",
    inputSchema: {
      type: "object",
      properties: {
        slugs: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          uniqueItems: true,
          items: { type: "string" },
        },
        dimensions: {
          type: "array",
          minItems: 1,
          uniqueItems: true,
          items: { type: "string", enum: dimensions },
          default: ["overview", "terms", "links"],
        },
      },
      required: ["slugs"],
      additionalProperties: false,
    },
  },
] as const;
