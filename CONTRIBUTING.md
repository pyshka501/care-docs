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

Sources of truth (docs refresh 2026-11):

- Maestro app and Autobench → `Glazkoff/care` branch `feat/dataset-studio` (draft PR #41
  on top of `feat/maestro-brand`, PR #40). Features not in a released build are marked
  *development line*.
- CARL → the released tag `v0.5.2` of `AIRI-MAESTRO/carl` (`mmar-carl` 0.5.2 on PyPI).
- MAGE → `Glazkoff/carl-mage` branch `prep/mage-0.2.0` (draft PR #21, release prep for
  `mmar-mage` 0.2.0 on CARL 0.5.2); the v3 strategy ships opt-in from
  `mmar_mage/authoring/`; its research extensions under `evaluation/` are
  documented as experimental.
- IdeaL → `Glazkoff/gigaevo-memory` branch `dev`.
- The roadmap + status is in [`todo.md`](./todo.md).
