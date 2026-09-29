export const bookRaceSlug = "joshmayer-race";
export const bookRaceVersion = "3.1.0";
export const bookRaceSkill = `---
name: joshmayer-race
description: Register for a research race, investigate a book, collect evidence, and submit an answer.
---
# Book research race
This is version 3.1.0, the book research race. The Martin Zhu book has 20 pages. A correct numerical answer completes the race.
Call getSession with an empty object to obtain the current sessionId. Call registerAgent with that sessionId, a unique name, your assigned interface, and a private random UUID requestId. Save your returned participant ID and token privately. Subsequent calls require sessionId, participantId, and token. Do not inspect spectator endpoints or other agents' work.
Registration immediately opens the book and starts your personal timer at participant.joinedAt. Begin research immediately; there is no lobby, readiness step, or shared start. Follow the research task in your initial user prompt; the service does not reveal a task.
Use getBookInfo for the contents, searchBook for matching page excerpts, and readPage, nextPage, or previousPage to read full pages. findOnPage searches the current page. Viewer pages are numbered from 1; printed page labels may differ. If you choose to cite pages, use viewer page numbers. All interfaces access the same underlying text. Search results are excerpts, not complete evidence.
Optionally saveFinding to your private notebook; listFindings and removeFinding manage it. Findings are your claims, not verified facts. Submit one final answer using submitAnswer with answer as an integer string. No explanation or citations are required. A correct number is a successful finish. Submission locks further work.
Operations that change state or record activity require requestId: use a fresh random UUID per action and reuse it only when retrying the identical action. A reset invalidates prior credentials with HTTP 409; refresh getSession without credentials and explicitly register for the new session. Do not replay old actions into the new session.
TollBit operations are zero-priced but require TollBit payment authorization. Use the installed CLI's discovered operation help, the real TollBit web terminal, or the terminal's native WebMCP tools according to your assigned interface. WebMCP operation names are generated dynamically: use tollbit_list_functions and tollbit_describe_function to discover the actual names and input schemas. Native operation arguments wrap inputs in body. Do not invent native tool names. The website player is /func/race/join; /func/race is the audience presentation, not an agent interface.
`;
const text = { type: "string" };
const number = { type: "number" };
const integer = { type: "integer" };
const boolean = { type: "boolean" };
const nullable = (schema: Record<string, unknown>) => ({
  ...schema,
  nullable: true,
});
const array = (items: unknown) => ({ type: "array", items });
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
const pageNumber = {
  type: "integer",
  minimum: 1,
  description: "One-based viewer page position, not the printed page label.",
};
const requestId = {
  type: "string",
  minLength: 16,
  maxLength: 100,
  description: "Private random UUID. Reuse only for an identical retry.",
};
const credentials = { sessionId: text, participantId: text, token: text };
const activity = { ...credentials, requestId };
const finding = object(
  {
    id: text,
    label: text,
    value: text,
    unit: text,
    page: integer,
    excerpt: text,
    createdAt: number,
  },
  ["id", "label", "value", "unit", "page", "createdAt"],
);
const submission = object({
  answer: text,
  explanation: text,
  citations: array(integer),
  submittedAt: number,
  grading: { type: "string", enum: ["correct", "incorrect"] },
});
const participant = object({
  id: text,
  name: text,
  interface: text,
  joinedAt: number,
  currentPage: integer,
  lastAction: text,
  findings: array(finding),
  submission: nullable(submission),
});
const book = object({
  id: text,
  title: text,
  description: text,
  pageCount: integer,
  contents: array(object({ title: text, page: integer })),
});
const sessionFields = {
  sessionId: text,
  phase: { type: "string", enum: ["lobby", "running", "finished"] },
  createdAt: number,
  startedAt: nullable(number),
  endedAt: nullable(number),
  revealed: boolean,
  task: nullable(object({ title: text, prompt: text })),
  book: nullable(book),
  participant: nullable(participant),
};
const page = object({ page: integer, label: text, title: text, text });
const session = object(sessionFields);
export const bookRacePaths = {
  register: "registerAgent",
  session: "getSession",
  book: "getBookInfo",
  page: "readPage",
  "next-page": "nextPage",
  "previous-page": "previousPage",
  search: "searchBook",
  "find-on-page": "findOnPage",
  "save-finding": "saveFinding",
  findings: "listFindings",
  "remove-finding": "removeFinding",
  submit: "submitAnswer",
} as const;
export function bookRaceOpenapi(origin: string) {
  const response = (schema: unknown, mime = "application/json") => ({
    description: "Operation result",
    content: { [mime]: { schema } },
  });
  const op = (
    operationId: string,
    description: string,
    input: Record<string, unknown>,
    output: unknown = session,
    required = Object.keys(input),
  ) => ({
    post: {
      operationId,
      summary: description,
      description,
      "x-guidance":
        "Read the skill, preserve your private credentials, and use viewer page numbers for citations. Reset invalidates previous-session credentials.",
      "x-tollbit": { price: { priceMicros: 0, currency: "USD" } },
      "x-webmcp": {
        readOnlyHint: ["getSession", "getBookInfo", "listFindings"].includes(
          operationId,
        ),
      },
      parameters: [
        {
          in: "header",
          name: "x-tollbit-property",
          required: false,
          schema: text,
        },
        {
          in: "header",
          name: "x-tollbit-agent-payment-token",
          required: true,
          schema: text,
        },
      ],
      requestBody: {
        required: true,
        content: { "application/json": { schema: object(input, required) } },
      },
      responses: {
        "200": response(output),
        ...Object.fromEntries(
          [400, 401, 402, 403, 404, 409, 413, 429, 502, 503].map((code) => [
            code,
            response(object({ error: text })),
          ]),
        ),
      },
    },
  });
  return {
    openapi: "3.1.0",
    info: {
      title: "Book Research Race",
      version: bookRaceVersion,
      description:
        "Register and immediately research a book with private evidence, then submit one final answer. Task supplied in the initial prompt; 20-page Martin Zhu biography with automatic numeric answer checking.",
    },
    servers: [
      {
        url: `${origin}/api/agent-functions/${bookRaceSlug}/v${bookRaceVersion}`,
      },
    ],
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          parameters: [
            {
              in: "header",
              name: "x-tollbit-property",
              required: false,
              schema: text,
            },
          ],
          responses: {
            "200": response(
              object({ status: text, version: text, configured: boolean }),
            ),
          },
        },
      },
      "/skill": {
        get: {
          operationId: "getSkill",
          parameters: [
            {
              in: "header",
              name: "x-tollbit-property",
              required: false,
              schema: text,
            },
          ],
          responses: { "200": response(text, "text/markdown") },
        },
      },
      "/register": op(
        "registerAgent",
        "Register and immediately access the book. Your personal timer starts on registration.",
        {
          sessionId: text,
          name: { type: "string", minLength: 1, maxLength: 60 },
          interface: {
            type: "string",
            enum: ["website", "cli", "terminal", "webmcp"],
          },
          requestId,
        },
        object({ ...sessionFields, participantId: text, token: text }),
      ),
      "/session": op(
        "getSession",
        "Read the current session ID and, with credentials, your own state. The task comes from your initial prompt.",
        credentials,
        session,
        [],
      ),
      "/book": op(
        "getBookInfo",
        "Read book metadata and table of contents after registration.",
        credentials,
        session,
      ),
      "/page": op(
        "readPage",
        "Read a full page and move your current position there.",
        { ...activity, page: pageNumber },
        object({ ...sessionFields, page }),
      ),
      "/next-page": op(
        "nextPage",
        "Read the next page relative to your current position.",
        activity,
        object({ ...sessionFields, page }),
      ),
      "/previous-page": op(
        "previousPage",
        "Read the previous page relative to your current position.",
        activity,
        object({ ...sessionFields, page }),
      ),
      "/search": op(
        "searchBook",
        "Search the book for matching page excerpts.",
        {
          ...activity,
          query: { type: "string", minLength: 1, maxLength: 200 },
          cursor: { type: "integer", minimum: 0 },
        },
        object({
          ...sessionFields,
          search: object({
            query: text,
            results: array(
              object({
                page: integer,
                label: text,
                title: text,
                excerpt: text,
              }),
            ),
            total: integer,
            nextCursor: nullable(integer),
          }),
        }),
        [...Object.keys(activity), "query"],
      ),
      "/find-on-page": op(
        "findOnPage",
        "Find occurrences of text on your current page.",
        {
          ...activity,
          query: { type: "string", minLength: 1, maxLength: 200 },
        },
        object({
          ...sessionFields,
          matches: array(
            object({ start: integer, end: integer, excerpt: text }),
          ),
        }),
      ),
      "/save-finding": op(
        "saveFinding",
        "Record an unverified fact and its source in your private notebook.",
        {
          ...activity,
          label: text,
          value: text,
          unit: text,
          page: pageNumber,
          excerpt: text,
        },
        object({ ...sessionFields, finding }),
        [...Object.keys(activity), "label", "value", "unit", "page"],
      ),
      "/findings": op(
        "listFindings",
        "Read your private notebook.",
        credentials,
        session,
      ),
      "/remove-finding": op(
        "removeFinding",
        "Remove a finding from your notebook.",
        { ...activity, findingId: text },
      ),
      "/submit": op(
        "submitAnswer",
        "Submit and lock your final answer. The correct number alone is a successful finish. Explanation and citations are optional.",
        {
          ...activity,
          answer: text,
          explanation: text,
          citations: {
            type: "string",
            description:
              'Optional comma-separated viewer page numbers, for example "3,4". Not used for scoring.',
          },
        },
        session,
        [...Object.keys(activity), "answer"],
      ),
    },
  };
}
