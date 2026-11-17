---
title: The TUI
description: The Maestro terminal interface — chat surface, modes, keys, and how a run unfolds.
sidebar:
  order: 1
---

The Textual TUI is a supported secondary interface to Maestro. The primary interface
is the [desktop app](/care/cli/app/); the TUI is for terminal work, SSH sessions and
machines without a desktop. Both read the same config and the same Memory.

```bash
maestro tui
```

Bare `maestro` opens the desktop app, not the TUI. The TUI opens straight into the
**chat surface**: a transcript with a prompt at the bottom and a mode toggle above it.

## The chat surface

- **Type a task** in plain language. The chain generator builds a chain, the runtime
  runs it, and the answer prints inline.
- **Type a [slash command](/care/slash-commands/overview/)** (`/help`, `/library`, …)
  for everything else. Type `/` for an autocomplete list.
- The **mode toggle** switches [Interactive ↔ Production](/care/workflows/modes/).
  Interactive is the default: it asks before running a chain (switch to
  run-immediately in `/settings`) and saves nothing unless you do. Production saves
  every chain to Memory, records a baseline run and starts evolution when the
  Platform is configured. Without Memory, Production falls back to Interactive.
- **Inspect the chain** behind an answer: the **View chain** button opens the
  [chain DAG](/care/tui/dag/), and the **Artifacts pill** collects what the chat
  produced.
- First-time users get a one-line offer to type `/tour` for a 5-step walkthrough.

### How a run unfolds

While a chain is generated and executed, the transcript shows a **stage trail**:
`▶ Label…` lines that complete to `✓`, with `⎿` sub-rows for details. The status bar
tracks token usage live. In Production mode a successful generation continues
automatically with save, baseline run and, if configured, evolution.

### Attaching files

Reference files inline with `@<path>`, for example `summarise @report.pdf`. Typing
`@` opens a file autocomplete. PDFs are text-extracted; images are embedded for
vision-capable models. Quote paths with spaces: `@"My Notes.md"`.

## Global keys

| Key | Action |
| --- | --- |
| `Ctrl+P` | Command palette (fuzzy over commands and saved entities). |
| `Ctrl+K` | Capability catalog (skills / MCP / tools). |
| `Ctrl+B` | Task list drawer (in-flight workers). In chat, `Ctrl+B` copies the first code block of the latest reply instead. |
| `?` | Help: tutorial and every binding for the active screen. |
| `Ctrl+S` / `Ctrl+R` | Save / re-run the current artifact, on screens that support it. |
| `Esc` | Back. |
| `Ctrl+C` | Quit. `Ctrl+Q` also quits, except in chat, where it quotes the last reply. |

Each screen adds its own bindings. Press `?` for the set of the screen you're on, or
run `maestro help --screen <ScreenName>` in a shell.

## What the TUI does not cover

The resident agent, IdeaL idea work (seeding, the run radar, forcing an idea), the
tools workshop, benchmark generation and the STARM solvers' strict mode are part of
the desktop app. The TUI uses the same Memory, so chains saved in the app show up in
the TUI library.

## Where to go next

- [Screens reference](/care/tui/screens/) — every screen and modal and how to reach it.
- [Slash commands](/care/slash-commands/overview/) — the full `/command` list.
- [Chat modes](/care/workflows/modes/) — Interactive vs Production.
- [Chain DAG](/care/tui/dag/) — inspect the graph behind an answer.
