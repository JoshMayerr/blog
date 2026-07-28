export async function GET() {
  return new Response("403 Forbidden Access", {
    status: 403,
  });
}
