# Martin Zhu research race - proposed final specification

Status: website deployed to production; TollBit v3.1.0 verified and discoverable on both hostnames. Keep this host specification out of participant-facing assets and APIs.

## Task

Find six facts in the book and compute an intentionally artificial verification code. The code is a game checksum, not a meaningful measure of Martin's career.

| Variable | Fact | Value | Narrative page |
| --- | --- | ---: | ---: |
| A | Brown teaching-assistant course appointments listed | 5 | 4 |
| B | Dataworx documented test-environment instances | 15 | 5 |
| C | Named Pixek collaborators in Brown's release report, including Martin | 3 | 9 |
| D | Weeks to the first restaurant rollout of the Toast-DoorDash integration | 3 | 12 |
| E | Engineers Martin reports managing on the Toast Tables team | 9 | 13 |
| F | Colleagues explicitly credited in his publisher-onboarding announcement, excluding Martin | 5 | 16 |

Formula: `(B * E) + (A * C) - (D + F)`.

Expected result: `(15 * 9) + (5 * 3) - (3 + 5) = 142`.

Expected narrative-page evidence: 4, 5, 9, 12, 13, 16.

## Shared research prompt

You are competing in a timed book-research race. Register as {AGENT_NAME} using your assigned interface, then begin immediately. Your timer starts when you register.

Use only the book "Martin Zhu: From Encrypted Photos to the Agentic Web" available through the race. You may use its table of contents, search, page navigation, and notes. Do not use external websites, local repository files, source code, spectator results, or another participant's work.

Find these six quantities:
A. The number of Brown teaching-assistant course appointments listed for Martin.
B. The number of instances in Dataworx's documented test environment.
C. The number of collaborators named in Brown's Pixek release report, including Martin.
D. The number of weeks to the first restaurant rollout of the Toast-DoorDash integration, as reported by Martin. Use the rollout interval, not the original planned duration.
E. The number of engineers Martin reports managing on the Toast Tables team.
F. The number of colleagues explicitly credited in Martin's publisher-onboarding announcement, excluding Martin.

Compute the verification code:
(B * E) + (A * C) - (D + F)

Submit the code as a single integer in the Answer field. The correct number alone completes the race. No explanation or citations are required.

You get one final submission, which locks your work. Check the values and calculation before submitting. Complete the submission through the race interface; replying in chat alone does not finish the race.

## Interface-specific setup

Give every participant the shared prompt above, substituting a unique name, plus one interface-specific entry instruction. Do not give agents this entire specification or the host answer table.

- Website: open {BASE_URL}/func/race/join and use the website UI. Book-page screenshots and reader search are allowed. No direct API calls or developer-console inspection.
- WebMCP: open the same join page and use its exposed WebMCP tools. UI fallback should be a separately declared condition, not an unnoticed change of interface.
- CLI / terminal: use the published race function version and hostname configured for the session. Provide the exact installed command or entry point after verifying the current publication. Same research prompt and submission requirement; no added fact hints.

Use equivalent fresh agent contexts and the same model/reasoning setting when measuring interface differences. Names should identify interface and run. Access restrictions are instructions unless separately enforced by the runner.

## Implementation

The game loads the canonical 20-page JSON through lib/book-race/book.ts. Contents navigation is available in the website and getBookInfo. SVG pages wrap headings and fit body text dynamically. Appendix number shortcuts and the page-13 title shortcut are removed from all generated formats.

The task is supplied externally using initial-prompt.md. The server checks only the submitted integer. Correct answers are successful finishes, ranked by elapsed registration-to-submission time. Incorrect answers also stop the timer; no retry is allowed. Explanation and citations remain optional API fields for compatibility but are absent from the website submission form and have no effect on scoring. There is no host review.

The answer key lives in grading.server.ts and this host document, never in book metadata or the participant contract. The storage namespace is blog:book:martin-six-facts-v1. Existing fixture results are not cleared or reused. The function contract is v3.1.0; generated artifacts are under agent-functions/joshmayer-race/v3.1.0. Deployment and TollBit publication are a separate release step; production status must not be inferred from local files.

The spectator board remains public, as in the existing controlled demo. Prompts prohibit inspecting other participants' work. An open competition would need spectator access controls or results embargo. No access enforcement is claimed here.

## Verification requirements

- All 20 pages fit, and text, contents, and search agree.
- Answer-only submissions work through every enabled interface.
- Strict integer checking rejects partial parses, expressions, decimals, and wrong answers.
- Wrong answers lock the participant without receiving a successful rank.
- Correctness never depends on notes, explanations, or citations.
- Authentication, idempotency, privacy of credentials, and participant isolation remain intact.
- Production build and interface tests pass before release.

## Timing interpretation

The timer starts at registration and ends at submission. It excludes browser startup, tool discovery, and CLI setup. There is no shared countdown.
