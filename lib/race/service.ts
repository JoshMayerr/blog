import { randomUUID } from "node:crypto";
import {
  authorizeLane,
  actInRoom,
  actionNames,
  objectIds,
  type ObjectId,
  type Lane,
  laneView,
  publicRace,
  laneDefinitions,
  RaceError,
  type LaneId,
  type LaneView,
  type PublicRace,
} from "./core";
import { liveRace, updateRace } from "./store";
export const operations = [
  "inspectRace",
  "registerAgent",
  "inspectLane",
  ...actionNames,
] as const;
export type Operation = (typeof operations)[number];
export type RaceInput = {
  raceId?: string;
  laneId?: string;
  laneKey?: string;
  name?: string;
  interface?: LaneId;
  registrationKey?: string;
  actionId?: string;
  objectId?: ObjectId;
  code?: string;
};
export function parseRaceInput(
  operation: Operation,
  input: unknown,
): RaceInput {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new RaceError(400, "Provide an object.");
  const data = input as Record<string, unknown>;
  const fields =
    operation === "inspectRace"
      ? []
      : operation === "registerAgent"
        ? ["raceId", "name", "interface", "registrationKey"]
        : [
            "raceId",
            "laneId",
            "laneKey",
            ...(operation !== "inspectLane" ? ["actionId"] : []),
            ...(operation === "inspectObject" ? ["objectId"] : []),
            ...(operation === "unlockCabinet" ? ["code"] : []),
          ];
  if (Object.keys(data).some((key) => !fields.includes(key)))
    throw new RaceError(400, "Unknown input field.");
  for (const key of fields)
    if (
      typeof data[key] !== "string" ||
      !(data[key] as string).trim() ||
      (data[key] as string).length > 120
    )
      throw new RaceError(400, `Invalid ${key}.`);
  if (operation === "registerAgent") {
    if ((data.name as string).trim().length > 60)
      throw new RaceError(400, "Name must be at most 60 characters.");
    if (!laneDefinitions.some((lane) => lane.id === data.interface))
      throw new RaceError(400, "Choose website, terminal, cli, or webmcp.");
    if (!/^[a-zA-Z0-9_-]{24,100}$/.test(data.registrationKey as string))
      throw new RaceError(
        400,
        "Supply a private random registrationKey of 24–100 letters, digits, underscores or hyphens. Reuse it only when retrying this registration.",
      );
  }
  if (
    operation === "inspectObject" &&
    !objectIds.includes(data.objectId as ObjectId)
  )
    throw new RaceError(400, "Choose desk, bookshelf, cabinet, or door.");
  if (operation === "unlockCabinet" && !/^[0-9]{3}$/.test(data.code as string))
    throw new RaceError(400, "Provide a three-digit code string.");
  if (data.actionId && !/^[a-zA-Z0-9_-]{16,100}$/.test(data.actionId as string))
    throw new RaceError(
      400,
      "Provide a unique actionId (random UUID); reuse only for retries.",
    );
  return data as RaceInput;
}
export function perform(
  operation: "registerAgent",
  input: RaceInput,
): Promise<LaneView & { laneKey: string }>;
export function perform(
  operation: "inspectRace",
  input: RaceInput,
): Promise<PublicRace>;
export function perform(
  operation: Exclude<Operation, "registerAgent" | "inspectRace">,
  input: RaceInput,
): Promise<LaneView>;
export function perform(
  operation: Operation,
  input: RaceInput,
): Promise<PublicRace | LaneView | (LaneView & { laneKey: string })>;
export async function perform(operation: Operation, input: RaceInput) {
  const current = await liveRace();
  if (operation === "inspectRace") return publicRace(current);
  if (current.id !== input.raceId)
    throw new RaceError(
      409,
      "This round has been reset. Register again in the current round.",
    );
  if (operation === "inspectLane")
    return laneView(
      current,
      authorizeLane(current, input.laneId!, input.laneKey!),
    );
  return updateRace("live", (race) => {
    if (race.id !== input.raceId)
      throw new RaceError(
        409,
        "This round has been reset. Register again in the current round.",
      );
    if (operation === "registerAgent") {
      const existing = race.lanes.find(
        (lane) => lane.key === input.registrationKey,
      );
      if (existing) {
        if (
          existing.name !== input.name!.trim() ||
          existing.interface !== input.interface
        )
          throw new RaceError(
            409,
            "Registration key already used with different details.",
          );
        return { ...laneView(race, existing), laneKey: existing.key };
      }
      if (race.lanes.length >= 100)
        throw new RaceError(429, "This round is full. Ask the host to reset.");
      const lane: Lane = {
        id: randomUUID(),
        name: input.name!.trim(),
        interface: input.interface!,
        key: input.registrationKey!,
        ready: true,
        startedAt: Date.now(),
        progress: 0,
        mistakes: 0,
        finishedAt: null,
        lastAction: "Entered the room",
        room: {
          deskRead: false,
          booksRead: false,
          cabinetOpen: false,
          hasKey: false,
          doorOpen: false,
        },
        attempts: [],
      };
      race.lanes.push(lane);
      return { ...laneView(race, lane), laneKey: lane.key };
    }
    const lane = authorizeLane(race, input.laneId!, input.laneKey!);
    actInRoom(
      race,
      lane,
      operation,
      { actionId: input.actionId!, objectId: input.objectId, code: input.code },
      Date.now(),
    );
    return laneView(race, lane);
  });
}
