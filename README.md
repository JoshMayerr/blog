
# Blog for Josh Mayer

Next.js 13 App Router

Markdown with MDX

**Tailwindcss**∫







Credit: @**shadcn**

## Blog tools and TollBit Agent Functions

The `/func` pages are unlisted test workspaces: the main site has no links to them, they are excluded from the sitemap, and their shared layout sets `noindex, nofollow`. They remain publicly accessible by direct URL; this is not authentication.

`/func/collections` and `/func/comparisons` are intentionally multi-step human interfaces. Their TollBit contracts and consumer skills live in `agent-functions/`; developer details are kept out of the reading UI. The UI and service share pure computation and validation in `lib/func/core.ts`.

Each versioned service exposes anonymous `health`, `openapi` (YAML 3.1.0), and `skill` metadata, plus token-gated capability operations:

| Function | Base route | Operations |
| --- | --- | --- |
| joshmayer-collections | /api/agent-functions/joshmayer-collections/v1.0.0 | POST /posts (`listPosts`), POST /create (`createCollection`) |
| joshmayer-comparisons | /api/agent-functions/joshmayer-comparisons/v1.0.0 | POST /posts (`listPosts`), POST /compare (`comparePosts`) |

All capability operations are priced at 0 USD micros but require `x-tollbit-agent-payment-token`. `x-tollbit-property` is optional. Tokens must target the exact org/function/version/operation RID and be redeemed with TollBit before execution. Decoded JWT claims alone never authorize execution. No WebMCP registration, window bridge, or generic `/api/func` endpoint is used.

### Runtime configuration

Use the linked TollBit developer organization to derive the runtime constants:

```sh
pnpm exec tsx scripts/generate-agent-functions.ts
tollbit dev functions scaffold-info joshmayer-collections --openapi-spec agent-functions/joshmayer-collections/openapi.yaml --env
```

Set the returned `TOLLBIT_AGENT_FUNCTION_ORG_ID` and `TOLLBIT_PAYMENT_TOKEN_REDEEM_URL` as server-only environment variables (local `.env.local` or hosting configuration). Do not guess the redemption URL or accept it from caller input. A missing configuration fails closed with 503. There is no payment bypass flag. Metadata stays public; health reports whether configuration is present, not whether the TollBit backend is reachable.

### Register after deployment

The committed OpenAPI snapshots and consumer skills are generated from `lib/tollbit/contracts.ts`. The live spec derives its server URL from the external host and forwarded protocol. Regenerate artifacts after changing the contract. The registration source is the deployed `/openapi` URL, not the local file.

```sh
tollbit dev functions draft --function-slug=joshmayer-collections --openapi-spec-url=https://www.joshmayer.net/api/agent-functions/joshmayer-collections/v1.0.0/openapi
tollbit dev functions draft --function-slug=joshmayer-comparisons --openapi-spec-url=https://www.joshmayer.net/api/agent-functions/joshmayer-comparisons/v1.0.0/openapi
# Confirm the returned slugs match the service's configured slugs before submitting.
tollbit dev functions submit joshmayer-collections
tollbit dev functions submit joshmayer-comparisons
tollbit dev functions get joshmayer-collections
tollbit dev functions get joshmayer-comparisons
# Only after verification:
tollbit dev functions stake joshmayer-collections --property joshmayer.net
tollbit dev functions stake joshmayer-comparisons --property joshmayer.net
```

A `validated` status is not public availability. Manual verification may be required before staking. Do not repeatedly submit or poll in that state. Registration snapshots the spec; later updates require a higher stable SemVer and corresponding route/RID version. Check CLI help before lifecycle changes.

### Checks

```sh
pnpm exec tsx --test tests/func.test.ts tests/tollbit.test.ts
pnpm lint
pnpm build
pnpm exec next start -p 3107
# In another terminal, against that production server:
node tests/func-browser.mjs
```

The TollBit tests cover metadata contracts, forwarded origin, missing/invalid/wrong-target tokens, redemption rejection and outages, schema parity, and no execution before authorization. Browser checks cover full click workflows and export parity with the shared service logic. Real CLI invocation requires deployment, registration, verification, and staking.

### Event seating planner

`/func/seating` is a separate event-planning workspace with a guest roster, editable table capacities, keep-together/keep-apart rules, a review step, and table/directory result views. The optional example contains fictional people. Event data stays in the browser unless explicitly exported; refreshing resets this workspace.

The corresponding TollBit function is `joshmayer-seating`, version `1.0.0`, with `POST /api/agent-functions/joshmayer-seating/v1.0.0/plan` (`planSeating`). Its sibling `/health`, `/openapi`, and `/skill` routes follow the same metadata contract as the other functions. It has no blog-search operation. Its generated OpenAPI and consumer skill are in `agent-functions/joshmayer-seating/`.

`planSeating` accepts `event`, `guests: [{id, name}]`, `tables: [{id, name, capacity}]`, and optional `rules: [{type: "together" | "apart", guestA, guestB}]`. It supports up to 40 guests, 12 tables with 1–20 seats each, and 100 rules. Together chains are indivisible groups; a bounded backtracking solver assigns the groups while enforcing capacity and apart constraints. The solver returns `complete`, `infeasible`, or `search_limit`; the last must never be described as proof of infeasibility. It finds a feasible arrangement, not a guaranteed optimal one.

The operation is zero-priced but requires token redemption against the exact `planSeating` RID. Its service is deployed and its TollBit registration is verified; paid discovery staking is still pending (see deployment status below). Test with `pnpm exec tsx --test tests/seating.test.ts` and `node tests/seating-browser.mjs` against the local production server.


### Deployment status (2026-09-17)

Vercel production deployment `dpl_5v5sFgvfZ5weYGYsfZtibxAYQgQd` is READY and aliased to `www.joshmayer.net` and `joshmayer.net`. Production runtime configuration includes both TollBit environment variables derived with `scaffold-info`.

All three functions (`joshmayer-collections`, `joshmayer-comparisons`, and `joshmayer-seating`) are registered at version `1.0.0` and have status `verified`. TollBit successfully fetched their OpenAPI contracts from `https://www.joshmayer.net/api/agent-functions/<slug>/v1.0.0/openapi` on retry after the user reported correcting a redirect.

The earlier HTTP 502 fetch errors are resolved. All three functions were confirmed verified. Publication is pending funding: the platform rejected the old CLI's stake request because `maxCpiMicros` must meet its 40 USD-micro floor. No stake was created.

CLI 0.1.2 supports the required `--max-cpi-micros` and `--monthly-budget-micros` flags. A checksum-verified copy is available at `/tmp/blog-tollbit-cli-0.1.2/tollbit`; the installed 0.1.1 binary was left unchanged. Discovery impressions consume organization funds separately from zero-priced capability invocations. The user approved a maximum CPI of 40 USD micros and a monthly budget of 1,000,000 USD micros ($1) per function, $3/month total. Staking collections with these values returned HTTP 402: `Credit balance 0 is below required monthly budget 1000000` (request ID `428bab07-670f-4d0b-b5bc-5fca93318ff8`). No stakes exist for any of the three functions. Once the organization is funded, retry staking each function with these approved limits, confirm active status, and test discovery and invocation.


### Publication update (2026-09-17 19:57 UTC)

After the user submitted the promotional-credit request, all three functions were successfully staked to `joshmayer.net` with status `active`, max CPI 40 USD micros, and monthly budget 1,000,000 USD micros each ($3/month combined). TollBit discovery returns all three functions. The funding blocker is resolved.

End-to-end invocation still needs investigation: the seating CLI sample with JSON array flags returned HTTP 400 `Add 1–40 guests.`, and collections `list-posts` returned HTTP 401 `TollBit rejected the payment token.` Do not describe capability execution as verified yet.


### CLI structured input

TollBit CLI 0.1.2 passes array/object body flags as strings. For collections, comparisons, and seating, place the complete JSON request in a file and invoke `tollbit connect joshmayer.net <function> <operation> --body-file=/absolute/path/request.json`. Do not combine `--body-file` with body field flags. This preserves typed arrays and objects without weakening server validation.

Payment redemption includes a new random idempotency key per incoming invocation. Business logic executes only after HTTP 200 with status `redeemed`; a `processing` receipt is not authorization to execute. A new invocation uses a new key so a previously consumed token cannot authorize another execution.


### Invocation fix and verification (2026-09-17)

Production deployment `dpl_7rXGRk2mthhE3RvHUaiJtN7ZjEaa` fixes redemption by sending the backend-required `idempotencyKey`. The missing key caused a backend 400 that the service had surfaced as a token rejection. Regression tests cover the key and reject pending redemption receipts. All 15 tests and lint passed; Vercel production build succeeded.

Live CLI calls now successfully execute `plan-seating`, `create-collection`, and `compare-posts` using the checked-in `agent-functions/<slug>/example-request.json` files through `--body-file`. The strict JSON API remains unchanged; array-valued CLI flags in 0.1.2 still serialize as strings and should not be used. Example:

```sh
tollbit connect joshmayer.net joshmayer-seating plan-seating --body-file=agent-functions/joshmayer-seating/example-request.json
```

### Refundable agent comments (Base Sepolia prototype)

Post pages now display plain-text comments loaded from `/api/comments`. Configure server-only `DEPOSIT_SERVICE_URL` and `DEPOSIT_SERVICE_KEY` to connect the independent agent-deposits service. POST validates that the blog post exists and forwards the comment and standard x402 payment authorization; GET returns recent comments. A missing or unavailable service fails closed for submissions and shows an unavailable message for readers.

The standalone service and agent demo live in `/Users/joshmayer/Developer/agent-deposits`; its README documents the payment extension, refund claims, admin deletion, pricing, custody and recovery. The prototype uses testnet USDC only. Production blog deployment is separate from preview testing.

### Human comment form

`/api/comments/human` accepts display name, plain-text comment, request ID and Turnstile token from the same-origin form. It validates the post and forwards to the standalone service for server-side verification. Set `TURNSTILE_SITE_KEY` in this blog's environment; the private `TURNSTILE_SECRET_KEY` and exact `TURNSTILE_HOSTNAMES` allowlist belong only on the deposit service. `/api/comments/config` exposes the public site key at runtime, so no rebuild is required when the key changes. Missing configuration disables posting with an explanatory message; there is no payment or CAPTCHA bypass.

The form preserves drafts on failures and reuses the exact pending request after ambiguous errors to avoid duplicate comments. Human display names are unverified and public; human/agent source labels are assigned by the service. Existing wallet-based agent submissions continue through `/api/comments`.
