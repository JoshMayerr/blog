import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { makeRoom, publicRace, type LaneView } from "../lib/race/core";
import { liveRace, resetRace } from "../lib/race/store";
import {
  perform,
  parseRaceInput,
  type Operation,
  type RaceInput,
} from "../lib/race/service";
import {
  POST,
  GET,
} from "../app/api/agent-functions/joshmayer-race/[version]/[operation]/route";

test("escape room: concurrent registration, discoveries, locked actions, retry safety, isolation and reset", async () => {
  const folder = await mkdtemp(join(tmpdir(), "escape-test-"));
  process.env.RACE_DATA_DIR = folder;
  process.env.RACE_ADMIN_KEY = "test-private-host-key";
  try {
    const round = await liveRace();
    assert.equal((await liveRace()).id, round.id);
    const inputs = ["website", "terminal", "cli", "webmcp"].map((mode, i) => ({
      raceId: round.id,
      name: `Agent ${i}`,
      interface: mode,
      registrationKey: randomUUID(),
    }));
    const joined = await Promise.all(
      inputs.map((input) =>
        perform("registerAgent", parseRaceInput("registerAgent", input)),
      ),
    );
    assert.equal((await liveRace()).lanes.length, 4);
    assert.equal(
      (
        await perform(
          "registerAgent",
          parseRaceInput("registerAgent", inputs[0]),
        )
      ).laneId,
      joined[0].laneId,
    );
    const credentials = ({
      raceId,
      laneId,
      laneKey,
    }: (typeof joined)[number]) => ({ raceId, laneId, laneKey });
    const action = (i: number, operation: Operation, extra: RaceInput = {}) =>
      perform(
        operation,
        parseRaceInput(operation, {
          ...credentials(joined[i]),
          ...(operation !== "inspectLane" ? { actionId: randomUUID() } : {}),
          ...extra,
        }),
      ) as Promise<LaneView>;
    joined.forEach((lane) => {
      assert.equal(lane.room.note, null);
      assert.equal(lane.room.books, null);
    });
    const failureId = randomUUID();
    assert.equal(
      (await action(0, "unlockDoor", { actionId: failureId })).mistakes,
      1,
    );
    assert.equal(
      (await action(0, "unlockDoor", { actionId: failureId })).mistakes,
      1,
    );
    await assert.rejects(
      action(0, "takeKey", { actionId: failureId }),
      /different input/,
    );
    assert.equal((await action(0, "takeKey")).room.hasKey, false);
    assert.equal(
      (await action(0, "unlockCabinet", { code: "000" })).room.cabinetOpen,
      false,
    );
    const observed = await action(0, "inspectObject", { objectId: "desk" });
    assert.match(observed.room.note!, /RED/);
    assert.equal((await action(1, "inspectLane")).room.note, null);
    await assert.rejects(
      perform("inspectLane", {
        ...credentials(joined[0]),
        laneKey: joined[1].laneKey,
      }),
      /Invalid lane/,
    );
    await Promise.all(
      joined.map(async (_, i) => {
        await action(i, "inspectObject", { objectId: "desk" });
        const state = await action(i, "inspectObject", {
          objectId: "bookshelf",
        });
        const code = ["red", "blue", "yellow"]
          .map(
            (color) =>
              state.room.books!.filter((book) => book === color).length,
          )
          .join("");
        assert.ok(
          (await action(i, "unlockCabinet", { code })).room.cabinetOpen,
        );
        assert.deepEqual((await action(i, "takeKey")).room.inventory, [
          "exit-key",
        ]);
        const id = randomUUID();
        const escaped = await action(i, "unlockDoor", { actionId: id });
        assert.ok(escaped.finishedAt);
        assert.equal(escaped.progress, 5);
        assert.equal(
          (await action(i, "unlockDoor", { actionId: id })).finishedAt,
          escaped.finishedAt,
        );
        await assert.rejects(action(i, "unlockDoor"), /already escaped/);
      }),
    );
    const pub = JSON.stringify(publicRace(await liveRace()));
    joined.forEach((lane) => assert.ok(!pub.includes(lane.laneKey)));
    assert.ok(!pub.includes('"books":'));
    assert.ok(!pub.includes('"fingerprint"'));
    assert.ok(publicRace(await liveRace()).complete);
    await assert.rejects(resetRace("bad", round.id), /Invalid reset/);
    const fresh = await resetRace("test-private-host-key", round.id);
    assert.notEqual(fresh.id, round.id);
    assert.equal(fresh.lanes.length, 0);
    await assert.rejects(action(0, "inspectLane"), /reset/);
    await assert.rejects(
      resetRace("test-private-host-key", round.id),
      /already reset/,
    );
    assert.equal(
      (
        await POST(
          new Request("https://example.com/api", {
            method: "POST",
            body: "{}",
          }),
          {
            params: Promise.resolve({
              version: "v2.0.1",
              operation: "register",
            }),
          },
        )
      ).status,
      402,
    );
    const metadata = await GET(new Request("https://example.com/api"), {
      params: Promise.resolve({ version: "v2.0.1", operation: "openapi" }),
    });
    assert.equal(metadata.status, 200);
    const specText = await metadata.text();
    assert.match(specText, /unlockCabinet/);
    assert.doesNotMatch(specText, /[&*]a[0-9]+\b/, "served specs must not contain YAML aliases");
  } finally {
    await rm(folder, { recursive: true, force: true });
    delete process.env.RACE_ADMIN_KEY;
  }
});
test("room generation is deterministic, varied and has a valid three-digit code", () => {
  const rooms = new Set<string>();
  for (let seed = 0; seed < 100; seed++) {
    const room = makeRoom(seed);
    assert.deepEqual(room, makeRoom(seed));
    const code = ["red", "blue", "yellow"]
      .map((color) => room.filter((book) => book === color).length)
      .join("");
    assert.match(code, /^[1-5]{3}$/);
    rooms.add(code);
  }
  assert.ok(rooms.size > 10);
});
test("invalid actions and unknown fields are rejected", () => {
  const credentials = {
    raceId: "x",
    laneId: "x",
    laneKey: "x",
    actionId: randomUUID(),
  };
  assert.throws(() =>
    parseRaceInput("inspectObject", { ...credentials, objectId: "ceiling" }),
  );
  assert.throws(() =>
    parseRaceInput("unlockCabinet", { ...credentials, code: 123 }),
  );
  assert.throws(() =>
    parseRaceInput("unlockCabinet", {
      ...credentials,
      code: "000",
      solve: true,
    }),
  );
  assert.throws(() =>
    parseRaceInput("takeKey", { ...credentials, actionId: "short" }),
  );
  assert.throws(() =>
    parseRaceInput("registerAgent", {
      raceId: "x",
      name: "a",
      interface: "cli",
      registrationKey: "short",
    }),
  );
});


test("bodyless inspect calls are accepted while required and malformed input stays rejected", async () => {
  const { readBody } = await import("../lib/race/http");
  assert.deepEqual(await readBody(new Request("https://example.com", { method: "POST" }), true), {});
  assert.deepEqual(await readBody(new Request("https://example.com", { method: "POST", body: "" }), true), {});
  await assert.rejects(readBody(new Request("https://example.com", { method: "POST" })), /Provide JSON/);
  await assert.rejects(readBody(new Request("https://example.com", { method: "POST", body: "bad" }), true), /JSON object/);
});
