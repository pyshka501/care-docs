---
title: What is MAESTRO CARE?
description: A TUI and CLI that generates, runs, and evolves reasoning chains written in the CARL format.
sidebar:
  order: 2
---

Describe a task in plain language, and **MAESTRO CARE** assembles an AI agent for
it, runs it in front of you, and keeps improving the result — all from your
terminal, with no pipelines to wire by hand.

Under the hood, **MAESTRO CARE** is a Textual TUI plus a headless `care` CLI for
generating, running, and evolving reasoning chains written in the
[CARL format](/carl/getting-started/quick-start/). It is the product on top of a
four-part stack: **MAGE** (generation), **CARL** (the chain format),
**GigaEvo Memory** (persistence), and **GigaEvo Platform** (evolution).

## Chat modes

The toggle above the prompt picks one of two modes (`/mode` switches it from the
keyboard). The default is **Ad-Hoc**, configurable per deployment with
`CARE_CHAT__DEFAULT_MODE`.

| Mode | What happens on every prompt |
| --- | --- |
| **Ad-Hoc** | MAGE generates a chain, MAESTRO CARE runs it on the spot, and the answer prints inline. The agent may loop (ReAct) until it decides the task is done. **Nothing is saved.** |
| **Production** | MAGE generates a *reproducible* chain, MAESTRO CARE saves it to Memory under a stable `chain_id`, runs one baseline to seed a dataset entry, and (when Platform is wired) kicks off an evolution run. |

Production requires `CARE_MEMORY__BASE_URL`. Without Memory configured,
selecting Production auto-falls back to Ad-Hoc with a warning.

## The canonical flow

Generate Agent A → save it → generate B and C → return to A from the library →
re-run from the same task and context files → optionally evolve A and accept the
best individual back into the stable channel.

## Where to go next

- [Quick Start](/care/getting-started/quick-start/) — boot the TUI in five minutes.
- [CLI reference](/care/cli/overview/) — every `care` subcommand.
