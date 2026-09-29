import { getFunctionPosts } from "@/lib/func/posts";
import { handleFunction } from "@/lib/tollbit/handler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = {
  params: Promise<{ function: string; version: string; operation: string }>;
};
export async function GET(request: Request, context: Context) {
  return handleFunction(request, await context.params, getFunctionPosts);
}
export async function POST(request: Request, context: Context) {
  return handleFunction(request, await context.params, getFunctionPosts);
}

export async function OPTIONS(request: Request, context: Context) {
  return handleFunction(request, await context.params, getFunctionPosts);
}
