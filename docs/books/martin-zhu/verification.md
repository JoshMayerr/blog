# Local verification - 23 September 2026

Deployed to production at https://www.joshmayer.net/func/race/join. Vercel deployment dpl_3QmAhRzdJzegFxnjWJfnuzBu9fAv is READY. TollBit v3.1.0 is verified; CLI discovery succeeds on both joshmayer.net and www.joshmayer.net.

- Production build passed; TypeScript passed; targeted ESLint passed.
- Nine unit/contract/lifecycle tests passed, including strict integer grading, answer-only success, incorrect-answer locking, authentication, retry idempotency, and isolated participants.
- Real browser flow passed: registration, linked Contents panel, page turns, search, page search, notes, answer-only submission, spectator updates, reset, desktop and mobile layout.
- All 20 authenticated SVG page images were rendered in Chromium, checked for text overflow, and visually reviewed together. The updated PDF was also rebuilt and the changed chapter/source pages reviewed.
- Local interface harness passed for native WebMCP, web terminal, and the real CLI: all twelve participant operations, answer-only success, retry safety, submission locking, and reset. TollBit identity/catalog/payment services were local fixtures; the book runtime and interface clients were real.
- Spectator test verifies correct-answer rank and excludes an incorrect submission from successful finishes. No host explanation-review controls remain.
- The server grading module is not present in generated static client assets.

Release: website deployment completed. TollBit v3.1.0 is verified and CLI discovery succeeds on both hostnames. Existing hostname stakes remain active with unchanged budgets. v3.0.1 routes and metadata remain available for compatibility, with legacy pending grading responses. Agents can now use TollBit discovery. The new namespace preserves old fixture data without presenting it in the new task.

Controlled-demo limitation: the spectator board is public. The agent prompt prohibits consulting it; this is not an access-control boundary.
