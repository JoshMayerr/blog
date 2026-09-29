import assert from "node:assert/strict";
import test from "node:test";
import {
  comparePosts,
  createCollection,
  listPosts,
  type BlogPost,
} from "../lib/func/core";
const posts: BlogPost[] = [
  {
    slug: "/posts/one",
    title: "One",
    description: "First",
    date: "2025-01-01",
    text: "Oranges oranges rivers river.",
    words: 4,
    minutes: 1,
    links: ["https://example.com/common", "https://example.com/one"],
  },
  {
    slug: "/posts/two",
    title: "Two",
    description: "Second",
    date: "2026-01-01",
    text: "Oranges river river garden.",
    words: 4,
    minutes: 1,
    links: ["https://example.com/common"],
  },
  {
    slug: "/posts/three",
    title: "Three",
    description: "Third",
    date: "2026-02-01",
    text: "Garden flowers.",
    words: 2,
    minutes: 1,
    links: [],
  },
];
test("collection preserves supplied order, annotations and export settings", () => {
  const result = createCollection(
    {
      title: "My list",
      items: [
        { slug: posts[1].slug, note: "Read first" },
        { slug: posts[0].slug },
      ],
      format: "json",
      includeText: true,
    },
    posts,
  );
  const packet = JSON.parse(result.content);
  assert.deepEqual(
    packet.items.map((item: { slug: string }) => item.slug),
    [posts[1].slug, posts[0].slug],
  );
  assert.equal(packet.items[0].note, "Read first");
  assert.equal(packet.items[0].text, posts[1].text);
  assert.equal(packet.totalMinutes, 2);
  const brief = createCollection(
    { title: "Brief", items: [{ slug: posts[0].slug }] },
    posts,
  );
  assert.ok(!("text" in brief.items[0]));
  assert.ok(brief.content.includes("https://www.joshmayer.net/posts/one"));
});
test("rejects unknown, duplicate, oversized and malformed selections", () => {
  for (const items of [
    [],
    [{ slug: "missing" }],
    [{ slug: posts[0].slug }, { slug: posts[0].slug }],
    [{ slug: posts[0].slug, note: 42 }],
    Array(21).fill({ slug: posts[0].slug }),
  ]) {
    assert.throws(() => createCollection({ title: "List", items }, posts));
  }
  assert.throws(() =>
    createCollection(
      { title: "List", items: [{ slug: posts[0].slug }], includeText: "yes" },
      posts,
    ),
  );
  assert.throws(() =>
    createCollection({ title: "  ", items: [{ slug: posts[0].slug }] }, posts),
  );
  assert.throws(() =>
    comparePosts({ slugs: [posts[0].slug, posts[0].slug] }, posts),
  );
  assert.throws(() =>
    comparePosts(
      { slugs: [posts[0].slug, posts[1].slug], dimensions: [] },
      posts,
    ),
  );
  assert.throws(() =>
    comparePosts(
      { slugs: [posts[0].slug, posts[1].slug], dimensions: ["summary"] },
      posts,
    ),
  );
});
test("comparison computes exact shared term counts and reference membership", () => {
  const result = comparePosts(
    { slugs: [posts[0].slug, posts[1].slug], dimensions: ["terms", "links"] },
    posts,
  );
  assert.deepEqual(result.sharedTerms, [
    { term: "oranges", counts: [2, 1] },
    { term: "river", counts: [1, 2] },
  ]);
  assert.deepEqual(result.sharedLinks, [
    {
      url: "https://example.com/common",
      slugs: [posts[0].slug, posts[1].slug],
    },
  ]);
  assert.equal(result.posts[0].text, undefined);
  assert.equal(result.posts[0].words, undefined);
  const all = comparePosts(
    {
      slugs: posts.map((post) => post.slug),
      dimensions: ["terms", "links", "text"],
    },
    posts,
  );
  assert.deepEqual(all.sharedTerms, []);
  assert.equal(all.sharedLinks.length, 1);
  assert.equal(all.posts[0].text, posts[0].text);
});
test("search combines full-text query and year without exposing drafts", () => {
  assert.deepEqual(
    listPosts({ query: "GARDEN", year: "2026" }, posts).map(
      (post) => post.slug,
    ),
    [posts[1].slug, posts[2].slug],
  );
  assert.deepEqual(listPosts({ query: "absent" }, posts), []);
  assert.throws(() => listPosts({ year: 2026 }, posts));
  assert.throws(() => listPosts({ query: {} }, posts));
});
