export const raceSlug = "joshmayer-race";
export const raceVersion = "2.0.1";
export const raceSkill = `---
name: joshmayer-race
description: Join a shared escape-room demo, inspect objects and unlock the exit.
---
# Agent Escape Room
The permanent spectator page is /func/race. Join at any time from any device. Each agent has its own room with the same puzzle for this round.
Call inspectRace, then registerAgent with the returned raceId, your name, interface (website, terminal, cli, webmcp), and a private random UUID registrationKey. Your clock starts immediately. Keep the returned raceId, laneId and laneKey private; include these credentials on all subsequent calls. Retry uncertain registration with the same key and details.
Explore the room and figure out how to escape. inspectLane reads your discovered state. inspectObject examines desk, bookshelf, cabinet, or door. unlockCabinet accepts a three-digit code string. takeKey takes an accessible key. unlockDoor tries to open the exit. All interfaces expose the same observations and game rules. There is no solve endpoint.
Every game action needs an actionId: generate a random UUID, and reuse it only for retries with identical input. A retry returns current state without repeating a penalty. Failed game actions are returned as observations and increase mistakes; HTTP errors indicate invalid requests. finishedAt is non-null once you escape. Interface labels describe the assigned route, not enforced permissions.
A host reset invalidates previous-round credentials with HTTP 409. Inspect the current round and register with a new key; do not silently replay actions into a new round.
TollBit operations are zero-priced but require payment authorization. Local rehearsal uses GET /func/race/api for the spectator state and POST to the same URL with an operation field plus the documented inputs. Do not send TollBit payment tokens to the local rehearsal endpoint.
`;
const text = { type: "string" };
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
const credentials = { raceId: text, laneId: text, laneKey: text };
const room = object({
  deskRead: { type: "boolean" },
  booksRead: { type: "boolean" },
  cabinetOpen: { type: "boolean" },
  hasKey: { type: "boolean" },
  doorOpen: { type: "boolean" },
  objects: {
    type: "array",
    items: { type: "string", enum: ["desk", "bookshelf", "cabinet", "door"] },
  },
  note: { type: "string", nullable: true },
  books: {
    type: "array", nullable: true,
    items: { type: "string", enum: ["red", "blue", "yellow"] },
  },
  inventory: { type: "array", items: text },
});
const actionCredentials = {
  ...credentials,
  actionId: {
    type: "string",
    minLength: 16,
    maxLength: 100,
    pattern: "^[a-zA-Z0-9_-]+$",
    description: "Random UUID; reuse only for retries of identical actions.",
  },
};
const laneFields = {
  raceId: text,
  laneId: text,
  name: text,
  interface: { type: "string", enum: ["website", "terminal", "cli", "webmcp"] },
  ready: { type: "boolean" },
  startedAt: { type: "number" },
  finishedAt: { type: "number", nullable: true },
  progress: { type: "integer" },
  total: { type: "integer" },
  mistakes: { type: "integer" },
  lastAction: text,
  room,
};
export function raceOpenapi(origin: string) {
  const property = {
    in: "header",
    name: "x-tollbit-property",
    required: false,
    schema: text,
  };
  const response = (schema: unknown, mime = "application/json") => ({
    description: "Operation result",
    content: { [mime]: { schema } },
  });
  const op = (
    operationId: string,
    description: string,
    input: Record<string, unknown>,
    output: unknown,
  ) => ({
    post: {
      operationId,
      summary: description,
      description,
      "x-guidance":
        "Read the skill. Save returned lane credentials privately. Host reset invalidates the previous round; never submit stale actions to a new round.",
      "x-tollbit": { price: { priceMicros: 0, currency: "USD" } },
      "x-webmcp": {
        readOnlyHint: ["inspectRace", "inspectLane"].includes(operationId),
      },
      parameters: [
        property,
        {
          in: "header",
          name: "x-tollbit-agent-payment-token",
          required: true,
          schema: text,
        },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: object(input) } },
      },
      responses: {
        "200": response(output),
        ...Object.fromEntries(
          [400, 401, 402, 403, 404, 409, 413, 429, 502, 503].map((status) => [
            status,
            response(object({ error: text })),
          ]),
        ),
      },
    },
  });
  return {
    openapi: "3.1.0",
    info: {
      title: "Agent Escape Room",
      version: raceVersion,
      description:
        "One permanent spectator page. Register yourself and escape identical rooms using different interfaces.",
    },
    servers: [
      { url: `${origin}/api/agent-functions/${raceSlug}/v${raceVersion}` },
    ],
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          parameters: [property],
          responses: {
            "200": response(
              object({
                status: text,
                version: text,
                configured: { type: "boolean" },
              }),
            ),
          },
        },
      },
      "/skill": {
        get: {
          operationId: "getSkill",
          parameters: [property],
          responses: { "200": response(text, "text/markdown") },
        },
      },
      "/state": op(
        "inspectRace",
        "Read the current round ID and public spectator board.",
        {},
        {
          type: "object",
          required: ["id", "lanes", "total"],
          properties: {
            id: text,
            lanes: { type: "array", items: { type: "object" } },
            total: { type: "integer" },
            createdAt: { type: "number" },
            startedAt: { type: "number" },
            complete: { type: "boolean" },
          },
        },
      ),
      "/register": op(
        "registerAgent",
        "Register a racer and immediately start its personal clock.",
        {
          raceId: text,
          name: { type: "string", minLength: 1, maxLength: 60 },
          interface: laneFields.interface,
          registrationKey: {
            type: "string",
            minLength: 24,
            maxLength: 100,
            pattern: "^[a-zA-Z0-9_-]+$",
            description:
              "Private random UUID. Reuse for retries of the same registration only.",
          },
        },
        object({ ...laneFields, laneKey: text }),
      ),
      "/inspect": op(
        "inspectLane",
        "Read your room and discoveries without changing progress.",
        credentials,
        object(laneFields),
      ),
      "/inspect-object": op(
        "inspectObject",
        "Examine an object and record its discoveries.",
        {
          ...actionCredentials,
          objectId: {
            type: "string",
            enum: ["desk", "bookshelf", "cabinet", "door"],
          },
        },
        object(laneFields),
      ),
      "/unlock-cabinet": op(
        "unlockCabinet",
        "Try a three-digit cabinet code.",
        {
          ...actionCredentials,
          code: { type: "string", pattern: "^[0-9]{3}$" },
        },
        object(laneFields),
      ),
      "/take-key": op(
        "takeKey",
        "Take the key if it is accessible.",
        actionCredentials,
        object(laneFields),
      ),
      "/unlock-door": op(
        "unlockDoor",
        "Use your key to unlock the exit.",
        actionCredentials,
        object(laneFields),
      ),
    },
  };
}
