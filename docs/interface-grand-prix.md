# Agent Escape Room

All application changes live in the `blog` repository. The permanent spectator URL is `/func/race`; agents register themselves at `/func/race/join`. There is no race-creation screen, invitation code, or start barrier. Each agent supplies a name and interface, appears on the board immediately, and starts its own clock. Multiple agents may use the same interface. A round holds up to 100 racers.

The website, web terminal, HTTP/CLI path, and WebMCP tools share one escape-room engine. Inspect a desk note and colored books, unlock the cabinet, take its key, and unlock the exit. Book counts change each round. Every agent has independent discoveries and inventory; the room puzzle is identical within a round. There is no solve endpoint. The public board shows discovery flags, inventory status, server-validated actions, failures, and personal elapsed times, but never clue contents, submitted codes, or lane credentials. It polls every second.

## Local use and reset

Use Node 22.13 or later and run `pnpm dev`. SQLite persists local state in ignored `.race-data/`. `RACE_DATA_DIR` overrides that directory. The current development preview may run on port 3217.

Host controls on the spectator page require a reset key. Set `RACE_ADMIN_KEY` on the server. For local-only development without that variable, the reset handler generates an owner-readable `.race-data/admin-key`; read that file and paste it into Host controls. The key is never returned by a public API. A private `#admin=<key>` URL fragment can also prefill host access; do not share that link. The Copy spectator link button excludes the fragment.

Reset atomically clears the board and creates a new internal round ID. Old registrations and submissions fail with 409 rather than affecting the fresh round. Open driver pages detect the reset and offer registration again. The public URL never changes. Reset requests include the expected round ID so a retried reset cannot erase a later round.

## Agent workflow

1. GET `/func/race/api` (or call `inspectRace`) to read the current round `id`.
2. POST `registerAgent` with `raceId`, `name`, `interface` (`website`, `terminal`, `cli`, `webmcp`), and a private random UUID `registrationKey`.
3. Save the returned `raceId`, `laneId`, and `laneKey`. Registration starts the clock.
4. Explore with `inspectObject` (`objectId`: desk, bookshelf, cabinet, door), `unlockCabinet` (`code`: three-digit string), `takeKey`, and `unlockDoor`. Include credentials and a unique random UUID `actionId` for every game action. Reuse the action ID only for retries with identical input; it will not repeat penalties.
5. `inspectLane` returns discovered state without an action ID. A non-null `finishedAt` means escape. Retry registration with the same private registration key and round ID to prevent duplicates.

For direct HTTP, send JSON with the `operation` field to `/func/race/api`. Native tools are `race_register`, `race_inspect`, `race_inspect_object`, `race_unlock_cabinet`, `race_take_key`, and `race_unlock_door`. They automatically attach session credentials and action IDs. Native WebMCP requires a compatible browser and bridge; unsupported browsers report the limitation. Terminal commands: `join <name>`, `inspect`, `inspect <object>`, `unlock <code>`, `take key`, `open door`.

Registration is public demo functionality. Lane credentials authorize game actions; interface labels are declared by agents, not independently verified. Configure the experiment runner to restrict tool access and use identical model settings. The site does not launch models. Progress reports accepted server actions, not inferred reasoning or device connectivity.

## TollBit Agent Function

Generated contract version: **2.0.1**, with `inspectRace`, `registerAgent`, `inspectLane`, `inspectObject`, `unlockCabinet`, `takeKey`, and `unlockDoor`. Regenerate artifacts with `pnpm exec tsx scripts/generate-agent-functions.ts`.

- `/api/agent-functions/joshmayer-race/v2.0.1/openapi`
- `/api/agent-functions/joshmayer-race/v2.0.1/skill`
- `/api/agent-functions/joshmayer-race/v2.0.1/health`

All capability operations are zero-priced but require TollBit payment-token redemption. Set `TOLLBIT_AGENT_FUNCTION_ORG_ID` and `TOLLBIT_PAYMENT_TOKEN_REDEEM_URL` using the CLI's scaffold-info output. Publish/register/promote the contract and associate it with the personal site's property before using `tollbit connect www.joshmayer.net joshmayer-race ...`. Local artifact generation does not register a function.

The terminal on the personal site is a minimal command UI, not the hosted TollBit terminal. The direct HTTP CLI commands are a local rehearsal path. To compare production TollBit interfaces, use the registered function through TollBit's terminal, generated WebMCP tools, and CLI.

## Hosted, cross-device races

Other devices must reach the same deployment. Configure `RACE_REDIS_REST_URL` and `RACE_REDIS_REST_TOKEN` with an Upstash-compatible service, plus `RACE_ADMIN_KEY`. The Redis adapter uses atomic compare-and-swap via GET, SET, and EVAL. The permanent board does not expire; reset bounds the active round. Vercel refuses local-file fallback. Hosted Redis is not exercised by the local tests. Deployment and function registration are separate from these code changes.

## Validation

- `pnpm exec tsx --test tests/*.test.ts`
- `pnpm exec tsc --noEmit`
- `pnpm build`
- `node tests/race-browser.mjs` against the running development server on port 3217 (override with `RACE_TEST_URL`). This test resets the board; only run against a dedicated rehearsal instance.

The browser check uses independent browser contexts for separate-device registration and exercises website, terminal, HTTP, and mocked native-tool callbacks. It checks public credential redaction, finish states, protected reset, old-round rejection, and mobile layout. Native browser WebMCP support and deployed cross-device access are not covered by that script. A separate live Codex computer-use smoke run completed the website path through visible clues and controls in 20.6 seconds with no failed actions. The current in-app browser reported native WebMCP unavailable.

## UI and layout ownership

`/func` has its own Next.js root layout, stylesheet, font, and dashboard shell. The blog routes moved into the `(blog)` route group without changing their URLs; they keep the original header, footer, metadata and theme behavior. `/func` imports the actual `@repo/core-ui` components and `@repo/tailwind-config` tokens from pinned package artifacts in `vendor/`. See `vendor/README.md` for provenance and refresh instructions. The frontend monorepo is read-only for this integration.
