@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical: this is NOT the Next.js you know

Stack is Next.js 16.2.4 + React 19.2.4 + Tailwind v4. APIs, conventions, and file structure may differ from training data. Before writing any framework code, consult `node_modules/next/dist/docs/` and heed deprecation notices.

## Commands

- `npm run dev` — local dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint via `eslint-config-next` (core-web-vitals + TypeScript)

There is no test runner configured.

## Deployment

Vercel auto-deploys on push to `main` (repo: `zoanun/personal-site`). No manual deploy step.

## Architecture

- **App Router only**, all routes under `src/app/`. `layout.tsx` wraps every page; per-page `metadata` export is mandatory.
- **Server Components by default.** Add `"use client"` only when interactivity, browser APIs, or React state require it.
- **Tailwind v4 is configured in CSS, not in JS.** Design tokens live in the `@theme inline` block of [src/app/globals.css](src/app/globals.css) and surface as Tailwind utilities (`bg-background`, `text-foreground`, `font-mono`, …). To add a token, extend that block — there is no `tailwind.config.*` file.
- **Fonts**: Geist Sans + Geist Mono are loaded with `next/font/google` in [src/app/layout.tsx](src/app/layout.tsx) and exposed as CSS vars `--font-geist-sans` / `--font-geist-mono`.
- **Path alias**: `@/*` → `./src/*` (see [tsconfig.json](tsconfig.json)).

## Project conventions (mirrored from `.claude/rules/`)

`.claude/rules/*.md` are the source of truth for these rules; `.claude/` is gitignored, so the rules are summarised here for Claude instances that don't have local access.

**TypeScript**
- Use `interface` (not `type`) for object shapes. Names are PascalCase ending in `Props` or `Config`.
- Annotate every function parameter and return type. No `any`. `strict` is on.

**React / Next.js 16**
- Function components only.
- Every page exports `metadata`.
- Use `next/image` for images.
- Prefer Server Components; reach for client components only when necessary.
- No raw `console.log` in components — route through a logger.

**Tailwind v4**
- Don't string-concat class names in JSX. Use `clsx` / `class-variance-authority` for conditional classes.
- Mobile-first responsive ordering: `p-4 md:p-6 lg:p-8` — never the reverse.
- Prefer design tokens over hard-coded colors / spacings.

## Local-only state (do not commit)

`.claude/` and `.omc/` hold agent harness state and project rules — both are gitignored.
