# Martin Zhu book deployment - 2026-09-23

- Production deployment `dpl_3QmAhRzdJzegFxnjWJfnuzBu9fAv` is READY.
- Site: https://www.joshmayer.net/func/race/join ; spectator: https://www.joshmayer.net/func/race .
- Vercel confirms both joshmayer.net and www.joshmayer.net point at this deployment.
- The 20-page book and number-only success checking are deployed. Correct answer: 142.
- v3.0.1 routes and metadata are retained for compatibility; legacy responses retain their pending grading enum while the shared runtime grades attempts. v3.1.0 exposes correct/incorrect grading and optional explanation/citations.
- TollBit v3.1.0 is verified. CLI discovery succeeded on both joshmayer.net and www.joshmayer.net, listing all twelve participant operations and number-only success. Existing hostname stakes remain active with unchanged CPI/budget settings. The registry summary still contains older placeholder wording; operation descriptions reflect the current behavior.
- New storage namespace: blog:book:martin-six-facts-v1. Previous fixture data was preserved.

## Prior deployments

# Book race deployment — 2026-09-23

- Production site: https://www.joshmayer.net/func/race
- Vercel deployment: `dpl_EJor5a6DGpo6doDSf18BEXqXCZEN` (READY).
- Both `joshmayer.net` and `www.joshmayer.net` are aliases of this deployment.
- Book runtime and metadata v3.0.1 are deployed. TollBit verification completed. Live CLI discovery and execution passed on 3.0.1: root-domain get-session succeeded; www registration, search, page reads, two saved findings, and final submission of 260 orders succeeded. Existing publications on both hostnames remain active with unchanged $1/month caps. Version 3.0.0 was superseded after fixing the required publisher-header declarations on metadata endpoints.
- New book sessions use the existing hosted Redis under a separate `blog:book:v2` namespace. Book reset is keyless.
- Fresh Codex task `01a0ced5-3827-7eb3-9bac-e719904ba2aa` completed the browser flow from one prompt. Registered as **Codex live browser**, saved two findings, and submitted **260 orders**, citing viewer pages **3 and 4**, in **54.5 seconds**. Parent session observed registration, search, page reads, notes, and submission update in the live board without reloading. Grading remains pending by design.
- Shared terminal no-argument invocation fix: https://github.com/tollbit/frontend-monorepo/pull/685 (merged as `f1fd3043ce6efbf9335a8a7eaad6b2b9442f5b39`, production workflow `35880529157` succeeded).

## Previous escape-room deployment

### Production deployment — 2026-09-21

- Website: https://www.joshmayer.net/func/race
- Vercel production deployment: dpl_FG9J4HgjYzLDXdMzznzLEy3HjyUV
- Deployment URL: https://blog-j6t0axcsq-joshmayers-projects.vercel.app
- Shared storage: Vercel Upstash resource `blog-agent-race`, free plan, automatic upgrades disabled. Runtime reads `KV_REST_API_URL` and `KV_REST_API_TOKEN` (explicit `RACE_REDIS_REST_*` settings take precedence).
- Reset key: sensitive production `RACE_ADMIN_KEY`, matching the ignored local `.race-data/admin-key`. Never commit or share the key.
- Agent-functions CLI upgraded from 0.1.1 to 0.1.3 using checksum-verified official release from tollbit/tollbit-cli-releases. This is distinct from the content/search CLI at tollbit/cli.

## Functions

Seating, collections, and comparisons v1.0.0 are verified and actively published on both `joshmayer.net` and `www.joshmayer.net`. Actual CLI invocations succeeded on www after deployment. Use `--body-file=<json path>` for structured array/object inputs; scalar body flags use `--name=value`.

Race v2.0.1 is **verified** and actively published on both `joshmayer.net` and `www.joshmayer.net`. A real TollBit CLI smoke test registered an agent, read both clues, opened the cabinet, collected the key, and escaped in 2.3 seconds with zero failed actions. The public board reported the same finish time and did not expose credentials.

User approved maximum CPI 40 USD micros and a monthly budget of 1,000,000 USD micros ($1) for each of five additional publications ($5 total cap). All five new publications are active. Existing root-domain publications retain their prior budgets.

Publication settings and discovery commands:

```sh
tollbit dev functions stake joshmayer-race --property joshmayer.net --max-cpi-micros 40 --monthly-budget-micros 1000000
tollbit dev functions stake joshmayer-race --property www.joshmayer.net --max-cpi-micros 40 --monthly-budget-micros 1000000
tollbit connect joshmayer.net joshmayer-race --help
```

The runtime OpenAPI serializer disables YAML aliases, and nullable schemas use syntax supported by TollBit's validator. These registration compatibility fixes are included in v2.0.1.
