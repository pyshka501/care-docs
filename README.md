# care-docs

**Live site:** https://airi-maestro.github.io/care-docs/

Documentation site for **Maestro** (desktop app, `care` CLI and TUI), **CARL**
(chain format and runtime) and **IdeaL** (idea lake). Content describes release **0.5.0**;

built with [Astro Starlight](https://starlight.astro.build/).

- **Bilingual**: English (default) + Russian (`/ru`).
- **Three topics, three sidebars**: a splash landing routes to the Maestro, CARL
  and IdeaL doc sets (via `starlight-sidebar-topics`).
- **Brand**: mirrors [care-page](https://github.com/AIRI-MAESTRO/care-page)
  (AIRI aesthetic, mascot EVOC, Manrope + JetBrains Mono).

## Local development

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:4321
npm run build      # production build → ./dist
npm run preview    # preview the production build
```

Node 22.12+ (Astro 6 requirement; see `.nvmrc`).

## Structure

```
src/
├── content/docs/          # all pages
│   ├── index.mdx          # EN splash landing (topic chooser)
│   ├── care/              # EN — Maestro topic (app, CLI, TUI, solvers)
│   ├── carl/              # EN — CARL topic (format + runtime)
│   ├── ideal/             # EN — IdeaL topic (idea lake)
│   └── ru/                # RU mirror (same paths)
├── styles/custom.css      # brand tokens (colors, fonts)
└── assets/                # EVOC mascot + emotes
public/favicon.png         # AIRI crystal favicon
public/maestro.skill       # agent skill bundle served to `uvx maestro-install skill`
astro.config.mjs           # Starlight + i18n + topics config
```

## Adding a page

1. Create a Markdown/MDX file under the right topic directory, e.g.
   `src/content/docs/carl/steps/llm-step.md`.
2. Add `title` + `description` frontmatter.
3. If the directory is new, register it in the topic's `items` in
   `astro.config.mjs` (an `autogenerate` entry picks up files automatically).
4. Mirror it under `src/content/docs/ru/...` for the Russian version. Missing
   translations fall back to English automatically.

## Plan

The full content roadmap lives in [`todo.md`](./todo.md).
