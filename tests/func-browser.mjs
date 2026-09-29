import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.FUNC_TEST_URL || "http://localhost:3107";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(`${base}/func/collections`);
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Review post", exact: true })
      .nth(i)
      .click();
    await page
      .getByRole("button", { name: "Add to selection", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Close details", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Arrange 2 posts" }).click();
  await page
    .getByRole("button", { name: "Move post 2 up", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add note", exact: true })
    .first()
    .click();
  await page.getByLabel("Reader note").fill("Read this first.");
  await page.getByRole("button", { name: "Done with note" }).click();
  await page.getByRole("button", { name: "Choose format" }).click();
  await page.getByLabel("Collection title").fill("Browser collection");
  await page.getByLabel("JSON collection").check();
  await page.getByLabel("Include full post text").check();
  await page.getByRole("button", { name: "Review collection" }).click();
  await page.getByRole("button", { name: "Create collection" }).click();
  await page.getByRole("region", { name: "Completed collection" }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const download = await downloadPromise;
  const fs = await import("node:fs/promises");
  const uiPacket = JSON.parse(await fs.readFile(await download.path(), "utf8"));
  assert.equal(uiPacket.items[0].note, "Read this first.");
  await page.getByRole("button", { name: "Save in this browser" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Load saved collection" }).click();
  await page.getByRole("region", { name: "Completed collection" }).waitFor();
  await page.goto(`${base}/func/comparisons`);
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Review post", exact: true })
      .nth(i)
      .click();
    await page
      .getByRole("button", { name: "Add to selection", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Close details", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "Configure comparison" }).click();
  await page.getByLabel("Shared words").check();
  await page.getByLabel("Shared references").check();
  await page.getByLabel("Side-by-side text").check();
  await page.getByRole("button", { name: "Review choices" }).click();
  await page.getByRole("button", { name: "Build comparison" }).click();
  await page.getByRole("region", { name: "Completed comparison" }).waitFor();
  const reportDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const reportDownload = await reportDownloadPromise;
  const uiComparison = JSON.parse(
    await fs.readFile(await reportDownload.path(), "utf8"),
  );
  assert.equal(uiComparison.posts.length, 2);
  assert.deepEqual(uiComparison.input.dimensions, [
    "overview",
    "terms",
    "links",
    "text",
  ]);
  await page.screenshot({
    path: "/tmp/blog-comparison-desktop.png",
    fullPage: true,
  });
  await page.goto(`${base}/func/collections`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/blog-collections-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page
    .getByLabel("Search the archive")
    .fill("not-a-real-search-result-xyz");
  assert.equal(
    await page.getByText("No posts match. Try another search or year.").count(),
    1,
  );
  await page.goto(`${base}/func`);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.screenshot({ path: "/tmp/blog-func-desktop.png", fullPage: true });
  assert.equal(await page.evaluate(() => "blogFunctions" in window), false);
  const absent = await page.request.get(`${base}/api/func`);
  assert.equal(absent.status(), 404);
  for (const slug of ["joshmayer-collections", "joshmayer-comparisons"]) {
    const health = await page.request.get(
      `${base}/api/agent-functions/${slug}/v1.0.0/health`,
    );
    assert.equal(health.status(), 200);
    const missing = await page.request.post(
      `${base}/api/agent-functions/${slug}/v1.0.0/posts`,
      { data: {} },
    );
    assert.equal(missing.status(), 402);
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: manual collections and comparisons, notes, downloads, save/reload, mobile width, removed generic bridge/API, public TollBit metadata, token enforcement; no page errors.",
  );
} finally {
  await browser.close();
}
