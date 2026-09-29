import { RaceError } from "./core";
export async function readBody(
  request: Request,
  allowEmpty = false,
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) {
    if (allowEmpty) return {};
    throw new RaceError(400, "Provide JSON input.");
  }
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 8192) {
      await reader.cancel();
      throw new RaceError(413, "Request too large.");
    }
    chunks.push(value);
  }
  if (length === 0 && allowEmpty) return {};
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data;
  } catch {
    throw new RaceError(400, "Provide a JSON object.");
  }
}
export const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof RaceError
          ? error.message
          : "The race service is unavailable.",
    },
    {
      status: error instanceof RaceError ? error.status : 500,
      headers: responseHeaders,
    },
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new RaceError(403, "Cross-origin browser requests are not allowed.");
}
