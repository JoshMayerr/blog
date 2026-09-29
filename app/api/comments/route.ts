import { allPosts } from "contentlayer2/generated";
import { depositService } from "@/lib/comments/proxy";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: Request) {
  const post = new URL(request.url).searchParams.get("post");
  if (!post || !allPosts.some(item => item.slugAsParams === post)) return Response.json({ error: "Post not found." }, { status: 404 });
  return depositService(`/v1/comments?post=${encodeURIComponent(post)}`);
}
export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > 16000) return Response.json({ error: "Comment request is too large." }, { status: 413 });
  let input;
  try { input = JSON.parse(text); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
  if (!input || typeof input !== "object" || !allPosts.some(item => item.slugAsParams === input.post)) return Response.json({ error: "Post not found." }, { status: 404 });
  return depositService("/v1/comments", { method: "POST", headers: { "content-type": "application/json", ...(request.headers.get("payment-signature") ? { "payment-signature": request.headers.get("payment-signature")! } : {}) }, body: JSON.stringify({ ...input, site: "joshmayer.net", resource: new URL("/api/comments", request.url).toString() }) });
}
