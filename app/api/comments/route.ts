import { commentInput } from "@/lib/comments/input";
import { allPosts } from "contentlayer2/generated";
import { depositService } from "@/lib/comments/proxy";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const post = new URL(request.url).searchParams.get("post");
  if (!post || !allPosts.some((item) => item.slugAsParams === post))
    return Response.json({ error: "Post not found." }, { status: 404 });
  return depositService(`/v1/comments?post=${encodeURIComponent(post)}`);
}
export async function POST(request: Request) {
  const input = await commentInput(request);
  if (input instanceof Response) return input;
  if (
    !input ||
    typeof input !== "object" ||
    !allPosts.some((item) => item.slugAsParams === input.post)
  )
    return Response.json({ error: "Post not found." }, { status: 404 });
  return depositService("/v1/comments", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(request.headers.get("payment-signature")
        ? { "payment-signature": request.headers.get("payment-signature")! }
        : {}),
    },
    body: JSON.stringify({
      ...input,
      site: "joshmayer.net",
      resource: new URL("/api/comments", request.url).toString(),
    }),
  });
}
