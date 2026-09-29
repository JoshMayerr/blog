export const laneDefinitions = [
  {
    id: "website",
    name: "Website",
    color: "#c65732",
    detail: "Buttons & pages",
  },
  {
    id: "terminal",
    name: "Web terminal",
    color: "#9073bf",
    detail: "Commands in a browser",
  },
  { id: "cli", name: "CLI", color: "#2b857a", detail: "Commands in a shell" },
  {
    id: "webmcp",
    name: "WebMCP",
    color: "#477fc6",
    detail: "Structured browser tools",
  },
] as const;
export type LaneId = (typeof laneDefinitions)[number]["id"];
export const objectIds = ["desk", "bookshelf", "cabinet", "door"] as const;
export type ObjectId = (typeof objectIds)[number];
export const actionNames = [
  "inspectObject",
  "unlockCabinet",
  "takeKey",
  "unlockDoor",
] as const;
export type Action = (typeof actionNames)[number];
export type RoomState = {
  deskRead: boolean;
  booksRead: boolean;
  cabinetOpen: boolean;
  hasKey: boolean;
  doorOpen: boolean;
};
export type Lane = {
  id: string;
  name: string;
  interface: LaneId;
  startedAt: number;
  key: string;
  ready: boolean;
  progress: number;
  mistakes: number;
  finishedAt: number | null;
  lastAction: string;
  room: RoomState;
  attempts: {
    id: string;
    fingerprint: string;
    action?: Action;
    target?: ObjectId;
    at: number;
    correct: boolean;
    message: string;
  }[];
};
export type Race = {
  id: string;
  hostKey: string;
  createdAt: number;
  startedAt: number;
  books: string[];
  lanes: Lane[];
};
export class RaceError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function makeRoom(seed: number) {
  let state = seed >>> 0;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0);
  const books = ["red", "blue", "yellow"].flatMap((color) =>
    Array.from({ length: 1 + (random() % 5) }, () => color),
  );
  for (let i = books.length - 1; i > 0; i--) {
    const j = random() % (i + 1);
    [books[i], books[j]] = [books[j], books[i]];
  }
  return books;
}
export function publicRace(race: Race) {
  return {
    id: race.id,
    createdAt: race.createdAt,
    startedAt: race.startedAt,
    total: 5,
    lanes: race.lanes.map((lane) => ({
      id: lane.id,
      name: lane.name,
      interface: lane.interface,
      startedAt: lane.startedAt,
      ready: lane.ready,
      progress: lane.progress,
      mistakes: lane.mistakes,
      finishedAt: lane.finishedAt,
      lastAction: lane.lastAction,
      room: lane.room,
      attempts: lane.attempts
        .slice(-200)
        .map(({ at, correct, message, action, target }) => ({
          at,
          correct,
          message,
          action,
          target,
        })),
    })),
    complete:
      race.lanes.length > 0 &&
      race.lanes.every((lane) => lane.finishedAt !== null),
  };
}
export type PublicRace = ReturnType<typeof publicRace>;
export function authorizeLane(race: Race, laneId: string, key: string) {
  const lane = race.lanes.find((lane) => lane.id === laneId);
  if (!lane || lane.key !== key)
    throw new RaceError(403, "Invalid lane credentials.");
  return lane;
}
export function laneView(race: Race, lane: Lane) {
  return {
    raceId: race.id,
    laneId: lane.id,
    ready: lane.ready,
    startedAt: lane.startedAt,
    name: lane.name,
    interface: lane.interface,
    finishedAt: lane.finishedAt,
    progress: lane.progress,
    total: 5,
    mistakes: lane.mistakes,
    lastAction: lane.lastAction,
    room: {
      ...lane.room,
      objects: objectIds,
      note: lane.room.deskRead
        ? "The cabinet code is the number of RED books, then BLUE books, then YELLOW books. One digit per color."
        : null,
      books: lane.room.booksRead ? race.books : null,
      inventory: lane.room.hasKey ? ["exit-key"] : [],
    },
  };
}
export type LaneView = ReturnType<typeof laneView>;
export function actInRoom(
  race: Race,
  lane: Lane,
  action: Action,
  input: { actionId: string; objectId?: ObjectId; code?: string },
  now: number,
) {
  const fingerprint = JSON.stringify([
    action,
    input.objectId ?? null,
    input.code ?? null,
  ]);
  const prior = lane.attempts.find((event) => event.id === input.actionId);
  if (prior) {
    if (prior.fingerprint !== fingerprint)
      throw new RaceError(409, "Action ID already used with different input.");
    return; // Retry returns current state without repeating an action or penalty.
  }
  if (lane.finishedAt !== null)
    throw new RaceError(409, "You have already escaped.");
  if (lane.attempts.length >= 200)
    throw new RaceError(
      429,
      "Action limit reached. Register with a new name and key.",
    );
  let correct = true;
  let message = "";
  const room = lane.room;
  switch (action) {
    case "inspectObject":
      switch (input.objectId) {
        case "desk":
          room.deskRead = true;
          message = "Read the note on the desk";
          break;
        case "bookshelf":
          room.booksRead = true;
          message = "Examined the colored books";
          break;
        case "cabinet":
          message = room.cabinetOpen
            ? room.hasKey
              ? "The cabinet is empty"
              : "An exit key is inside the open cabinet"
            : "The cabinet has a three-digit combination lock";
          break;
        case "door":
          message = room.doorOpen
            ? "The exit is open"
            : "The exit door needs a key";
          break;
      }
      break;
    case "unlockCabinet":
      if (room.cabinetOpen) message = "The cabinet is already open";
      else if (
        input.code ===
        ["red", "blue", "yellow"]
          .map((color) => race.books.filter((book) => book === color).length)
          .join("")
      ) {
        room.cabinetOpen = true;
        message = "Unlocked the cabinet. An exit key is inside";
      } else {
        correct = false;
        message = "The cabinet code did not work";
      }
      break;
    case "takeKey":
      if (!room.cabinetOpen) {
        correct = false;
        message = "The cabinet is locked";
      } else {
        room.hasKey = true;
        message = "Picked up the exit key";
      }
      break;
    case "unlockDoor":
      if (!room.hasKey) {
        correct = false;
        message = "The exit door needs a key";
      } else {
        room.doorOpen = true;
        lane.finishedAt = now;
        message = "Unlocked the exit and escaped";
      }
      break;
  }
  lane.progress = Object.values(room).filter(Boolean).length;
  if (!correct) lane.mistakes++;
  lane.lastAction = message;
  lane.attempts.push({
    id: input.actionId,
    fingerprint,
    action,
    target:
      action === "inspectObject"
        ? input.objectId
        : action === "unlockDoor"
          ? "door"
          : "cabinet",
    at: now,
    correct,
    message,
  });
}
