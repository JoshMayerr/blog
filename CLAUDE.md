# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog for Josh Mayer built with Next.js 16 (App Router), Contentlayer for MDX content management, and Tailwind CSS v4 for styling. The site features blog posts, pages, and drafts with dark mode support.

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Start development server
pnpm dev

# Build for production (includes contentlayer build prebuild step)
pnpm build

# Preview production build
pnpm preview

# Start production server
pnpm start

# Lint
pnpm lint
```

## Architecture

### Content Management with Contentlayer

The site uses Contentlayer to transform MDX files into type-safe data. Configuration is in `contentlayer.config.js`:

- **Posts** (`content/posts/*.mdx`): Blog posts with required `title`, `date` fields and optional `description`, `ogImage`
- **Pages** (`content/pages/*.mdx`): Static pages (e.g., about, projects) with required `title` and optional `description`
- **Drafts** (`content/drafts/*.mdx`): Unpublished posts with same schema as Posts

Contentlayer generates TypeScript types in `.contentlayer/generated` and runs automatically during `prebuild`. All content types include computed `slug` and `slugAsParams` fields.

### Routing Structure

The app uses Next.js App Router with catch-all routes:

- `/` - Homepage (`app/page.tsx`): Personal intro and project links
- `/posts` - Post listing (`app/posts/page.tsx`): All posts sorted by date descending
- `/posts/[...slug]` - Individual posts (`app/posts/[...slug]/page.tsx`): Renders MDX post content
- `/[...slug]` - Pages (`app/[...slug]/page.tsx`): Renders MDX page content (e.g., `/about`, `/projects`)

Both dynamic routes use `generateStaticParams()` for static generation at build time.

### Styling System

- Tailwind CSS with typography plugin (`@tailwindcss/typography`)
- Dark mode via `next-themes` with system preference detection
- Content configured in `tailwind.config.js`: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`, `content/**/*.{md,mdx}`
- Prose styling applied to all MDX content via `.prose` and `.dark:prose-invert` classes
- Custom serif font with tighter tracking for typographic feel

### MDX Rendering

MDX content is rendered through `components/mdx-components.tsx` using `next-contentlayer/hooks`. The component mapping currently includes Next.js Image optimization. Add custom components here to use them in MDX files.

### Path Aliases

TypeScript path aliases configured in `tsconfig.json`:
- `@/*` maps to root directory
- `contentlayer/generated` maps to `.contentlayer/generated`

### Third-party Integrations

- Google Analytics via `@next/third-parties/google` (configured in `app/layout.tsx`)
- Vercel Analytics via `@vercel/analytics`
- Production URL: `https://joshmayer.net`

### Key Utilities

`lib/utils.ts` contains:
- `formatDate()`: Formats dates to "Month DD, YYYY" format
- `getBaseUrl()`: Returns correct base URL for production vs development

## Content Workflow

To add a new blog post:
1. Create `content/posts/your-post-title.mdx`
2. Add frontmatter with `title`, `date`, and optionally `description` and `ogImage`
3. Write content in MDX format
4. Contentlayer will automatically process it on next build/dev run
5. Post appears at `/posts/your-post-title`

To add a new page, follow the same process in `content/pages/`.

Drafts work identically but live in `content/drafts/` and are not rendered on the site (no route exists for them).
