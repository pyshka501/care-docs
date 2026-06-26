---
title: The TUI
description: The MAESTRO CARE terminal interface — chat surface, modes, keys, and how a run unfolds.
sidebar:
  order: 1
---

`care` (no subcommand) launches the Textual TUI. It opens directly into the **chat
surface** — a Claude-Code-style transcript with a prompt at the bottom and a mode
toggle above it.

## The chat surface

- **Type a task** in natural language → MAGE generates a chain, CARL runs it, the
  answer prints inline.
- **Type a [slash command](/care/slash-commands/overview/)** (`/help`, `/library`, …)
  for the non-chat affordances.
- The **mode toggle** above the prompt switches [Interactive ↔ Production](/care/workflows/modes/) —
  Interactive is the default.
- **Inspect the chain** behind any answer: chat exposes [chain DAG affordances](/care/tui/dag/)
  to step through the graph, and an **Artifacts pill** collects the files a run produced.
- First-time users get a one-line offer to type `/tour` for a 5-step walkthrough.

### How a run unfolds

As MAGE generates and CARL executes, the transcript shows a **stage trail** —
`▶ Friendly Label…` lines that complete to `✓`, with `⎿` sub-rows for details.
The status bar tracks token usage live.

### Attaching files

Reference files inline with `@<path>` — e.g. `summarise @report.pdf`. PDFs are
text-extracted; images are embedded for vision-capable models. Quoting works for
paths with spaces: `@"My Notes.md"`.

## Global keys

| Key | Action |
| --- | --- |
| `Ctrl+P` | Command palette (fuzzy over commands + saved entities). |
| `Ctrl+B` | Task list drawer (in-flight workers). |
| `Ctrl+K` | Capability catalog (skills / MCP / tools). |
| `?` | Help — tutorial + every binding for the active screen. |
| `Ctrl+C` | Quit. |

Each screen layers its own bindings — press `?` for the set filtered to the screen
you're on.

## Where to go next

- [Screens reference](/care/tui/screens/) — every screen + modal and how to reach it.
- [Slash commands](/care/slash-commands/overview/) — the full `/command` list.
- [Chat modes](/care/workflows/modes/) — Interactive vs Production.
- [Chain DAG](/care/tui/dag/) — inspect the graph behind an answer.
