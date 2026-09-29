import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const base = process.env.FUNC_TEST_URL || "http://localhost:3107";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${base}/func/seating`);
  await page.getByRole("button", { name: "Load example event" }).click();
  await page.getByRole("button", { name: "Add guest", exact: true }).click();
  await page.getByLabel("Guest name").fill("Robin Test");
  await page.getByRole("button", { name: "Save guest" }).click();
  await page
    .getByRole("button", { name: "Edit Robin Test", exact: true })
    .click();
  await page.getByLabel("Guest name").fill("Robin Edited");
  await page.getByRole("button", { name: "Save guest" }).click();
  await page.getByRole("button", { name: "Set up tables" }).click();
  assert.equal(
    await page.getByRole("button", { name: "Add seating rules" }).isEnabled(),
    false,
  );
  await page.getByRole("button", { name: "Add table", exact: true }).click();
  await page.getByLabel("Table name").fill("Library");
  await page.getByLabel("Seats", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Save table" }).click();
  await page.getByRole("button", { name: "Add seating rules" }).click();
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByLabel("Seating preference").selectOption("apart");
  await page.getByLabel("First guest").selectOption({ label: "Robin Edited" });
  await page.getByLabel("Second guest").selectOption({ label: "Alex Morgan" });
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("button", { name: "Review event" }).click();
  await page.getByRole("button", { name: "Create seating plan" }).click();
  await page
    .getByText("Every guest is seated and all seating rules are satisfied.")
    .waitFor();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download seating plan" }).click();
  const download = await pending;
  const result = JSON.parse(await readFile(await download.path(), "utf8"));
  assert.equal(result.status, "complete");
  assert.equal(result.totalGuests, 13);
  assert.equal(result.totalSeats, 14);
  assert.equal(
    new Set(result.tables.flatMap((t) => t.guests.map((g) => g.id))).size,
    13,
  );
  const tableFor = (name) =>
    result.tables.find((t) => t.guests.some((g) => g.name === name)).id;
  assert.equal(tableFor("Alex Morgan"), tableFor("Sam Rivera"));
  assert.notEqual(tableFor("Jamie Chen"), tableFor("Taylor Brooks"));
  assert.notEqual(tableFor("Robin Edited"), tableFor("Alex Morgan"));
  await page
    .getByRole("button", { name: "Guest directory", exact: true })
    .click();
  await page.getByLabel("Find a guest").fill("Robin");
  assert.equal(await page.locator("tbody tr").count(), 1);
  await page.getByLabel("Find a guest").fill("");
  await page.getByRole("button", { name: "By table", exact: true }).click();
  await page.screenshot({
    path: "/tmp/blog-seating-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: "/tmp/blog-seating-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Edit event", exact: true }).click();
  await page.getByRole("button", { name: "Edit rules", exact: true }).click();
  await page.getByRole("button", { name: "Add rule", exact: true }).click();
  await page.getByLabel("Seating preference").selectOption("apart");
  await page.getByRole("button", { name: "Save rule" }).click();
  await page.getByRole("button", { name: "Review event" }).click();
  await page.getByRole("button", { name: "Create seating plan" }).click();
  await page
    .getByText(
      "A keep-apart rule conflicts with guests linked by keep-together rules. Review those rules.",
    )
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Download seating plan" }).count(),
    0,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: guest/table CRUD, capacity guard, rules, valid exported seating, directory search, impossible-rule feedback, desktop/mobile, no page errors.",
  );
} finally {
  await browser.close();
}
