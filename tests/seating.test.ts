import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import {
  parseSeating,
  planSeating,
  type SeatingInput,
} from "../lib/func/seating";
import { handleFunction } from "../lib/tollbit/handler";
import { openapi } from "../lib/tollbit/contracts";
const event: SeatingInput = {
  event: "Dinner",
  guests: Array.from({ length: 6 }, (_, i) => ({
    id: `g${i}`,
    name: `Guest ${i}`,
  })),
  tables: [
    { id: "a", name: "Garden", capacity: 3 },
    { id: "b", name: "Terrace", capacity: 3 },
  ],
  rules: [
    { type: "together", guestA: "g0", guestB: "g1" },
    { type: "apart", guestA: "g0", guestB: "g2" },
  ],
};
function verify(input: SeatingInput) {
  const result = planSeating(input);
  assert.equal(result.status, "complete");
  assert.deepEqual(
    result.tables.flatMap((t) => t.guests.map((g) => g.id)).sort(),
    input.guests.map((g) => g.id).sort(),
  );
  const locations = new Map(
    result.tables.flatMap((t) => t.guests.map((g) => [g.id, t.id] as const)),
  );
  for (const table of result.tables) {
    assert.ok(table.guests.length <= table.capacity);
    assert.equal(table.remaining, table.capacity - table.guests.length);
  }
  for (const rule of input.rules)
    assert.equal(
      locations.get(rule.guestA) === locations.get(rule.guestB),
      rule.type === "together",
    );
  return result;
}
test("seats every guest exactly once while respecting capacity and linked groups", () => {
  verify(event);
  verify({
    ...event,
    rules: [...event.rules, { type: "together", guestA: "g1", guestB: "g3" }],
  });
});
test("reports genuine infeasibility, transitive contradictions, and search exhaustion distinctly", () => {
  assert.equal(
    planSeating({ ...event, tables: event.tables.slice(0, 1) }).status,
    "infeasible",
  );
  assert.equal(
    planSeating({
      ...event,
      rules: [...event.rules, { type: "together", guestA: "g1", guestB: "g2" }],
    }).status,
    "infeasible",
  );
  const triangle = [
    ["g0", "g1"],
    ["g1", "g2"],
    ["g2", "g0"],
  ].map(([guestA, guestB]) => ({ type: "apart" as const, guestA, guestB }));
  const impossible = planSeating({ ...event, rules: triangle });
  assert.equal(impossible.status, "infeasible");
  assert.deepEqual(impossible.tables, []);
  const limited = planSeating(event, 1);
  assert.equal(limited.status, "search_limit");
  assert.deepEqual(limited.tables, []);
});
test("rejects invalid IDs, references, capacities and counts", () => {
  for (const input of [
    { ...event, guests: [] },
    { ...event, guests: [event.guests[0], event.guests[0]] },
    { ...event, tables: [{ id: "a", name: "A", capacity: 1.5 }] },
    { ...event, rules: [{ type: "apart", guestA: "g0", guestB: "missing" }] },
    { ...event, rules: [{ type: "apart", guestA: "g0", guestB: "g0" }] },
    { ...event, event: " " },
  ])
    assert.throws(() => parseSeating(input));
});
test("agrees with brute force for every apart-rule graph on four guests and two tables", () => {
  const pairs = [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [1, 3],
    [2, 3],
  ];
  for (let mask = 0; mask < 64; mask++) {
    const rules = pairs.filter((_, i) => mask & (1 << i));
    let feasible = false;
    for (let allocation = 0; allocation < 16; allocation++) {
      const seat = [0, 1, 2, 3].map((i) => (allocation >> i) & 1);
      if (seat.reduce((sum, n) => sum + n, 0) !== 2) continue;
      if (rules.every(([a, b]) => seat[a] !== seat[b])) feasible = true;
    }
    const input = {
      ...event,
      guests: event.guests.slice(0, 4),
      tables: event.tables.map((t) => ({ ...t, capacity: 2 })),
      rules: rules.map(([a, b]) => ({
        type: "apart" as const,
        guestA: `g${a}`,
        guestB: `g${b}`,
      })),
    };
    assert.equal(
      planSeating(input).status === "complete",
      feasible,
      `graph ${mask}`,
    );
    if (feasible) verify(input);
  }
});
test("TollBit contract and operation are separate from the archive and redeem before solving", async () => {
  const spec = openapi("joshmayer-seating", "https://www.joshmayer.net");
  assert.deepEqual(
    parse(
      await readFile("agent-functions/joshmayer-seating/openapi.yaml", "utf8"),
    ),
    JSON.parse(JSON.stringify(spec)),
  );
  assert.ok(!Object.hasOwn(spec.paths, "/posts"));
  const rid = "org-test/joshmayer-seating/1.0.0/planSeating";
  const token = `e30.${Buffer.from(JSON.stringify({ payee: { rid } })).toString("base64url")}.c2ln`;
  const params = {
    function: "joshmayer-seating",
    version: "v1.0.0",
    operation: "plan",
  };
  const posts = () => {
    throw new Error("Seating must not load blog data");
  };
  let redeems = 0;
  const fetcher: typeof fetch = async (_, init) => {
    redeems++;
    assert.equal(JSON.parse(init!.body as string).rid, rid);
    return Response.json({ status: "redeemed", settlement: "none" });
  };
  const request = (payment?: string) =>
    new Request(
      "http://localhost/api/agent-functions/joshmayer-seating/v1.0.0/plan",
      {
        method: "POST",
        headers: payment ? { "x-tollbit-agent-payment-token": payment } : {},
        body: JSON.stringify(event),
      },
    );
  assert.equal(
    (await handleFunction(request(), params, posts, {}, fetcher)).status,
    402,
  );
  const response = await handleFunction(
    request(token),
    params,
    posts,
    { orgId: "org-test", redeemUrl: "https://example.test/redeem" },
    fetcher,
  );
  assert.equal(response.status, 200);
  assert.equal(redeems, 1);
  assert.deepEqual(await response.json(), planSeating(event));
  const denied = await handleFunction(
    request(token),
    params,
    posts,
    { orgId: "org-test", redeemUrl: "https://example.test/redeem" },
    async () => new Response("", { status: 401 }),
  );
  assert.equal(denied.status, 401);
});
