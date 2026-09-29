import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = process.env.BOOK_RACE_TEST_ORIGIN || "http://localhost:3217";
if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
  throw new Error("Smoke test only runs against local instances.");
async function api(operation, params = {}) {
  const r = await fetch(origin + "/func/race/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...params }),
  });
  const data = await r.json();
  assert.equal(r.ok, true, JSON.stringify(data));
  return data;
}
let state = await (await fetch(origin + "/func/race/api")).json();
state = await api("reset", { sessionId: state.sessionId });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(origin + "/func/race/join");
  await page.getByRole("dialog", { name: "Open the book" }).waitFor();
  await page.screenshot({ path: "/tmp/book-race-registration.png" });
  await page.getByLabel("Your name").fill("Browser smoke");
  await page.getByRole("button", { name: "Open book", exact: true }).click();
  await page.locator("iframe").waitFor();
  assert.equal(
    await page.getByRole("tab", { name: "Task", exact: true }).count(),
    0,
  );
  assert.equal(
    await page.getByRole("tabpanel").filter({ visible: true }).count(),
    0,
  );
  const reader = page.frameLocator("iframe");
  await reader.locator(".BRpageimage").first().waitFor({ timeout: 30000 });
  await reader
    .locator(".BRpageimage")
    .first()
    .evaluate(
      (img) =>
        new Promise((resolve, reject) => {
          if (img.complete && img.naturalWidth) return resolve(true);
          img.addEventListener("load", () => resolve(true));
          img.addEventListener("error", () => reject(new Error(img.src)));
          setTimeout(
            () => reject(new Error("Image timeout " + img.src)),
            12000,
          );
        }),
    );
  await page.waitForFunction(
    () =>
      document.querySelector("iframe[data-page]")?.getAttribute("data-page") ===
      "1",
  );
  await reader.locator(".book_right").click();
  await page.waitForFunction(
    () =>
      document.querySelector("iframe[data-page]")?.getAttribute("data-page") ===
      "2",
  );
  await page.getByRole("tab", { name: "Search", exact: true }).click();
  await page.getByLabel("Search query", { exact: true }).fill("test setup");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("button", { name: "Page 5 · Dataworx: Working with Moving Data" })
    .click();
  await page.waitForFunction(
    () =>
      document.querySelector("iframe[data-page]")?.getAttribute("data-page") ===
      "5",
  );
  await page.getByLabel("Search scope", { exact: true }).selectOption("page");
  await page.getByLabel("Search query", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByText("2 matches on this page", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Notes", exact: true }).click();
  await page.getByLabel("Fact label", { exact: true }).fill("Dataworx test");
  await page.getByLabel("Value", { exact: true }).fill("15");
  await page.getByLabel("Unit", { exact: true }).fill("instances");
  await page.getByRole("button", { name: "Save finding", exact: true }).click();
  await page.getByText("Dataworx test: 15 instances", { exact: true }).waitFor();
  await page.waitForTimeout(1000);
  assert.match(
    await page.locator("iframe[data-page]").getAttribute("data-page"),
    /5/,
  );
  await page.getByRole("tab", { name: /^Notes/ }).click();
  await page.screenshot({
    path: "/tmp/book-race-reader-desktop.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "desktop overflow",
  );
  const image = await context.request.get(origin + "/func/race/book-image/5");
  assert.equal(image.status(), 200);
  assert.match(await image.text(), /15/);
  await mkdir("tmp/pdfs/martin-zhu/game-pages", { recursive: true });
  const visual = await context.newPage();
  await visual.setViewportSize({width:850,height:1100});
  for (let n=1;n<=20;n++) {
    await visual.goto(origin + "/func/race/book-image/" + n);
    const outside = await visual.locator("svg text").evaluateAll(nodes => nodes.filter(node => {
      const b=node.getBBox(); return b.x<0 || b.y<0 || b.x+b.width>850 || b.y+b.height>1020 && node.getAttribute("y") !== "1040";
    }).map(node=>node.textContent));
    assert.deepEqual(outside,[], `page ${n} text must fit`);
    await visual.screenshot({path:`tmp/pdfs/martin-zhu/game-pages/page-${String(n).padStart(2,"0")}.png`});
  }
  await visual.close();
  await page.getByRole("tab", { name: /^Notes/ }).click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByText("Dataworx test: 15 instances", { exact: true })
    .waitFor({ state: "detached" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "mobile overflow",
  );
  await page.screenshot({
    path: "/tmp/book-race-reader-mobile.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Answer", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill("142");
  await page
    .getByRole("button", { name: "Submit final answer", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Answer submitted", exact: true })
    .waitFor();
  const spectator = await context.newPage();
  await spectator.goto(origin + "/func/race");
  await spectator.getByText("Browser smoke", { exact: true }).first().waitFor();
  await spectator.screenshot({
    path: "/tmp/book-race-spectator.png",
    fullPage: true,
  });
  const final = await (await fetch(origin + "/func/race/api")).json();
  assert.equal(final.participants[0].submission.answer, "142");
  assert.equal(final.participants[0].submission.grading, "correct");
  assert.equal(errors.length, 0, errors.join("\n"));
  state = await api("reset", { sessionId: state.sessionId });
  await page.getByRole("dialog", { name: "Open the book" }).waitFor();
  await page.getByLabel("Your name").waitFor();
  console.log(
    "PASS: immediate registration, real BookReader images, navigation, search, find, notebook save/remove, submission, spectator, reset, desktop/mobile overflow.",
  );
} catch (error) {
  await page.screenshot({ path: "/tmp/book-reader-failure.png" });
  console.log(await page.locator("body").innerText());
  throw error;
} finally {
  await browser.close();
  await api("reset", { sessionId: state.sessionId });
}
