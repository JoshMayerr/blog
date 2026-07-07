import { chromium, type Page } from "playwright";
import { spawn, ChildProcess } from "child_process";
import { mkdir, readdir } from "fs/promises";
import { basename, extname, join } from "path";

const BASE_URL = "http://localhost:3000";
const POSTS_DIR = join(process.cwd(), "content", "posts");
const OUTPUT_DIR = join(process.cwd(), "public", "og-images");
const VIEWPORT = { width: 1200, height: 630 };
const NEXT_BIN = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "next.cmd" : "next",
);

async function getPostSlugs(): Promise<string[]> {
  const entries = await readdir(POSTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && extname(entry.name) === ".mdx")
    .map((entry) => basename(entry.name, ".mdx"))
    .sort((a, b) => a.localeCompare(b));
}

async function waitForServer(url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log("Server is ready!");
        return;
      }
    } catch {
      // Server not ready yet
    }
    console.log(`Waiting for server... (${i + 1}/${maxRetries})`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Server failed to start");
}

async function startServer(): Promise<ChildProcess> {
  console.log("Starting Next.js server...");
  const server = spawn(NEXT_BIN, ["start"], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  server.stdout?.on("data", (data) => {
    process.stdout.write(data);
  });

  server.stderr?.on("data", (data) => {
    process.stderr.write(data);
  });

  return server;
}

async function gotoOrThrow(page: Page, url: string): Promise<void> {
  const response = await page.goto(url, { waitUntil: "networkidle" });

  if (!response?.ok()) {
    throw new Error(
      `Failed to load ${url}: ${response?.status() ?? "no response"}`,
    );
  }
}

async function generateOgImages(): Promise<void> {
  let server: ChildProcess | null = null;

  try {
    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true });
    const postSlugs = await getPostSlugs();
    console.log(`Found ${postSlugs.length} posts to capture.`);

    // Start the server
    server = await startServer();

    // Wait for server to be ready
    await waitForServer(BASE_URL);

    // Launch browser
    console.log("Launching browser...");
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: VIEWPORT,
      colorScheme: "light",
    });
    const page = await context.newPage();

    // CSS to hide header and footer for cleaner screenshots
    const hideElementsCSS = `
      header, footer, nav {
        display: none !important;
      }
      main {
        padding-top: 2rem !important;
      }
    `;

    // Screenshot home page
    console.log("Capturing home page...");
    await gotoOrThrow(page, BASE_URL);
    await page.addStyleTag({ content: hideElementsCSS });
    await page.screenshot({
      path: join(OUTPUT_DIR, "home.png"),
      type: "png",
    });
    console.log("  Saved: home.png");

    // Screenshot each post
    const failedSlugs: string[] = [];

    for (const slug of postSlugs) {
      const url = `${BASE_URL}/posts/${slug}`;
      console.log(`Capturing: /posts/${slug}...`);

      try {
        await gotoOrThrow(page, url);
        await page.addStyleTag({ content: hideElementsCSS });
        await page.screenshot({
          path: join(OUTPUT_DIR, `posts-${slug}.png`),
          type: "png",
        });
        console.log(`  Saved: posts-${slug}.png`);
      } catch (error) {
        failedSlugs.push(slug);
        console.error(`  Error capturing ${slug}:`, error);
      }
    }

    await browser.close();

    if (failedSlugs.length > 0) {
      throw new Error(`Failed to capture posts: ${failedSlugs.join(", ")}`);
    }

    console.log("\nOG image generation complete!");
    console.log(`Images saved to: ${OUTPUT_DIR}`);
  } finally {
    // Clean up server
    if (server) {
      console.log("Shutting down server...");
      server.kill("SIGTERM");
    }
  }
}

generateOgImages().catch((error) => {
  console.error("Failed to generate OG images:", error);
  process.exit(1);
});
