export function GET() {
  const key = process.env.TURNSTILE_SITE_KEY || "";
  return Response.json(
    { siteKey: /^[123]x0/.test(key) ? "" : key },
    { headers: { "Cache-Control": "no-store" } },
  );
}
