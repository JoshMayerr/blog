import { NextResponse } from "next/server";
import { perform, parseInput } from "@/lib/book-race/service";
import {
  sameOrigin,
  readBody,
  failure,
  responseHeaders,
} from "@/lib/race/http";
import { RaceError } from "@/lib/book-race/core";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const raw = await readBody(request);
    const input = parseInput("getSession", raw);
    const session = await perform("getSession", input);
    if (!session.participant)
      throw new RaceError(403, "Invalid reader credentials.");
    if (session.phase !== "running")
      throw new RaceError(409, "Register to open the book.");
    const response = NextResponse.json(
      { ready: true },
      { headers: responseHeaders },
    );
    response.cookies.set(
      "book-reader-session",
      JSON.stringify({
        sessionId: input.sessionId,
        participantId: input.participantId,
        token: input.token,
      }),
      {
        httpOnly: true,
        sameSite: "strict",
        secure: new URL(request.url).protocol === "https:",
        path: "/func/race/book-image",
        maxAge: 43200,
      },
    );
    return response;
  } catch (error) {
    return failure(error);
  }
}
