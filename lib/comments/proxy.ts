export async function depositService(path: string, init?: RequestInit) {
  const origin = process.env.DEPOSIT_SERVICE_URL;
  const key = process.env.DEPOSIT_SERVICE_KEY;
  if (!origin || !key) return Response.json({ error: "Comments are not configured yet." }, { status: 503 });
  try {
    const response = await fetch(new URL(path, origin), { ...init, headers: { ...Object.fromEntries(new Headers(init?.headers)), authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(55000) });
    const headers = new Headers({ "content-type": "application/json", "cache-control": "no-store" });
    for (const name of ["payment-required", "payment-response", "retry-after"]) { const value = response.headers.get(name); if (value) headers.set(name, value); }
    return new Response(await response.text(), { status: response.status, headers });
  } catch { return Response.json({ error: "Comment service unavailable. Retry the same request." }, { status: 503 }); }
}
