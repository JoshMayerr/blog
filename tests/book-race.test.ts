import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { liveSession } from "../lib/book-race/store";
import { perform, hostAction, parseInput } from "../lib/book-race/service";
import { publicSession } from "../lib/book-race/core";

test("book race lifecycle, parity, privacy, idempotency, and concurrent isolation", async () => {
  const folder = await mkdtemp(join(tmpdir(), "book-race-"));
  process.env.RACE_DATA_DIR = folder;
  try {
    const initial = await liveSession();
    assert.equal((await perform("getSession", {})).book, null);
    const inputs = ["website", "cli", "terminal", "webmcp"].map((mode, i) => ({
      sessionId: initial.id,
      name: `Agent ${i}`,
      interface: mode,
      requestId: randomUUID(),
    }));
    const joined = await Promise.all(
      inputs.map((input) => perform("registerAgent", input)),
    );
    const auth = joined.map((j) => ({
      sessionId: j.sessionId,
      participantId: j.participantId!,
      token: j.token!,
    }));
    assert.equal((await liveSession()).participants.length, 4);
    assert.equal(
      (await perform("registerAgent", inputs[0])).participantId,
      joined[0].participantId,
    );
    assert.equal(joined[0].task, null);
    assert.equal(joined[0].phase, "running");
    assert.ok(joined[0].book);
    assert.equal(joined[0].startedAt, null);
    assert.equal("ready" in joined[0].participant!, false);
    await assert.rejects(
      perform("getSession", { ...auth[1], token: auth[0].token }),
      /credentials/,
    );
    await assert.rejects(hostAction("start", initial.id), /Unknown/);
    await assert.rejects(hostAction("end", initial.id), /Unknown/);
    assert.equal((await perform("getSession", {})).book, null);
    const read = { ...auth[0], page: 3, requestId: randomUUID() };
    assert.equal((await perform("readPage", read)).page!.page, 3);
    const next = { ...auth[0], requestId: randomUUID() };
    assert.equal((await perform("nextPage", next)).page!.page, 4);
    assert.equal((await perform("nextPage", next)).page!.page, 4);
    assert.equal(
      (await perform("getSession", auth[1])).participant!.currentPage,
      1,
    );
    await assert.rejects(perform("previousPage", next), /another action/);
    const search = await perform("searchBook", {
      ...auth[0],
      query: "Brown",
      requestId: randomUUID(),
    });
    assert.ok(search.search!.results.some((p) => p.page === 3));
    const hyphenated = await perform("searchBook", {
      ...auth[0],
      query: "teaching",
      requestId: randomUUID(),
    });
    assert.ok(hyphenated.search!.results.some((p) => p.page === 3));
    assert.ok(hyphenated.search!.results.some((p) => p.page === 4));
    const matches = await perform("findOnPage", {
      ...auth[0],
      query: "2015",
      requestId: randomUUID(),
    });
    assert.ok(matches.matches!.length);
    const finding = await perform("saveFinding", {
      ...auth[0],
      requestId: randomUUID(),
      label: "TA start year",
      value: "2015",
      unit: "year",
      page: 4,
    });
    assert.equal(finding.participant!.findings.length, 1);
    assert.equal(
      (await perform("listFindings", auth[1])).participant!.findings.length,
      0,
    );
    await assert.rejects(
      perform("removeFinding", {
        ...auth[1],
        requestId: randomUUID(),
        findingId: finding.finding!.id,
      }),
      /not found/,
    );
    const submission = {
      ...auth[0],
      requestId: randomUUID(),
      answer: "142",
    };
    await perform("submitAnswer", submission);
    await perform("submitAnswer", submission);
    await assert.rejects(
      perform("submitAnswer", { ...submission, requestId: randomUUID() }),
      /already submitted/,
    );
    await assert.rejects(
      perform("readPage", { ...read, requestId: randomUUID() }),
      /already submitted/,
    );
    const visible = publicSession(await liveSession());
    assert.ok(visible.participants[0].submission);
    assert.equal(visible.participants[0].submission!.grading,"correct");
    assert.deepEqual(visible.participants[0].submission!.citations,[]);
    assert.equal(visible.participants[0].submission!.answer, "142");
    const json = JSON.stringify(visible);
    assert.ok(auth.every((a) => !json.includes(a.token)));
    assert.equal((await perform("submitAnswer", submission)).participant!.submission!.answer, "142");
    // Another agent can keep reading after the first finishes, and late agents start independently.
    assert.equal((await perform("readPage", { ...auth[1], page: 2, requestId: randomUUID() })).page!.page, 2);
    const late = await perform("registerAgent", { ...inputs[0], requestId: randomUUID(), name: "Late agent" });
    assert.ok(late.participant!.joinedAt >= joined[0].participant!.joinedAt);
    assert.equal(late.participant!.submission, null);
    assert.equal(late.task, null);
    const wrong = await perform("submitAnswer", {...auth[1], requestId:randomUUID(), answer:"143"});
    assert.equal(wrong.participant!.submission!.grading,"incorrect");
    await assert.rejects(perform("submitAnswer", {...auth[1], requestId:randomUUID(),answer:"142"}),/already submitted/);
    await assert.rejects(hostAction("review", initial.id), /Unknown/);
    const resetResults = await Promise.allSettled([
      hostAction("reset", initial.id),
      hostAction("reset", initial.id),
    ]);
    assert.equal(
      resetResults.filter((x) => x.status === "fulfilled").length,
      1,
    );
    await assert.rejects(perform("getSession", auth[0]), /reset/);
    const fresh = await liveSession();
    assert.notEqual(fresh.id, initial.id);
    assert.equal(fresh.participants.length, 0);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("input validation supports terminal numeric flags but rejects invalid pages and oversized values", () => {
  const input = {
    sessionId: "s",
    participantId: "p",
    token: "t",
    requestId: randomUUID(),
    page: "3",
  };
  assert.equal(parseInput("readPage", input).page, 3);
  assert.throws(() => parseInput("readPage", { ...input, page: "-1" }), /page/);
  assert.throws(
    () => parseInput("readPage", { ...input, page: 999 }),
    /outside/,
  );
  assert.throws(
    () => parseInput("readPage", { ...input, adminKey: "x" }),
    /Unknown/,
  );
  assert.throws(
    () =>
      parseInput("registerAgent", {
        sessionId: "s",
        requestId: randomUUID(),
        name: "x",
        interface: "invented",
      }),
    /interface/,
  );
});
