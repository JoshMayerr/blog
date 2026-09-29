import { commentInput } from "@/lib/comments/input";
import { allPosts } from "contentlayer2/generated";
import { depositService } from "@/lib/comments/proxy";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin)
    return Response.json(
      { error: "Submit your comment from this blog." },
      { status: 403 },
    );
  const input = await commentInput(request);
  if (input instanceof Response) return input;
  if (
    !input ||
    typeof input !== "object" ||
    !allPosts.some((item) => item.slugAsParams === input.post)
  )
    return Response.json({ error: "Post not found." }, { status: 404 });
  return depositService("/v1/comments/human", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      site: "joshmayer.net",
      post: input.post,
      name: input.name,
      body: input.body,
      requestId: input.requestId,
      captchaToken: input.captchaToken,
      hostname: url.hostname,
    }),
  });
}
