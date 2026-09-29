import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";
import { handleFunction } from "../lib/tollbit/handler";
import {
  openapi,
  VERSION,
  prefix,
  type FunctionSlug,
} from "../lib/tollbit/contracts";
import {
  comparePosts,
  createCollection,
  type BlogPost,
} from "../lib/func/core";
const posts: BlogPost[] = [
  {
    slug: "/posts/a",
    title: "A",
    description: "First",
    date: "2025-01-01",
    text: "Oranges river",
    words: 2,
    minutes: 1,
    links: ["https://example.com/"],
  },
  {
    slug: "/posts/b",
    title: "B",
    description: "Second",
    date: "2026-01-01",
    text: "River river",
    words: 2,
    minutes: 1,
    links: ["https://example.com/"],
  },
];
const config = {
  orgId: "test-org",
  redeemUrl: "https://payments.example.test/redeem",
};
const slug: FunctionSlug = "joshmayer-collections";
const token = (rid: string) =>
  `eyJhbGciOiJSUzI1NiJ9.${Buffer.from(JSON.stringify({ payee: { rid } })).toString("base64url")}.c2lnbmF0dXJl`;
function request(
  operation: string,
  args: unknown = {},
  payment?: string,
  extra: Record<string, string> = {},
) {
  return new Request(`http://localhost:3107${prefix(slug)}/${operation}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(payment ? { "x-tollbit-agent-payment-token": payment } : {}),
      ...extra,
    },
    body: JSON.stringify(args),
  });
}
const params = (operation: string, fn: FunctionSlug = slug) => ({
  function: fn,
  version: `v${VERSION}`,
  operation,
});
const validToken = (op: string, fn: FunctionSlug = slug) =>
  token(`test-org/${fn}/${VERSION}/${op}`);
const redeemed: typeof fetch = async () =>
  Response.json({ status: "redeemed", settlement: "none" });

test("public metadata, required headers, pricing, schemas and stable generated artifacts", async () => {
  for (const fn of [slug, "joshmayer-comparisons"] as FunctionSlug[]) {
    for (const endpoint of ["health", "skill", "openapi"]) {
      const req: Request = new Request(
        `http://internal${prefix(fn)}/${endpoint}`,
        {
          headers: {
            "x-forwarded-host": "www.joshmayer.net",
            "x-forwarded-proto": "https",
          },
        },
      );
      const result = await handleFunction(
        req,
        params(endpoint, fn),
        () => {
          throw new Error("Metadata must not load posts");
        },
        {},
      );
      assert.equal(result.status, 200);
      assert.equal(
        result.headers.get("x-robots-tag"),
        "noindex, nofollow, noarchive",
      );
      if (endpoint === "health")
        assert.equal((await result.json()).configured, false);
      if (endpoint === "skill")
        assert.match(
          await result.text(),
          /^---\nname: .+\ndescription: .+\n---/,
        );
      if (endpoint === "openapi") {
        assert.match(result.headers.get("content-type")!, /yaml/);
        const spec = parse(await result.text());
        assert.equal(spec.openapi, "3.1.0");
        assert.equal(
          spec.servers[0].url,
          `https://www.joshmayer.net${prefix(fn)}`,
        );
        assert.equal(spec.paths["/openapi"], undefined);
        for (const [path, methods] of Object.entries(spec.paths)) {
          for (const op of Object.values(
            methods as Record<
              string,
              {
                parameters: { name: string; required: boolean }[];
                "x-tollbit"?: { price: { priceMicros: number } };
              }
            >,
          )) {
            assert.ok(
              op.parameters.some(
                (p) => p.name === "x-tollbit-property" && !p.required,
              ),
            );
            if (["/health", "/skill"].includes(path))
              assert.equal(op["x-tollbit"], undefined);
            else {
              assert.equal(op["x-tollbit"]?.price.priceMicros, 0);
              assert.ok(
                op.parameters.some(
                  (p) =>
                    p.name === "x-tollbit-agent-payment-token" && p.required,
                ),
              );
            }
          }
        }
        assert.deepEqual(
          spec,
          parse(await readFile(`agent-functions/${fn}/openapi.yaml`, "utf8")),
        );
      }
    }
  }
});
test("tokens are mandatory and bound to exact org/function/version/operation", async () => {
  let calls = 0;
  const backend: typeof fetch = async () => {
    calls++;
    return Response.json({ status: "redeemed", settlement: "none" });
  };
  for (const [payment, status] of [
    [undefined, 402],
    ["invalid", 401],
    [token("another-org/fn/1.0.0/listPosts"), 403],
    [validToken("createCollection"), 403],
  ] as const) {
    const result = await handleFunction(
      request("posts", {}, payment),
      params("posts"),
      () => posts,
      config,
      backend,
    );
    assert.equal(result.status, status);
    assert.ok((await result.json()).error);
  }
  assert.equal(calls, 0);
  const unconfigured = await handleFunction(
    request("posts", {}, validToken("listPosts")),
    params("posts"),
    () => posts,
    {},
    backend,
  );
  assert.equal(unconfigured.status, 503);
  assert.equal(calls, 0);
});
test("redeems once with configured URL and exact RID, then returns the same collection as UI", async () => {
  const input = {
    title: "Reading",
    items: [{ slug: "/posts/b", note: "First" }, { slug: "/posts/a" }],
    format: "json",
    includeText: true,
  };
  let calls = 0;
  const backend: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, config.redeemUrl);
    const { idempotencyKey, ...redemption } = JSON.parse(init?.body as string);
    assert.match(idempotencyKey, /^[0-9a-f-]{36}$/);
    assert.deepEqual(redemption, {
      token: validToken("createCollection"),
      rid: `test-org/${slug}/${VERSION}/createCollection`,
    });
    return Response.json({ status: "redeemed", settlement: "none" });
  };
  const result = await handleFunction(
    request("create", input, validToken("createCollection"), {
      "x-tollbit-property": "joshmayer.net/func/collections",
      "x-redeem-url": "https://evil.example",
    }),
    params("create"),
    () => posts,
    config,
    backend,
  );
  assert.equal(result.status, 200);
  assert.equal(calls, 1);
  assert.deepEqual(await result.json(), createCollection(input, posts));
});
test("does not compute collection output while redemption is pending or rejected", async () => {
  let reads = 0;
  const observed = posts.map((post) => ({
    ...post,
    get minutes() {
      reads++;
      return post.minutes;
    },
  }));
  const input = { title: "List", items: [{ slug: "/posts/a" }] };
  for (const failure of [401, 403, 409, 500, 429]) {
    const result = await handleFunction(
      request("create", input, validToken("createCollection")),
      params("create"),
      () => observed,
      config,
      async () => {
        assert.equal(reads, 0);
        return new Response("rejected", { status: failure });
      },
    );
    assert.equal(
      result.status,
      failure === 403 ? 403 : [401, 409].includes(failure) ? 401 : 502,
    );
    assert.equal(reads, 0);
  }
  for (const backend of [
    async () => {
      throw new Error("network");
    },
    async () => Response.json({ status: "" }),
    async () => Response.json({ status: "processing", settlement: "none" }, { status: 202 }),
    async () => Response.json({ status: "processing", settlement: "none" }),
    async () => Response.json({ status: "redeemed", settlement: "unknown" }),
    async () => new Response("not json"),
  ]) {
    const result = await handleFunction(
      request("create", input, validToken("createCollection")),
      params("create"),
      () => observed,
      config,
      backend,
    );
    assert.equal(result.status, 502);
    assert.equal(reads, 0);
  }
});
test("invalid inputs are rejected before redeeming, including oversized and malformed bodies", async () => {
  const backend: typeof fetch = async () => {
    throw new Error("must not redeem");
  };
  const invalid = await handleFunction(
    request(
      "create",
      { title: "List", items: [] },
      validToken("createCollection"),
    ),
    params("create"),
    () => posts,
    config,
    backend,
  );
  assert.equal(invalid.status, 400);
  for (const [body, status] of [
    ["{", 400],
    ["x".repeat(65537), 413],
  ] as const) {
    const req: Request = new Request(`http://localhost${prefix(slug)}/posts`, {
      method: "POST",
      body,
      headers: { "x-tollbit-agent-payment-token": validToken("listPosts") },
    });
    assert.equal(
      (await handleFunction(req, params("posts"), () => posts, config, backend))
        .status,
      status,
    );
  }
});
test("comparison and catalog output match the contract; unknown versions fail", async () => {
  const fn = "joshmayer-comparisons";
  const input = {
    slugs: posts.map((post) => post.slug),
    dimensions: ["overview", "terms", "links", "text"],
  };
  const result = await handleFunction(
    request("compare", input, validToken("comparePosts", fn)),
    params("compare", fn),
    () => posts,
    config,
    redeemed,
  );
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), comparePosts(input, posts));
  const catalog = await handleFunction(
    request("posts", {}, validToken("listPosts")),
    params("posts"),
    () => posts,
    config,
    redeemed,
  );
  assert.equal((await catalog.json()).length, 2);
  assert.equal(
    (
      await handleFunction(
        request("posts"),
        { ...params("posts"), version: "v9.0.0" },
        () => posts,
      )
    ).status,
    404,
  );
  assert.equal(
    (await handleFunction(request("health"), params("health"), () => posts))
      .status,
    405,
  );
  assert.equal(
    openapi(slug, "https://www.joshmayer.net").info.version,
    VERSION,
  );
});


test("browser preflight skips redemption and CORS covers success and errors", async () => {
  const browserHeaders = {
    Origin: "https://tollbit.joshmayer.net",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers":
      "content-type,x-tollbit-agent-payment-token,x-tollbit-property",
  };
  const preflight = await handleFunction(
    new Request(`https://www.joshmayer.net${prefix(slug)}/posts`, {
      method: "OPTIONS",
      headers: browserHeaders,
    }),
    params("posts"),
    () => { throw new Error("Preflight must not load posts"); },
    config,
    async () => { throw new Error("Preflight must not redeem"); },
  );
  assert.equal(preflight.status, 204);
  assert.equal(await preflight.text(), "");
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
  assert.equal(preflight.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
  for (const header of browserHeaders["Access-Control-Request-Headers"].split(",")) {
    assert.ok(preflight.headers.get("access-control-allow-headers")!.toLowerCase().split(", ").includes(header));
  }
  for (const [payment, status] of [[undefined, 402], [validToken("listPosts"), 200]] as const) {
    const result = await handleFunction(
      request("posts", {}, payment, { Origin: browserHeaders.Origin }),
      params("posts"),
      () => posts,
      config,
      redeemed,
    );
    assert.equal(result.status, status);
    assert.equal(result.headers.get("access-control-allow-origin"), "*");
    assert.equal(result.headers.get("access-control-allow-credentials"), null);
  }
});
