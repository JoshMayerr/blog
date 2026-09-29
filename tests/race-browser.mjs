import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const base = process.env.RACE_TEST_URL || "http://localhost:3217";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const errors = [];
context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
const api = `${base}/func/race/api`;
const post = async (data) => {
  const response = await context.request.post(api, { data });
  assert.ok(response.ok(), await response.text());
  return response.json();
};
const state = async () => (await context.request.get(api)).json();
// Invalid reset creates the private local admin key but must not clear the board.
await context.request.post(api, {
  data: { operation: "reset", raceId: (await state()).id, adminKey: "invalid" },
});
const key =
  process.env.RACE_ADMIN_KEY ||
  (await readFile(".race-data/admin-key", "utf8")).trim();
await post({ operation: "reset", raceId: (await state()).id, adminKey: key });
const board = await context.newPage();
await board.goto(`${base}/func/race`);
await board.getByRole("heading", { name: "The room is ready." }).waitFor();
const player = await context.newPage();
await player.goto(`${base}/func/race/join`);
await player
  .getByRole("textbox", { name: "Agent name" })
  .fill("Browser on laptop");
await player.getByRole("button", { name: "Register & enter" }).click();
await player
  .getByRole("button", { name: "Inspect desk", exact: true })
  .waitFor();
// Separate contexts represent independent devices.
const terminalContext = await browser.newContext();
terminalContext.on("page", (p) =>
  p.on("pageerror", (e) => errors.push(e.message)),
);
const terminal = await terminalContext.newPage();
await terminal.goto(`${base}/func/race/join?interface=terminal`);
await terminal
  .getByRole("textbox", { name: "Terminal command" })
  .fill("join Terminal on desktop");
await terminal.getByRole("button", { name: "Run" }).click();
await terminal.getByText("IN THE ROOM", { exact: true }).waitFor();
const current = await state();
const cli = await post({
  operation: "registerAgent",
  raceId: current.id,
  name: "CLI on another machine",
  interface: "cli",
  registrationKey: randomUUID(),
});
const nativeContext = await browser.newContext();
nativeContext.on("page", (p) =>
  p.on("pageerror", (e) => errors.push(e.message)),
);
const native = await nativeContext.newPage();
await native.addInitScript(() => {
  window.raceTools = {};
  Object.defineProperty(navigator, "modelContext", {
    value: {
      registerTool(tool) {
        window.raceTools[tool.name] = tool;
      },
      unregisterTool(name) {
        delete window.raceTools[name];
      },
    },
  });
});
await native.goto(`${base}/func/race/join?interface=webmcp`);
await native.waitForFunction(() => window.raceTools.race_register);
await native.evaluate(() =>
  window.raceTools.race_register.execute({ name: "WebMCP test driver" }),
);
await native.getByText("IN THE ROOM", { exact: true }).waitFor();
const credentials = ({ raceId, laneId, laneKey }) => ({
  raceId,
  laneId,
  laneKey,
});
const saved = (page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("escape-driver")));
const code = (view) =>
  ["red", "blue", "yellow"]
    .map((color) => view.room.books.filter((book) => book === color).length)
    .join("");
const progress = (page, n) =>
  page.waitForFunction(
    (expected) =>
      JSON.parse(sessionStorage.getItem("escape-driver"))?.progress ===
      expected,
    n,
  );
const command = async (text) => {
  await terminal.getByRole("textbox", { name: "Terminal command" }).fill(text);
  await terminal.getByRole("button", { name: "Run" }).click();
};
// Website: observe only visible clues, then act through controls.
await player.getByRole("button", { name: "Inspect desk", exact: true }).click();
await progress(player, 1);
await player
  .getByRole("button", { name: "Inspect bookshelf", exact: true })
  .click();
await progress(player, 2);
const visibleBooks = await player.locator(".escape-book").allTextContents();
const webCode = ["red", "blue", "yellow"]
  .map((color) => visibleBooks.filter((book) => book === color).length)
  .join("");
await player.getByRole("textbox", { name: "Cabinet code" }).fill("000");
await player
  .getByRole("button", { name: "Unlock cabinet", exact: true })
  .click();
await player.getByRole("status").filter({ hasText: "did not work" }).waitFor();
await player.getByRole("textbox", { name: "Cabinet code" }).fill(webCode);
await player
  .getByRole("button", { name: "Unlock cabinet", exact: true })
  .click();
await progress(player, 3);
await player
  .getByRole("button", { name: "Take exit key", exact: true })
  .click();
await progress(player, 4);
await player
  .getByRole("button", { name: "Unlock exit door", exact: true })
  .click();
await player.getByRole("heading", { name: "You escaped." }).waitFor();
await command("inspect desk");
await progress(terminal, 1);
await command("inspect bookshelf");
await progress(terminal, 2);
await command(`unlock ${code(await saved(terminal))}`);
await progress(terminal, 3);
await command("take key");
await progress(terminal, 4);
await command("open door");
await progress(terminal, 5);
const cliAct = (operation, extra = {}) =>
  post({ operation, ...credentials(cli), actionId: randomUUID(), ...extra });
await cliAct("inspectObject", { objectId: "desk" });
const observed = await cliAct("inspectObject", { objectId: "bookshelf" });
await cliAct("unlockCabinet", { code: code(observed) });
await cliAct("takeKey");
assert.ok((await cliAct("unlockDoor")).finishedAt);
const nativeAct = async (tool, input = {}) => {
  const result = await native.evaluate(
    ({ tool, input }) => window.raceTools[tool].execute(input),
    { tool, input },
  );
  assert.ok(!result.isError, JSON.stringify(result));
  return JSON.parse(result.content[0].text);
};
await nativeAct("race_inspect_object", { objectId: "desk" });
await progress(native, 1);
const nv = await nativeAct("race_inspect_object", { objectId: "bookshelf" });
await progress(native, 2);
await nativeAct("race_unlock_cabinet", { code: code(nv) });
await progress(native, 3);
await nativeAct("race_take_key");
await progress(native, 4);
await nativeAct("race_unlock_door");
await progress(native, 5);
await board.getByText("4 registered agents").waitFor();
await board.waitForTimeout(1600);
await board.screenshot({ path: "/tmp/escape-desktop.png", fullPage: true });
await board.setViewportSize({ width: 390, height: 844 });
await board.screenshot({ path: "/tmp/escape-mobile.png", fullPage: true });
assert.ok(
  await board.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth,
  ),
);
assert.ok((await state()).complete);
const previous = await saved(player);
await post({ operation: "reset", raceId: previous.raceId, adminKey: key });
await board.getByRole("heading", { name: "The room is ready." }).waitFor();
await player.getByRole("button", { name: "Register & enter" }).waitFor();
const stale = await context.request.post(api, {
  data: {
    operation: "unlockDoor",
    ...credentials(previous),
    actionId: randomUUID(),
  },
});
assert.equal(stale.status(), 409);
assert.deepEqual(errors, []);
console.log(
  "PASS: self-registration from independent browser contexts, website/terminal/HTTP/mock native callbacks, personal timers, live board, protected reset, old-round isolation, mobile layout.",
);
await browser.close();
