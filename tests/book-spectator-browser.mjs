import { chromium } from "playwright";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const origin = process.env.BOOK_RACE_TEST_ORIGIN || "http://localhost:3217";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(origin).hostname),
  "Local instances only",
);
const get = async () => (await fetch(`${origin}/func/race/api`)).json();
async function post(operation, input = {}) {
  const response = await fetch(`${origin}/func/race/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...input }),
  });
  const result = await response.json();
  assert.ok(response.ok, JSON.stringify(result));
  return result;
}
const state = await post("reset", {
  sessionId: (await get()).sessionId,
});
const auth = (result) => ({
  sessionId: result.sessionId,
  participantId: result.participantId,
  token: result.token,
});
const act = (who, operation, input = {}) =>
  post(operation, { ...who, requestId: randomUUID(), ...input });
const browser = await chromium.launch();
try {
  const a = auth(
    await post("registerAgent", {
      sessionId: state.sessionId,
      name: "Browser researcher",
      interface: "website",
      requestId: randomUUID(),
    }),
  );
  const b = auth(
    await post("registerAgent", {
      sessionId: state.sessionId,
      name: "Function researcher",
      interface: "webmcp",
      requestId: randomUUID(),
    }),
  );
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${origin}/func/race`);
  await act(a, "readPage", { page: 3 });
  await act(a, "saveFinding", {
    label: "North count",
    value: "150",
    unit: "orders",
    page: 3,
  });
  await act(b, "searchBook", { query: "South" });
  await act(b, "readPage", { page: 4 });
  await page.getByText("1 saved note", { exact: true }).waitFor();
  const log = page.getByRole("region", { name: "Live activity", exact: true });
  await page
    .getByRole("combobox", { name: "Agent", exact: true })
    .selectOption(a.participantId);
  assert.equal(
    await log
      .getByRole("list")
      .getByText("Function researcher", { exact: true })
      .count(),
    0,
  );
  assert.ok(
    (await log
      .getByRole("list")
      .getByText("Browser researcher", { exact: true })
      .count()) > 0,
  );
  await page
    .getByRole("button", {
      name: "Filter activity for Function researcher",
      exact: true,
    })
    .click();
  await log
    .getByRole("list")
    .getByText("Reading page 4 (printed 4)", { exact: true })
    .waitFor();
  assert.equal(
    await log
      .getByRole("list")
      .getByText("Browser researcher", { exact: true })
      .count(),
    0,
  );
  await act(a, "submitAnswer", {
    answer: "142",
    explanation: "(15 * 9) + (5 * 3) - (3 + 5)",
    citations: "4,5,9,12,13,16",
  });
  await page.getByText("142", { exact: true }).waitFor();
  await page.getByText("Successful finish #1", {exact:true}).waitFor();
  await act(b, "submitAnswer", {answer:"143"});
  await page.getByText("Answer incorrect", {exact:true}).waitFor();
  assert.equal(await page.getByText(/Successful finish #/).count(),1);
  assert.equal(await page.getByRole("button", {name:"Verify explanation"}).count(),0);
  await page.screenshot({
    path: "/tmp/book-race-multi-agent.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "spectator mobile overflow",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: immediate registration, notes, filters, visible submissions, per-agent timing, mobile layout.",
  );
} finally {
  await browser.close();
  await post("reset", { sessionId: state.sessionId });
}
