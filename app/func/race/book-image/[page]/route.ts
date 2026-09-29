import { pageSvg } from "@/lib/book-race/page-image";
import type { NextRequest } from "next/server";
import { perform, parseInput } from "@/lib/book-race/service";
import { book } from "@/lib/book-race/book";
import { RaceError } from "@/lib/book-race/core";
import { failure, responseHeaders } from "@/lib/race/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page: string }> },
) {
  try {
    const cookie = request.cookies.get("book-reader-session")?.value;
    if (!cookie) throw new RaceError(403, "Join the lobby to read the book.");
    let credentials;
    try {
      credentials = JSON.parse(cookie);
    } catch {
      throw new RaceError(403, "Invalid reader session.");
    }
    const session = await perform(
      "getSession",
      parseInput("getSession", credentials),
    );
    if (!session.participant)
      throw new RaceError(403, "Invalid reader credentials.");
    if (session.phase !== "running" || session.participant.submission)
      throw new RaceError(409, "The book is closed for this participant.");
    const { page: number } = await params;
    const page = book.pages.find((p) => p.page === Number(number));
    if (!page) throw new RaceError(404, "Page not found.");
    const svg = pageSvg(book.title, page);
    return new Response(svg, {
      headers: {
        ...responseHeaders,
        "Content-Type": "image/svg+xml",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
