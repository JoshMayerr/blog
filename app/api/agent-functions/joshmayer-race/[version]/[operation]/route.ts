import legacy from "@/lib/book-race/legacy-contract.json";
import { stringify } from "yaml";
import {
  bookRaceOpenapi,
  bookRaceSkill,
  bookRaceSlug,
  bookRaceVersion,
  bookRacePaths,
} from "@/lib/book-race/contract";
import {
  perform as performBook,
  parseInput as parseBookInput,
} from "@/lib/book-race/service";
import {
  raceOpenapi,
  raceSkill,
  raceSlug,
  raceVersion,
} from "@/lib/race/contract";
import { perform, parseRaceInput, type Operation } from "@/lib/race/service";
import { RaceError } from "@/lib/race/core";
import { readBody, responseHeaders } from "@/lib/race/http";
import { redeem, runtimeConfig, FunctionError } from "@/lib/tollbit/payment";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  ...responseHeaders,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-Tollbit-Agent-Payment-Token, X-Tollbit-Property",
};
type Context = { params: Promise<{ version: string; operation: string }> };
async function handle(request: Request, context: Context) {
  try {
    const { version, operation } = await context.params;
    const isLegacyBook = version === "v3.0.1";
    const isBook = isLegacyBook || version === `v${bookRaceVersion}`;
    const requestedBookVersion = version.slice(1);
    if (!isBook && version !== `v${raceVersion}`)
      throw new RaceError(404, "Unknown version.");
    const config = runtimeConfig();
    if (["openapi", "skill", "health"].includes(operation)) {
      if (request.method !== "GET")
        throw new RaceError(405, "Use GET for metadata.");
      if (operation === "health")
        return Response.json(
          {
            status: "ok",
            version: isBook ? requestedBookVersion : raceVersion,
            configured: Boolean(config.orgId && config.redeemUrl),
          },
          { headers },
        );
      return new Response(
        operation === "skill"
          ? isBook
            ? (isLegacyBook ? legacy.skill : bookRaceSkill)
            : raceSkill
          : stringify(
              isLegacyBook
                ? JSON.parse(JSON.stringify(legacy.schema).replaceAll("https://www.joshmayer.net", new URL(request.url).origin))
                : (isBook ? bookRaceOpenapi : raceOpenapi)(new URL(request.url).origin),
              { aliasDuplicateObjects: false },
            ),
        {
          headers: {
            ...headers,
            "Content-Type":
              operation === "skill" ? "text/markdown" : "application/yaml",
          },
        },
      );
    }
    if (isBook) {
      const bookOp = bookRacePaths[operation as keyof typeof bookRacePaths];
      if (!bookOp) throw new RaceError(404, "Unknown operation.");
      if (request.method !== "POST")
        throw new RaceError(405, "Use POST for agent operations.");
      if (!request.headers.get("x-tollbit-agent-payment-token"))
        throw new RaceError(
          402,
          "TollBit payment token required, including free calls.",
        );
      const input = parseBookInput(
        bookOp,
        await readBody(request, bookOp === "getSession"),
      );
      await redeem(
        request,
        bookRaceSlug,
        bookOp,
        config,
        fetch,
        requestedBookVersion,
      );
      const result = await performBook(bookOp, input);
      // Keep the old response enum while grading and recording every attempt normally.
      if (isLegacyBook && result.participant?.submission) {
        return Response.json({ ...result, participant: { ...result.participant,
          submission: { ...result.participant.submission, grading: "pending" } } }, { headers });
      }
      return Response.json(result, { headers });
    }
    const op = (
      {
        state: "inspectRace",
        register: "registerAgent",
        inspect: "inspectLane",
        "inspect-object": "inspectObject",
        "unlock-cabinet": "unlockCabinet",
        "take-key": "takeKey",
        "unlock-door": "unlockDoor",
      } as Record<string, Operation>
    )[operation];
    if (!op) throw new RaceError(404, "Unknown operation.");
    if (request.method !== "POST")
      throw new RaceError(405, "Use POST for game actions.");
    if (!request.headers.get("x-tollbit-agent-payment-token"))
      throw new RaceError(
        402,
        "TollBit payment token required, including free calls.",
      );
    const input = parseRaceInput(
      op,
      await readBody(request, op === "inspectRace"),
    );
    await redeem(request, raceSlug, op, config, fetch, raceVersion);
    return Response.json(await perform(op, input), { headers });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof RaceError || error instanceof FunctionError
            ? error.message
            : "Race service unavailable.",
      },
      {
        status:
          error instanceof RaceError || error instanceof FunctionError
            ? error.status
            : 500,
        headers,
      },
    );
  }
}
export const GET = handle;
export const POST = handle;
export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
