import assert from "node:assert/strict";
import test from "node:test";
import { parse, stringify } from "yaml";
import { bookRaceOpenapi, bookRacePaths } from "../lib/book-race/contract";

test("book functions expose exactly the participant capabilities with zero prices and typed inputs", () => {
  const document = bookRaceOpenapi("https://example.test");
  const operations = Object.entries(document.paths).flatMap(
    ([path, endpoint]) =>
      "post" in endpoint ? [{ path, operation: endpoint.post }] : [],
  );
  assert.equal(operations.length, 12);
  assert.deepEqual(
    operations.map((x) => x.operation.operationId).sort(),
    Object.values(bookRacePaths).sort(),
  );
  for (const { operation } of operations) {
    assert.equal(operation["x-tollbit"].price.priceMicros, 0);
    assert.equal(
      operation.requestBody.content["application/json"].schema
        .additionalProperties,
      false,
    );
    assert.ok(
      operation.parameters.some(
        (p) => p.name === "x-tollbit-agent-payment-token" && p.required,
      ),
    );
    assert.ok(
      !/admin|reset|spectator|reveal|startSession|joinLobby|setReady|waitForStart/i.test(
        operation.operationId,
      ),
    );
  }
  const encoded = stringify(document, { aliasDuplicateObjects: false });
  assert.ok(!/[&*]a\d+/.test(encoded), "published YAML must not use anchors");
  assert.deepEqual(parse(encoded), document);
});

test("real terminal operations need only flat scalar inputs", () => {
  const document = bookRaceOpenapi("https://example.test");
  for (const endpoint of Object.values(document.paths)) {
    if (!("post" in endpoint)) continue;
    const properties =
      endpoint.post.requestBody.content["application/json"].schema.properties;
    for (const schema of Object.values(properties)) {
      assert.ok(
        ["string", "number", "integer", "boolean"].includes(
          (schema as { type: string }).type,
        ),
      );
    }
  }
});

import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { perform, type Operation, type Input } from "../lib/book-race/service";

type Schema = {
  type: string;
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  items?: Schema;
  enum?: unknown[];
};
function validate(value: unknown, schema: Schema, location = "response") {
  if (value === null && schema.nullable) return;
  if (schema.type === "object") {
    assert.ok(
      value && typeof value === "object" && !Array.isArray(value),
      location,
    );
    const data = value as Record<string, unknown>;
    for (const name of schema.required || [])
      assert.ok(name in data, `${location}.${name} required`);
    for (const [name, item] of Object.entries(data)) {
      if (schema.additionalProperties === false)
        assert.ok(schema.properties?.[name], `${location}.${name} unexpected`);
      if (schema.properties?.[name])
        validate(item, schema.properties[name], `${location}.${name}`);
    }
  } else if (schema.type === "array") {
    assert.ok(Array.isArray(value), location);
    value.forEach((item, i) =>
      validate(item, schema.items!, `${location}[${i}]`),
    );
  } else if (schema.type === "integer")
    assert.ok(Number.isInteger(value), location);
  else assert.equal(typeof value, schema.type, location);
  if (schema.enum) assert.ok(schema.enum.includes(value), `${location} enum`);
}

test("every operation's actual service response satisfies its advertised schema", async () => {
  const folder = await mkdtemp(join(tmpdir(), "book-contract-"));
  process.env.RACE_DATA_DIR = folder;
  for (const name of [
    "VERCEL",
    "RACE_REDIS_REST_URL",
    "RACE_REDIS_REST_TOKEN",
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
  ])
    delete process.env[name];
  const document = bookRaceOpenapi("https://example.test");
  const checked = new Set<string>();
  async function call(operation: Operation, input: Input) {
    const endpoint = Object.values(document.paths).find(
      (e) => "post" in e && e.post.operationId === operation,
    )!;
    assert.ok("post" in endpoint);
    const result = await perform(operation, input);
    validate(
      result,
      endpoint.post.responses["200"].content["application/json"]
        .schema as Schema,
      operation,
    );
    checked.add(operation);
    return result;
  }
  try {
    const initial = await call("getSession", {});
    const joined = await call("registerAgent", {
      sessionId: initial.sessionId,
      name: "Contract tester",
      interface: "terminal",
      requestId: randomUUID(),
    });
    const auth = {
      sessionId: joined.sessionId,
      participantId: joined.participantId!,
      token: joined.token!,
    };
    const action = () => ({ ...auth, requestId: randomUUID() });
    assert.equal(joined.task, null);
    assert.ok(joined.book);
    assert.ok(joined.participant!.joinedAt);
    await call("getBookInfo", auth);
    await call("readPage", { ...action(), page: 3 });
    await call("nextPage", action());
    await call("previousPage", action());
    await call("searchBook", { ...action(), query: "orders" });
    await call("findOnPage", { ...action(), query: "quarter" });
    const saved = await call("saveFinding", {
      ...action(),
      label: "North",
      value: "150",
      unit: "orders",
      page: 3,
    });
    await call("listFindings", auth);
    await call("removeFinding", { ...action(), findingId: saved.finding!.id });
    await call("submitAnswer", {
      ...action(),
      answer: "142",
      explanation: "(15 * 9) + (5 * 3) - (3 + 5)",
      citations: "4,5,9,12,13,16",
    });
    assert.equal(checked.size, 12);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

import {
  GET,
  POST,
} from "../app/api/agent-functions/joshmayer-race/[version]/[operation]/route";
test("runtime preserves v2 metadata and requires exact-version payment authorization for v3", async () => {
  const context = (version: string, operation: string) => ({
    params: Promise.resolve({ version, operation }),
  });
  for (const version of ["v2.0.1", "v3.0.1", "v3.1.0"]) {
    const result = await GET(
      new Request(
        `https://example.test/api/agent-functions/joshmayer-race/${version}/health`,
      ),
      context(version, "health"),
    );
    assert.equal(result.status, 200);
    assert.equal((await result.json()).version, version.slice(1));
  }
  for (const removed of ["join-lobby", "ready", "wait-for-start"]) {
    const result = await POST(
      new Request(
        `https://example.test/api/agent-functions/joshmayer-race/v3.1.0/${removed}`,
        { method: "POST" },
      ),
      context("v3.1.0", removed),
    );
    assert.equal(result.status, 404);
  }
  const endpoint =
    "https://example.test/api/agent-functions/joshmayer-race/v3.1.0/session";
  const invoke = (token?: string) =>
    POST(
      new Request(endpoint, {
        method: "POST",
        headers: token ? { "x-tollbit-agent-payment-token": token } : {},
      }),
      context("v3.1.0", "session"),
    );
  assert.equal((await invoke()).status, 402);
  assert.equal((await invoke("malformed")).status, 401);
  const previousOrg = process.env.TOLLBIT_AGENT_FUNCTION_ORG_ID;
  const previousRedeem = process.env.TOLLBIT_PAYMENT_TOKEN_REDEEM_URL;
  process.env.TOLLBIT_AGENT_FUNCTION_ORG_ID = "test-org";
  process.env.TOLLBIT_PAYMENT_TOKEN_REDEEM_URL =
    "https://example.invalid/redeem";
  try {
    const payload = Buffer.from(
      JSON.stringify({
        payee: { rid: "test-org/joshmayer-race/2.0.1/getSession" },
      }),
    ).toString("base64url");
    assert.equal((await invoke(`e30.${payload}.signature`)).status, 403);
  } finally {
    if (previousOrg === undefined)
      delete process.env.TOLLBIT_AGENT_FUNCTION_ORG_ID;
    else process.env.TOLLBIT_AGENT_FUNCTION_ORG_ID = previousOrg;
    if (previousRedeem === undefined)
      delete process.env.TOLLBIT_PAYMENT_TOKEN_REDEEM_URL;
    else process.env.TOLLBIT_PAYMENT_TOKEN_REDEEM_URL = previousRedeem;
  }
});

test("metadata endpoints declare the publisher header required by registration", () => {
  const document = bookRaceOpenapi("https://example.test");
  for (const endpoint of Object.values(document.paths)) {
    const operation = "get" in endpoint ? endpoint.get : endpoint.post;
    assert.ok(
      operation.parameters.some(
        (parameter) =>
          parameter.in === "header" && parameter.name === "x-tollbit-property",
      ),
    );
  }
});
