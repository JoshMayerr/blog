import { chromium } from "playwright";
import { spawn, ChildProcess } from "child_process";
import { mkdir } from "fs/promises";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = join(process.cwd(), "public", "og-images");
const VIEWPORT = { width: 1200, height: 630 };

// List of posts to screenshot - matches content/posts/*.mdx
const POSTS = [
  "aiweb2",
  "aiweb",
  "aiweb3",
  "bix",
  "browsers",
  "cooked",
  "internet-change",
  "la-bullet-points",
  "nullspace",
  "open",
  "preface",
  "propaganda",
  "readings",
  "so",
  "tiktok",
  "video-games",
];

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
  const server = spawn("pnpm", ["start"], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: process.cwd(),
  });

  server.stdout?.on("data", (data) => {
    const output = data.toString();
    if (output.includes("Ready")) {
      console.log("Next.js server started");
    }
  });

  server.stderr?.on("data", (data) => {
    console.error(`Server stderr: ${data}`);
  });

  return server;
}

async function generateOgImages(): Promise<void> {
  let server: ChildProcess | null = null;

  try {
    // Ensure output directory exists
    await mkdir(OUTPUT_DIR, { recursive: true });

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
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: hideElementsCSS });
    await page.screenshot({
      path: join(OUTPUT_DIR, "home.png"),
      type: "png",
    });
    console.log("  Saved: home.png");

    // Screenshot each post
    for (const slug of POSTS) {
      const url = `${BASE_URL}/posts/${slug}`;
      console.log(`Capturing: /posts/${slug}...`);

      try {
        await page.goto(url, { waitUntil: "networkidle" });
        await page.addStyleTag({ content: hideElementsCSS });
        await page.screenshot({
          path: join(OUTPUT_DIR, `posts-${slug}.png`),
          type: "png",
        });
        console.log(`  Saved: posts-${slug}.png`);
      } catch (error) {
        console.error(`  Error capturing ${slug}:`, error);
      }
    }

    await browser.close();
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
