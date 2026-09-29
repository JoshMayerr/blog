import { parseSeating, planSeating } from "../func/seating";
import { stringify } from "yaml";
import {
  comparePosts,
  createCollection,
  listPosts,
  parseCollection,
  parseComparison,
  type BlogPost,
} from "../func/core";
import {
  functions,
  isFunctionSlug,
  openapi,
  skill,
  VERSION,
} from "./contracts";
import {
  FunctionError,
  redeem,
  runtimeConfig,
  type RuntimeConfig,
} from "./payment";
const headers = {
  // Public, token-authorized endpoints; browser callers do not use cookies.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Tollbit-Agent-Payment-Token, X-Tollbit-Property",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
function origin(request: Request) {
  const url = new URL(request.url);
  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    url.host;
  if (
    !["http", "https"].includes(protocol) ||
    !/^[a-zA-Z0-9.:[\]-]+$/.test(host)
  )
    throw new FunctionError(400, "Invalid forwarded origin.");
  return `${protocol}://${host}`;
}
async function body(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new FunctionError(400, "Provide a JSON object.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new FunctionError(413, "Request exceeds 64 KB.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new FunctionError(400, "Provide valid JSON.");
  }
}
export async function handleFunction(
  request: Request,
  params: { function: string; version: string; operation: string },
  posts: () => BlogPost[],
  config: RuntimeConfig = runtimeConfig(),
  fetcher: typeof fetch = fetch,
) {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  try {
    if (!isFunctionSlug(params.function) || params.version !== `v${VERSION}`)
      return json({ error: "Unknown function or version." }, 404);
    const slug = params.function;
    const fn = functions[slug];
    const metadata = ["health", "skill", "openapi"].includes(params.operation);
    if (metadata) {
      if (request.method !== "GET")
        return json({ error: "Use GET for metadata." }, 405);
      if (params.operation === "health")
        return json({
          status: "ok",
          version: VERSION,
          configured: Boolean(config.orgId && config.redeemUrl),
        });
      if (params.operation === "skill")
        return new Response(skill(slug), {
          headers: {
            ...headers,
            "Content-Type": "text/markdown; charset=utf-8",
          },
        });
      return new Response(
        stringify(openapi(slug, origin(request)), {
          aliasDuplicateObjects: false,
        }),
        {
          headers: {
            ...headers,
            "Content-Type": "application/yaml; charset=utf-8",
          },
        },
      );
    }
    if (
      !(slug === "joshmayer-seating" ? [fn.path] : ["posts", fn.path]).includes(
        params.operation,
      )
    )
      return json({ error: "Unknown operation." }, 404);
    if (request.method !== "POST")
      return json({ error: "Use POST for this operation." }, 405);
    if (!request.headers.get("x-tollbit-agent-payment-token")?.trim())
      throw new FunctionError(
        402,
        "A TollBit payment token is required, including for free calls.",
      );
    const input: unknown = await body(request);
    const catalog = slug === "joshmayer-seating" ? [] : posts();
    const operation = params.operation === "posts" ? "listPosts" : fn.action;
    // Validate before redeeming, so invalid requests never consume a token.
    try {
      if (operation === "planSeating") parseSeating(input);
      else if (operation === "createCollection")
        parseCollection(input, catalog);
      else if (operation === "comparePosts") parseComparison(input, catalog);
      else listPosts(input, catalog);
    } catch (error) {
      throw new FunctionError(400, (error as Error).message);
    }
    await redeem(request, slug, operation, config, fetcher);
    if (operation === "planSeating") return json(planSeating(input));
    if (operation === "createCollection")
      return json(createCollection(input, catalog));
    if (operation === "comparePosts") return json(comparePosts(input, catalog));
    return json(listPosts(input, catalog));
  } catch (error) {
    if (error instanceof FunctionError)
      return json({ error: error.message }, error.status);
    return json({ error: "The function could not complete the request." }, 500);
  }
}
