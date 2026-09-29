import { gradeAnswer } from "./grading.server";
import { randomUUID } from "node:crypto";
import { book, type BookPage } from "./book";
import {
  RaceError,
  authenticate,
  assertSession,
  addEvent,
  sessionView,
  publicSession,
  type SessionView,
  type Finding,
  type Participant,
} from "./core";
import { liveSession, updateSession, resetSession } from "./store";
export const operations = [
  "registerAgent",
  "getSession",
  "getBookInfo",
  "readPage",
  "nextPage",
  "previousPage",
  "searchBook",
  "findOnPage",
  "saveFinding",
  "listFindings",
  "removeFinding",
  "submitAnswer",
] as const;
export type Operation = (typeof operations)[number];
export type Input = {
  sessionId?: string;
  participantId?: string;
  token?: string;
  requestId?: string;
  name?: string;
  interface?: string;
  page?: number;
  query?: string;
  cursor?: number;
  label?: string;
  value?: string;
  unit?: string;
  excerpt?: string;
  findingId?: string;
  answer?: string;
  explanation?: string;
  citations?: string;
};
export type SearchResult = {
  page: number;
  label: string;
  title: string;
  excerpt: string;
};
export type Result = SessionView & {
  participantId?: string;
  token?: string;
  page?: BookPage;
  search?: {
    query: string;
    results: SearchResult[];
    total: number;
    nextCursor: number | null;
  };
  matches?: { start: number; end: number; excerpt: string }[];
  finding?: Finding;
};
const credentials = ["sessionId", "participantId", "token"];
const readOnly = new Set<Operation>([
  "getSession",
  "getBookInfo",
  "listFindings",
]);
const extraFields: Partial<Record<Operation, string[]>> = {
  registerAgent: ["name", "interface"],
  readPage: ["page"],
  searchBook: ["query", "cursor"],
  findOnPage: ["query"],
  saveFinding: ["label", "value", "unit", "page", "excerpt"],
  removeFinding: ["findingId"],
  submitAnswer: ["answer", "explanation", "citations"],
};
export function parseInput(op: Operation, raw: unknown): Input {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new RaceError(400, "Provide an input object.");
  const data = { ...raw } as Record<string, unknown>;
  const fields = [
    ...(op === "registerAgent" ? ["sessionId"] : credentials),
    ...(readOnly.has(op) ? [] : ["requestId"]),
    ...(extraFields[op] || []),
  ];
  for (const key of Object.keys(data))
    if (!fields.includes(key))
      throw new RaceError(400, `Unknown field: ${key}.`);
  for (const key of fields) {
    if ((["cursor", "excerpt"].includes(key) || (op === "submitAnswer" && ["explanation", "citations"].includes(key))) && (data[key] === undefined || data[key] === ""))
      continue;
    if (op === "getSession" && data[key] === undefined) continue;
    if (["page", "cursor"].includes(key)) {
      if (typeof data[key] === "string" && /^\d+$/.test(data[key] as string))
        data[key] = Number(data[key]);
      if (
        !Number.isSafeInteger(data[key]) ||
        (data[key] as number) < (key === "page" ? 1 : 0)
      )
        throw new RaceError(400, `Invalid ${key}.`);
    } else if (
      typeof data[key] !== "string" ||
      (!(data[key] as string).trim() && key !== "unit") ||
      (data[key] as string).length >
        (["answer", "explanation"].includes(key)
          ? 3000
          : key === "excerpt"
            ? 1000
            : 200)
    )
      throw new RaceError(400, `Invalid ${key}.`);
  }
  if (
    data.requestId &&
    !/^[a-zA-Z0-9_-]{16,100}$/.test(data.requestId as string)
  )
    throw new RaceError(
      400,
      "Use a private random UUID as requestId; reuse only when retrying.",
    );
  if (op === "registerAgent" && (data.name as string).trim().length > 60)
    throw new RaceError(400, "Name must be at most 60 characters.");
  if (
    op === "registerAgent" &&
    ![
      "website",
      "cli",
      "cli_discovered",
      "cli_preinstalled",
      "discovered_cli",
      "preinstalled_cli",
      "terminal",
      "web_terminal",
      "webmcp",
    ].includes(data.interface as string)
  )
    throw new RaceError(400, "Choose a supported agent interface.");
  if (data.page && !book.pages.some((p) => p.page === data.page))
    throw new RaceError(400, "Page is outside this book.");
  if (
    op === "submitAnswer" && data.citations &&
    !/^\s*\d+(\s*,\s*\d+)*\s*$/.test(data.citations as string)
  )
    throw new RaceError(
      400,
      "Citations must be comma-separated viewer page numbers.",
    );
  return data as Input;
}
function running(s: Awaited<ReturnType<typeof liveSession>>, p: Participant) {
  if (s.phase !== "running")
    throw new RaceError(
      409,
      "This session is unavailable. Register in the current session.",
    );
  if (p.submission)
    throw new RaceError(409, "Your final answer is already submitted.");
}
export async function perform(
  operation: Operation,
  input: Input,
): Promise<Result> {
  input = parseInput(operation, input);
  const current = await liveSession();
  if (operation === "getSession" && !input.participantId && !input.token)
    return { ...sessionView(current), task: null, book: null };
  assertSession(current, input.sessionId);
  if (readOnly.has(operation)) {
    const p = authenticate(current, input.participantId, input.token);
    return sessionView(current, p);
  }
  return updateSession("live", (s) => {
    assertSession(s, input.sessionId);
    if (operation === "registerAgent") {
      const existing = s.participants.find((p) => p.token === input.requestId);
      if (existing) {
        if (
          existing.name !== input.name!.trim() ||
          existing.interface !== input.interface
        )
          throw new RaceError(
            409,
            "Registration requestId already used with different details.",
          );
        return {
          ...sessionView(s, existing),
          participantId: existing.id,
          token: existing.token,
        };
      }
      if (s.participants.length >= 50)
        throw new RaceError(429, "This session is full.");
      const p: Participant = {
        id: randomUUID(),
        name: input.name!.trim(),
        interface: input.interface!,
        token: input.requestId!,
        joinedAt: Date.now(),
        currentPage: 1,
        lastAction: "Registered",
        findings: [],
        submission: null,
        requests: {},
      };
      s.participants.push(p);
      addEvent(s, p, operation, "Registered");
      return { ...sessionView(s, p), participantId: p.id, token: p.token };
    }
    const p = authenticate(s, input.participantId, input.token);
    const fingerprint = JSON.stringify([
      operation,
      Object.entries(input)
        .filter(([k]) => k !== "requestId")
        .sort(([a], [b]) => a.localeCompare(b)),
    ]);
    const previous = p.requests[input.requestId!];
    if (previous) {
      if (previous.fingerprint !== fingerprint)
        throw new RaceError(409, "requestId already used for another action.");
      return { ...sessionView(s, p), ...(previous.result as Partial<Result>) };
    }
    if (Object.keys(p.requests).length >= 500)
      throw new RaceError(429, "Participant action limit reached.");
    const extras: Partial<Result> = {};
    {
      running(s, p);
      if (["readPage", "nextPage", "previousPage"].includes(operation)) {
        const page =
          operation === "readPage"
            ? input.page!
            : p.currentPage + (operation === "nextPage" ? 1 : -1);
        const found = book.pages.find((x) => x.page === page);
        if (!found) throw new RaceError(400, "No page in that direction.");
        p.currentPage = page;
        extras.page = found;
        addEvent(
          s,
          p,
          operation,
          `Reading page ${page} (printed ${found.label})`,
          { page },
        );
      } else if (operation === "searchBook") {
        const query = input.query!.trim();
        const needle = query.toLocaleLowerCase().replace(/[-–—]/g, " ");
        const results = book.pages.flatMap((page) => {
          const text = `${page.title}\n${page.text}`;
          const start = text
            .toLocaleLowerCase()
            .replace(/[-–—]/g, " ")
            .indexOf(needle);
          return start < 0
            ? []
            : [
                {
                  page: page.page,
                  label: page.label,
                  title: page.title,
                  excerpt: text.slice(
                    Math.max(0, start - 70),
                    start + needle.length + 140,
                  ),
                },
              ];
        });
        const cursor = input.cursor || 0;
        extras.search = {
          query,
          results: results.slice(cursor, cursor + 5),
          total: results.length,
          nextCursor: cursor + 5 < results.length ? cursor + 5 : null,
        };
        addEvent(s, p, operation, `Searching “${query}”`, { query });
      } else if (operation === "findOnPage") {
        const text = book.pages[p.currentPage - 1].text;
        const needle = input.query!.trim().toLocaleLowerCase();
        const lower = text.toLocaleLowerCase();
        const matches = [];
        let start = lower.indexOf(needle);
        while (start >= 0 && matches.length < 100) {
          matches.push({
            start,
            end: start + needle.length,
            excerpt: text.slice(
              Math.max(0, start - 50),
              start + needle.length + 100,
            ),
          });
          start = lower.indexOf(needle, start + needle.length);
        }
        extras.matches = matches;
        addEvent(
          s,
          p,
          operation,
          `Finding “${input.query}” on page ${p.currentPage}`,
          { page: p.currentPage, query: input.query },
        );
      } else if (operation === "saveFinding") {
        if (p.findings.length >= 100)
          throw new RaceError(429, "Notebook is full.");
        const finding: Finding = {
          id: randomUUID(),
          label: input.label!,
          value: input.value!,
          unit: input.unit!,
          page: input.page!,
          ...(input.excerpt ? { excerpt: input.excerpt } : {}),
          createdAt: Date.now(),
        };
        p.findings.push(finding);
        extras.finding = finding;
        addEvent(s, p, operation, `Saved finding: ${finding.label}`, {
          page: finding.page,
        });
      } else if (operation === "removeFinding") {
        const index = p.findings.findIndex((f) => f.id === input.findingId);
        if (index < 0) throw new RaceError(404, "Finding not found.");
        p.findings.splice(index, 1);
        addEvent(s, p, operation, "Removed a finding");
      } else if (operation === "submitAnswer") {
        const citations = Array.from(
          new Set((input.citations || "").split(",").filter(x => x.trim()).map((x) => Number(x.trim()))),
        );
        if (citations.some((n) => !book.pages.some((p) => p.page === n)))
          throw new RaceError(400, "Citation page is outside this book.");
        p.submission = {
          answer: input.answer!,
          explanation: input.explanation || "",
          citations,
          submittedAt: Date.now(),
          ...gradeAnswer(input.answer!),
        };
        addEvent(s, p, operation, "Submitted final answer");
      }
    }
    const result = structuredClone({ ...sessionView(s, p), ...extras });
    p.requests[input.requestId!] = {
      fingerprint,
      result: structuredClone(extras),
    };
    return result;
  });
}
export async function hostAction(operation: string, sessionId: string) {
  if (operation !== "reset") throw new RaceError(400, "Unknown host operation.");
  return publicSession(await resetSession(sessionId));
}
