# Book research race: agent interfaces

Version **3.1.0 is deployed, verified by TollBit, and available on both hostnames**. Both publications retain their existing budgets. A real production CLI workflow completed registration, research, notes, and final submission; live spectator updates were observed.

Generated v3 artifacts are in `agent-functions/joshmayer-race/v3.1.0/`. The generator intentionally retains the existing v2 artifacts. Runtime metadata is served at `/api/agent-functions/joshmayer-race/v3.1.0/openapi`, `/skill`, and `/health`. All 12 agent operations are priced at zero; published execution still requires TollBit payment-token redemption for the exact version and operation. Host controls and spectator data are not agent functions.

## Shared workflow

1. The initial user prompt supplies the research task. There is no task reveal or host start.
2. `getSession` with `{}` obtains the current session ID.
3. `registerAgent` registers a name and interface using a private random `requestId` for retry-safe registration. Keep returned credentials private. The book becomes available immediately and the personal timer starts at `participant.joinedAt`.
4. Start research immediately with book metadata, page navigation, book search, and page find. Search returns excerpts; page reading returns complete page text. Viewer positions are one-based; printed labels are included separately.
5. Optionally keep a private notebook with save/list/remove finding operations. These facts are agent claims, not verified results.
6. Submit one final answer as an integer string. Explanation and citations are optional and do not affect scoring. Work locks after submission; the presentation displays the answer immediately. The correct number alone succeeds.

Every recorded action requires a new random UUID `requestId`; retain it for identical retries. On HTTP 409 reset, refresh `getSession`, obtain the new session ID, and register for the new session explicitly. Never replay old-session work automatically.

## Website

Use `/func/race/join`. The actual Internet Archive BookReader supplies page navigation. The site's search and notebook use the same service as the functions. `/func/race` is the audience presentation and must not be used by participants to inspect competitors.

## Installed CLI

After v3 is active, discover the operation flags with:

```sh
tollbit connect joshmayer.net joshmayer-race --help
```

Inspect the returned version before proceeding. Use the CLI's discovered operation help and `--name=value` flag syntax. For example, after discovering the generated command name for `getSession`, call it with no input to discover the current session. Operation identifiers in the contract are camelCase; CLI commands may be rendered in kebab-case, so use the actual help. All operation inputs are flat scalar fields; citations are a string such as `"3,4"`, making the same submission accessible in the browser terminal.

## Real TollBit web terminal

Use the actual TollBit terminal for this publisher, not a terminal widget on the blog. Discover functions with `list-fns`, then use `joshmayer-race --help` and the operation help. Terminal commands start with the function slug, not `tollbit connect`. The terminal manages TollBit identity and payment authorization. There is no browser-terminal `--body-file` support; these operations do not require it.

## Web terminal + WebMCP

This is the same real terminal with native tools enabled. Discover with `tollbit_list_functions` and `tollbit_describe_function` (functionSlug `joshmayer-race`). Read the returned version, actual tool names, and schemas. Native operation names are dynamically generated; do not assume `race_*` names. JSON request inputs are nested under the tool's `body` property. Native calls execute through the same function runner and also write to the terminal transcript. For an experiment assigned native WebMCP, do not silently switch to typed terminal commands if discovery fails.

The implementation deliberately adds no `navigator.modelContext` shim or fake terminal to the player page.

## Local interface integration smoke test

Run `node tests/book-interfaces-local.mjs` after `pnpm build`. It runs the real
book application on port 3229 with a temporary SQLite database, a local TollBit
service fixture on 3230, and the real TollBit terminal source on 3231. It leaves
the normal local presentation session untouched and removes its temporary data.
Requires installed Chrome with native WebMCP, Go, and the local terminal and CLI
source checkouts. Override `TERMINAL_SOURCE` and `TOLLBIT_CLI_SOURCE` to select
other checkouts. The terminal checkout must include the fix that permits commands
with zero required inputs to execute without flags.

Coverage: browser registration/read/search/notes/submit/reset; all 12 operations
through native Chrome WebMCP, typed terminal commands, and a development build
of the actual TollBit CLI; retry-safe registration/submission; post-submission
locking; shared spectator state; stale credentials after reset. Browser WebMCP
uses `document.modelContext` directly, without a shim.

Only identity, catalog lookup, payment minting, and redemption are local fixtures.
The book HTTP endpoints, validation, storage, command parser, terminal runner,
WebMCP registration, and CLI execution are real. This is deterministic interface
integration testing, not an autonomous Claude run or a production payment test.

The tested CLI uses lowercase body flags (`--sessionid`, `--requestid`), while
the web terminal uses kebab-case (`--session-id`, `--request-id`). Always read
operation help in the interface being used. Native WebMCP keeps schema field
names (`sessionId`, `requestId`) inside `body`.
