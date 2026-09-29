import {
  seatingDefinition,
  seatingResultSchema,
  seatingSkill,
} from "../func/seating";
import { operationDefinitions } from "../func/core";

export const VERSION = "1.0.0";
export const functions = {
  "joshmayer-seating": {
    title: "Event Seating Planner",
    action: "planSeating",
    path: "plan",
    page: "seating",
  },
  "joshmayer-collections": {
    title: "Josh Mayer Blog Collections",
    action: "createCollection",
    path: "create",
    page: "collections",
  },
  "joshmayer-comparisons": {
    title: "Josh Mayer Blog Comparisons",
    action: "comparePosts",
    path: "compare",
    page: "comparisons",
  },
} as const;
export type FunctionSlug = keyof typeof functions;
export function isFunctionSlug(value: string): value is FunctionSlug {
  return Object.hasOwn(functions, value);
}
export function prefix(slug: FunctionSlug) {
  return `/api/agent-functions/${slug}/v${VERSION}`;
}
const text = { type: "string" };
const integer = { type: "integer", minimum: 0 };
const array = (items: unknown) => ({ type: "array", items });
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
const postSummary = object({
  slug: text,
  title: text,
  description: text,
  date: text,
  minutes: integer,
});
const collectionItem = object(
  {
    slug: text,
    title: text,
    date: text,
    url: text,
    minutes: integer,
    note: text,
    text,
  },
  ["slug", "title", "date", "url", "minutes", "note"],
);
const comparisonPost = object(
  {
    slug: text,
    title: text,
    date: text,
    description: text,
    words: integer,
    minutes: integer,
    linkCount: integer,
    text,
  },
  ["slug", "title"],
);
const definition = (name: string) =>
  [...operationDefinitions, seatingDefinition].find((op) => op.name === name)!;
export const resultSchemas = {
  planSeating: seatingResultSchema,
  listPosts: array(postSummary),
  createCollection: object({
    title: text,
    totalMinutes: integer,
    items: array(collectionItem),
    input: definition("createCollection").inputSchema,
    content: text,
    filename: text,
    mimeType: text,
  }),
  comparePosts: object({
    input: definition("comparePosts").inputSchema,
    posts: array(comparisonPost),
    sharedTerms: array(object({ term: text, counts: array(integer) })),
    sharedLinks: array(object({ url: text, slugs: array(text) })),
    methodology: text,
  }),
};
const propertyHeader = {
  in: "header",
  name: "x-tollbit-property",
  required: false,
  description: "Opaque property context supplied by TollBit for attribution.",
  schema: text,
};
const paymentHeader = {
  in: "header",
  name: "x-tollbit-agent-payment-token",
  required: true,
  schema: text,
};
const response = (
  description: string,
  schema: unknown,
  mime = "application/json",
) => ({ description, content: { [mime]: { schema } } });
export function openapi(slug: FunctionSlug, origin: string) {
  const fn = functions[slug];
  function capability(
    name: "listPosts" | "createCollection" | "comparePosts" | "planSeating",
  ) {
    const op = definition(name);
    return {
      operationId: name,
      summary: name === "listPosts" ? "Find published posts" : fn.title,
      description: op.description,
      "x-guidance":
        name === "planSeating"
          ? "Supply the complete guest list, table capacities, and optional pair rules. Inspect status before presenting a plan: search_limit is not proof of infeasibility."
          : name === "listPosts"
            ? "Search by query and/or year to obtain valid full post slugs. Only published posts are included."
            : "Use list-posts to find slugs. Pass all selected posts in one call; their order is preserved. No files are downloaded and nothing is published automatically.",
      "x-tollbit": { price: { priceMicros: 0, currency: "USD" } },
      parameters: [propertyHeader, paymentHeader],
      requestBody: {
        required: true,
        content: { "application/json": { schema: op.inputSchema } },
      },
      responses: {
        "200": response("Completed operation", resultSchemas[name]),
        ...Object.fromEntries(
          [
            [400, "Invalid operation input"],
            [401, "Invalid or rejected payment token"],
            [402, "Payment token required, including for zero-priced calls"],
            [403, "Token targets a different operation"],
            [413, "Request exceeds 64 KB"],
            [502, "Payment redemption unavailable or unexpected response"],
            [503, "TollBit runtime configuration missing"],
          ].map(([status, description]) => [
            String(status),
            response(String(description), object({ error: text })),
          ]),
        ),
      },
    };
  }
  return {
    openapi: "3.1.0",
    info: {
      title: fn.title,
      version: VERSION,
      description: `TollBit Agent Function for the ${fn.page} workflow at joshmayer.net/func/${fn.page}.`,
    },
    servers: [{ url: `${origin.replace(/\/$/, "")}${prefix(slug)}` }],
    "x-guidance":
      slug === "joshmayer-seating"
        ? "Plan seating from caller-supplied event data. Read the skill for limits and result statuses. All capability calls require a TollBit payment token, including zero-priced calls."
        : "Operate on Josh Mayer's published blog archive. Use list-posts to find valid slugs, then complete the workflow in one call. All capability operations require a TollBit payment token, including free operations. Read the skill for input and result guidance.",
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          parameters: [propertyHeader],
          responses: {
            "200": response(
              "Service is live; configured indicates whether payment redemption can be attempted",
              object({
                status: text,
                version: text,
                configured: { type: "boolean" },
              }),
            ),
          },
        },
      },
      "/skill": {
        get: {
          operationId: "getSkill",
          parameters: [propertyHeader],
          responses: {
            "200": response("Agent usage guidance", text, "text/markdown"),
          },
        },
      },
      ...(slug === "joshmayer-seating"
        ? {}
        : { "/posts": { post: capability("listPosts") } }),
      [`/${fn.path}`]: { post: capability(fn.action) },
    },
  };
}
export function skill(slug: FunctionSlug) {
  if (slug === "joshmayer-seating") return seatingSkill;
  const collections = slug === "joshmayer-collections";
  return `---\nname: ${slug}\ndescription: ${collections ? "Create ordered reading collections from Josh Mayer's published blog posts, with notes and Markdown or JSON exports." : "Compare two to four of Josh Mayer's published blog posts by metadata, exact shared words, shared references, or full text."}\n---\n\n# ${functions[slug].title}\n\nUse this function when the user wants to ${collections ? "assemble a reading packet without selecting, reordering, and annotating each post through the browser" : "compare posts without selecting them and configuring each comparison section through the browser"}.\n\n## Find posts\n\nUse list-posts with an optional query and four-digit year. The result contains full slugs such as /posts/aiweb, titles, descriptions, dates, and estimated reading times. An empty object lists the archive. Only published posts are included. The property context is supplied by TollBit; no site URL argument is needed.\n\n## ${collections ? "Create a collection" : "Compare posts"}\n\n${collections ? "Use create-collection with a title and an ordered items array of 1–20 distinct objects containing slug and optional note. Notes are at most 1,000 characters. Set format to markdown (default) or json; includeText defaults to false. The returned content, filename, and mimeType are ready to save as a file. items and totalMinutes describe the packet. Nothing is saved, published, or downloaded automatically." : "Use compare-posts with 2–4 distinct slugs in column order. Choose dimensions from overview, terms, links, and text; the default is overview, terms, and links. posts contains the selected metadata/text, sharedTerms contains exact word counts by column, and sharedLinks identifies URLs and the posts that cite them. Empty shared lists mean no matches."}\n\n## Limits\n\nReading time uses 225 words per minute. Full text omits images and rich MDX formatting. Comparisons are deterministic text analysis, not semantic interpretation or version history. Shared words occur in every selected post; shared links occur in at least two. No private content or drafts are included. These operations are free but still require TollBit authorization.\n`;
}
