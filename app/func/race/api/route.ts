import { liveSession } from "@/lib/book-race/store";
import { publicSession, RaceError } from "@/lib/book-race/core";
import {
  operations,
  perform,
  hostAction,
  type Operation,
} from "@/lib/book-race/service";
import {
  failure,
  responseHeaders,
  sameOrigin,
  readBody,
} from "@/lib/race/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(publicSession(await liveSession()), {
      headers: responseHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { operation, ...input } = await readBody(request);
    if (operation === "reset")
      return Response.json(
        await hostAction(String(operation), String(input.sessionId || "")),
        { headers: responseHeaders },
      );
    if (!operations.includes(operation as Operation))
      throw new RaceError(400, "Unknown operation.");
    return Response.json(await perform(operation as Operation, input), {
      headers: responseHeaders,
    });
  } catch (error) {
    return failure(error);
  }
}
