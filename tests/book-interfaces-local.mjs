// Local integration of the real CLI, terminal, native WebMCP, and book runtime.
// Only TollBit identity/catalog/payment services are fixtures; book routes are real.
import assert from "node:assert/strict";
import { createServer as httpServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
const exec = promisify(execFile);
const frontend =
  process.env.TERMINAL_SOURCE ||
  "/Users/joshmayer/Developer/tollbit/worktrees/web-terminal-webmcp/frontend-monorepo";
const cliSource =
  process.env.TOLLBIT_CLI_SOURCE ||
  "/Users/joshmayer/Developer/tollbit/tollbit-cli";
const root = process.cwd();
const temp = await mkdtemp(join(tmpdir(), "book-interfaces-"));
const app = "http://localhost:3229",
  services = "http://localhost:3230",
  terminal = "http://localhost:3231";
const slug = "joshmayer-race";
let server, vite, child, browser;
let appLogs = "";
const pendingTokens = new Map();
const jwt = (payload) =>
  `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.bG9jYWw`;
const identity = jwt({
  exp: Math.floor(Date.now() / 1000) + 3600,
  sub: "local-smoke",
  tbt: "agent-token",
});
const item = {
  functionSlug: slug,
  name: "Book research",
  partnerSlug: "local-test",
  version: "3.1.0",
  baseUrl: app + "/api/agent-functions/" + slug + "/v3.1.0",
};
async function until(fn) {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fn();
      if (r) return r;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Timed out");
}
async function post(operation, input = {}) {
  const r = await fetch(app + "/func/race/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation, ...input }),
  });
  assert(r.ok);
  return r.json();
}
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
try {
  server = httpServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    if (req.method === "OPTIONS") {
      res.end();
      return;
    }
    let raw = "";
    for await (const part of req) raw += part;
    const body = raw ? JSON.parse(raw) : {};
    const path = new URL(req.url, services).pathname;
    let data;
    if (path.endsWith("/tokens/identity")) data = { token: identity };
    else if (path.endsWith("/list-fns") || path.endsWith("/index"))
      data = { functions: [item] };
    else if (path.endsWith("/openapi")) {
      res.setHeader("content-type", "application/yaml");
      res.end(await (await fetch(item.baseUrl + "/openapi")).text());
      return;
    } else if (path.endsWith("/skill")) {
      res.end(await (await fetch(item.baseUrl + "/skill")).text());
      return;
    } else if (path.endsWith("/payment-tokens")) {
      const rid = `local-test/${slug}/3.1.0/${body.operationId}`;
      const token = jwt({ payee: { rid }, jti: randomUUID() });
      pendingTokens.set(token, rid);
      data = { token };
    } else if (path === "/redeem") {
      assert.equal(pendingTokens.get(body.token), body.rid);
      pendingTokens.delete(body.token);
      data = { status: "redeemed", settlement: "none" };
    } else {
      res.statusCode = 404;
      data = { error: "Unknown fixture route " + path };
      console.log("Unmapped service route", path);
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(data));
  });
  await new Promise((r) => server.listen(3230, "127.0.0.1", r));
  const env = {
    ...process.env,
    RACE_DATA_DIR: temp,
    VERCEL: "",
    RACE_REDIS_REST_URL: "",
    RACE_REDIS_REST_TOKEN: "",
    KV_REST_API_URL: "",
    KV_REST_API_TOKEN: "",
    TOLLBIT_AGENT_FUNCTION_ORG_ID: "local-test",
    TOLLBIT_PAYMENT_TOKEN_REDEEM_URL: services + "/redeem",
  };
  child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--port", "3229"],
    { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  child.stdout.on("data", (d) => (appLogs += d));
  child.stderr.on("data", (d) => (appLogs += d));
  await until(async () => (await fetch(app + "/func/race/api")).ok);
  console.log("Isolated book runtime ready");
  if (!process.env.SKIP_BROWSER)
    await exec(process.execPath, ["tests/book-race-browser.mjs"], {
      cwd: root,
      env: { ...process.env, BOOK_RACE_TEST_ORIGIN: app },
      timeout: 120000,
    });
  if (!process.env.SKIP_BROWSER)
    console.log(
      "PASS browser: registration, reader, search, notebook, submission, reset",
    );
  const { createServer } = await import(
    frontend + "/node_modules/vite/dist/node/index.js"
  );
  process.env.VITE_AUTH_BASE_URL = services;
  process.env.VITE_FOUNDRY_BASE_URL = services + "/foundry";
  process.env.VITE_TOLLBIT_BASE_URL = services + "/tollbit";
  let renderPage;
  vite = await createServer({
    plugins: [
      {
        name: "local-book-terminal",
        configureServer(s) {
          s.middlewares.use(async (req, res, next) => {
            if (req.url !== "/") {
              next();
              return;
            }
            res.setHeader("content-type", "text/html");
            res.end(await s.transformIndexHtml("/", renderPage()));
          });
        },
      },
    ],
    root: frontend + "/apps/web-terminal",
    configFile: false,
    logLevel: "error",
    server: { host: "127.0.0.1", port: 3231, strictPort: true },
  });
  const { renderDevelopmentWebTerminal } = await vite.ssrLoadModule(
    "/dev-web-terminal-renderer.ts",
  );
  const shell = await readFile(
    frontend + "/apps/web-terminal/public/web-terminal.html",
    "utf8",
  );
  const pageData = {
    publisherDomain: "joshmayer.net",
    targetUrl: app + "/func/race/join",
    initialNavItems: [],
    linkSourceRegions: [],
    licenseOffer: null,
    initialAgentFns: [item],
    presentationMode: "function-entry",
    focusFunctionSlug: slug,
  };
  renderPage = () =>
    renderDevelopmentWebTerminal(shell, pageData, {
      stylesheetPath: "/src/styles.css",
      scriptPath: "/src/main.ts",
    });
  await vite.listen();
  browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--enable-experimental-web-platform-features"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return ["localhost", "127.0.0.1"].includes(host)
      ? route.continue()
      : route.abort();
  });
  await page.goto(terminal);
  await page.waitForFunction(
    async () =>
      document.modelContext &&
      (await document.modelContext.getTools()).length >= 5,
  );
  const names = await page.evaluate(async () =>
    (await document.modelContext.getTools()).map((x) => x.name),
  );
  console.log("Native browser WebMCP available:", names.length, "tools");
  const native = async (name, input) =>
    page.evaluate(
      async ({ name, input }) =>
        document.modelContext.executeTool(
          (await document.modelContext.getTools()).find((t) => t.name === name),
          JSON.stringify(input),
        ),
      { name, input },
    );
  const described = JSON.parse(
    await native("tollbit_describe_function", { functionSlug: slug }),
  );
  assert.equal(described.data.operations.length, 12);
  const operationTools = new Map(
    described.data.operations.map((o) => [o.operationId, o.toolName]),
  );
  const nativeCall = async (op, input = {}) => {
    const r = JSON.parse(await native(operationTools.get(op), { body: input }));
    return { status: r.status, data: r.data };
  };
  async function flow(kind, call) {
    const invoke = async (op, input = {}) => {
      const r = await call(op, input);
      assert.equal(r.status, 200, `${kind} ${op}: ${JSON.stringify(r.data)}`);
      return r.data;
    };
    const session = await invoke("getSession");
    const reg = {
      sessionId: session.sessionId,
      name: `Local ${kind}`,
      interface: kind,
      requestId: randomUUID(),
    };
    const joined = await invoke("registerAgent", reg);
    assert.equal(
      (await invoke("registerAgent", reg)).participantId,
      joined.participantId,
    );
    const auth = {
      sessionId: joined.sessionId,
      participantId: joined.participantId,
      token: joined.token,
    };
    const action = (extra = {}) => ({
      ...auth,
      requestId: randomUUID(),
      ...extra,
    });
    assert.equal((await invoke("getBookInfo", auth)).book.pageCount, 20);
    for (const page of [4,5,9,12,13,16]) await invoke("readPage", action({ page }));
    await invoke("readPage", action({ page: 3 }));
    await invoke("nextPage", action());
    await invoke("previousPage", action());
    await invoke("searchBook", action({ query: "Dataworx" }));
    await invoke("findOnPage", action({ query: "Brown" }));
    const saved = await invoke(
      "saveFinding",
      action({ label: "Dataworx test", value: "15", unit: "instances", page: 5 }),
    );
    await invoke("listFindings", auth);
    await invoke("removeFinding", action({ findingId: saved.finding.id }));
    const submit = action({
      answer: "142",
    });
    const graded = await invoke("submitAnswer", submit);
    assert.equal(graded.participant.submission.grading, "correct");
    await invoke("submitAnswer", submit);
    assert.equal(
      (await call("nextPage", action())).status,
      409,
      `${kind} submission must lock further work`,
    );
    const publicState = await (await fetch(app + "/func/race/api")).json();
    assert(
      publicState.participants.some(
        (p) => p.id === auth.participantId && p.submission?.answer === "142",
      ),
    );
    console.log(
      `PASS ${kind}: all 12 operations, retry safety, submission locking, spectator updates`,
    );
    return auth;
  }
  const nativeAuth = await flow("webmcp", nativeCall);
  const terminalCall = async (op, input = {}) => {
    const command =
      `${slug} ${kebab(op)} ` +
      Object.entries(input)
        .map(([k, v]) => `--${kebab(k)}=${JSON.stringify(String(v))}`)
        .join(" ");
    const response = page.waitForResponse(
      (r) =>
        r.url().startsWith(item.baseUrl + "/") &&
        r.request().method() === "POST",
      { timeout: 5000 },
    );
    await page.locator("#terminal-input").fill(command);
    await page.locator("#terminal-input").press("Enter");
    try {
      const r = await response;
      return { status: r.status(), data: await r.json() };
    } catch {
      throw new Error(`Terminal did not invoke ${op}`);
    }
  };
  await flow("terminal", terminalCall);
  const cliEnv = {
    ...process.env,
    TOLLBIT_AUTH_BASE_URL: services,
    TOLLBIT_FOUNDRY_BASE_URL: services + "/foundry",
    TOLLBIT_RUNTIME_STATE_DIR: join(temp, "cli-state"),
    TOLLBIT_CREDENTIALS_STORAGE_DIR: join(temp, "cli-state"),
  };
  const binary = join(temp, "tollbit");
  await exec("go", ["build", "-tags", "dev", "-o", binary, "./cmd/tollbit"], {
    cwd: cliSource,
  });
  const cliCall = async (op, input = {}) => {
    try {
      const { stdout } = await exec(
        binary,
        [
          "connect",
          "joshmayer.net",
          slug,
          kebab(op),
          ...Object.entries(input).map(([k, v]) => `--${k.toLowerCase()}=${v}`),
        ],
        { cwd: temp, env: cliEnv, timeout: 15000 },
      );
      return { status: 200, data: JSON.parse(stdout) };
    } catch (e) {
      if (e.stderr?.includes("409")) return { status: 409 };
      throw new Error(`CLI ${op}: ${e.stderr || e.message}`);
    }
  };
  await flow("cli", cliCall);
  await post("reset", { sessionId: nativeAuth.sessionId });
  assert.equal((await nativeCall("getBookInfo", nativeAuth)).status, 409);
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS reset invalidates prior agent credentials; no browser runtime errors",
  );
} catch (e) {
  console.error(e);
  if (appLogs.includes("Error")) console.error(appLogs.slice(-1500));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await vite?.close();
  child?.kill();
  await new Promise((r) => server?.close(r) ?? r());
  await rm(temp, { recursive: true, force: true });
}
