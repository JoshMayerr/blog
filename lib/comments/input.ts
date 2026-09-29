// Bound bytes while reading, rather than buffering an arbitrary body first.
export async function commentInput(
  request: Request,
): Promise<Record<string, unknown> | Response> {
  const limit = 16000;
  const tooLarge = () =>
    Response.json({ error: "Comment request is too large." }, { status: 413 });
  const size = request.headers.get("content-length");
  if (size && Number(size) > limit) return tooLarge();
  if (!request.body)
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        return tooLarge();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    const input: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error();
    return input as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  } finally {
    reader.releaseLock();
  }
}
