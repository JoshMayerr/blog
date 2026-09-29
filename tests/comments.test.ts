import assert from "node:assert/strict";
import test from "node:test";
import { depositService } from "../lib/comments/proxy";

test("comment proxy fails closed without configuration", async () => {
  const original = process.env.DEPOSIT_SERVICE_URL;
  delete process.env.DEPOSIT_SERVICE_URL;
  try { assert.equal((await depositService("/v1/comments")).status, 503); }
  finally { if (original) process.env.DEPOSIT_SERVICE_URL = original; }
});

test("comment proxy preserves x402 headers and uses the server credential", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.DEPOSIT_SERVICE_URL;
  const originalKey = process.env.DEPOSIT_SERVICE_KEY;
  process.env.DEPOSIT_SERVICE_URL = "https://deposits.example";
  process.env.DEPOSIT_SERVICE_KEY = "server-only-test-key";
  try {
    globalThis.fetch = (async (url, init) => {
      assert.equal(String(url), "https://deposits.example/v1/comments");
      assert.equal(new Headers(init?.headers).get("authorization"), "Bearer server-only-test-key");
      assert.equal(init?.cache, "no-store");
      return Response.json({ x402Version: 2 }, { status: 402, headers: { "PAYMENT-REQUIRED": "challenge", "Set-Cookie": "do-not-forward" } });
    }) as typeof fetch;
    const response = await depositService("/v1/comments", { method: "POST", headers: { authorization: "untrusted" } });
    assert.equal(response.status, 402);
    assert.equal(response.headers.get("payment-required"), "challenge");
    assert.equal(response.headers.get("set-cookie"), null);
    globalThis.fetch = (async () => { throw new Error("network error containing private connection details"); }) as typeof fetch;
    const unavailable = await depositService("/v1/comments");
    assert.equal(unavailable.status, 503);
    assert.doesNotMatch(await unavailable.text(), /private connection/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl) process.env.DEPOSIT_SERVICE_URL = originalUrl; else delete process.env.DEPOSIT_SERVICE_URL;
    if (originalKey) process.env.DEPOSIT_SERVICE_KEY = originalKey; else delete process.env.DEPOSIT_SERVICE_KEY;
  }
});
