# Contributing to care-docs

Thanks for improving the Maestro, CARL and IdeaL documentation!

## Local setup

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production build (run before pushing)
```

Node 22.12+ (see `.nvmrc`). Pushing to `main` auto-deploys via GitHub Actions.

## Project layout

```
src/content/docs/
├── index.mdx              # EN splash landing
├── care/                  # EN — Maestro (app, CLI, TUI, solvers)
├── carl/                  # EN — CARL (format + runtime)
├── ideal/                 # EN — IdeaL (idea lake)
└── ru/                    # RU mirror (same paths under ru/)
```

Three topics (Maestro, CARL, IdeaL), three sidebars, via `starlight-sidebar-topics` in `astro.config.mjs`.

## Adding a page

1. Create a `.md` under the right topic dir, e.g. `src/content/docs/carl/steps/foo.md`.
2. Frontmatter: `title`, `description`, optional `sidebar: { order: N }`.
3. New directory? Register it in the topic's `items` in `astro.config.mjs`
   (an `autogenerate` entry picks up files within a registered directory).
4. Mirror it to `src/content/docs/ru/<same path>` for Russian (missing translations
   fall back to English automatically).

## Conventions

- **Internal links** are root-absolute: `/carl/steps/llm/`. A rehype plugin in
  `astro.config.mjs` prepends the deploy `base` automatically — do **not** hardcode
  `/care-docs`. RU pages link to RU pages: `/ru/carl/...`.
- **Splash pages** (`.mdx` with `template: splash`) use **relative** links in
  `hero.actions` / component `href`s (component props aren't rehype-processed).
- **Code examples must be real** — verify against the release sources below.
  Keep identifiers/API names in English in RU pages.
- **Naming**: the product is Maestro; `care` is the package and CLI. Call the app's
  agent host "the Maestro harness". Do not name or describe any upstream harness.
- **Brand**: tokens live in `src/styles/custom.css` (mirrors `../care-landing`).

## Source of truth

Release 0.5.0:

- Maestro → `Glazkoff/care` branch `feat/maestro-library` (+ STARM solvers, PR #34).
- CARL 0.5.0 → `Glazkoff/carl` `main` (0.4.0) plus the PRs and Maestro contracts listed
  in [the changelog](src/content/docs/carl/reference/changelog.md).
- IdeaL → `Glazkoff/gigaevo-memory` branch `dev`.
- The roadmap + status is in [`todo.md`](./todo.md).
