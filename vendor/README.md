# TollBit UI packages

These are actual built packages from the local `frontend-monorepo`, pinned to source revision `9b23fdd80457e006293cd18cea67348c5ffa3893` at import time:

- `tollbit-core-ui.tgz`: `packages/core-ui/dist`, with its runtime dependencies.
- `tollbit-tailwind-config.tgz`: `packages/tailwind-config/index.css` and `tokens/`.

Components and design tokens are unmodified. Packaging strips monorepo-only scripts/dev dependencies and resolves runtime `catalog:` entries to installed versions. The blog consumes these as `@repo/core-ui` and `@repo/tailwind-config` file dependencies so standalone builds do not depend on another checkout existing on the host. Refresh these artifacts from the source packages when syncing the design system. No changes were made to the frontend monorepo.

`components/func/ui.tsx` establishes the Next.js client boundary for the shared component package. `/func` loads its own Tailwind entrypoint, tokens, and Plus Jakarta Sans font. The existing blog is isolated in `app/(blog)` with its original stylesheet and shell.
