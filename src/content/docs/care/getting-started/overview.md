---
title: What is CARE?
description: The Collaborative Agent Reasoning Ecosystem — a TUI and CLI for generating, running, and evolving agent chains.
sidebar:
  order: 2
---

**CARE** — Collaborative Agent Reasoning Ecosystem — is a Textual TUI + headless
`care` CLI for generating, running, and evolving [CARL](/carl/getting-started/quick-start/)
agent chains. It is the user-facing consumer on top of a four-module stack:
**MAGE** (generation), **CARL** (execution), **GigaEvo Memory** (persistence),
and **GigaEvo Platform** (evolution).

## Chat modes

The toggle above the prompt picks one of two modes (`/mode` switches it from the
keyboard). The default is **Ad-Hoc**, configurable per-deployment with
`CARE_CHAT__DEFAULT_MODE`.

| Mode | What happens on every prompt |
| --- | --- |
| **Ad-Hoc** | MAGE generates a chain, CARL runs it on the spot, the answer prints inline. The agent may loop (ReAct) until it decides the task is done. **Nothing is saved.** |
| **Production** | MAGE generates a *reproducible* chain, CARE saves it to Memory under a stable `chain_id`, runs one baseline to seed a dataset entry, and (when Platform is wired) kicks off an evolution run. |

Production requires `CARE_MEMORY__BASE_URL`. Without Memory configured,
selecting Production auto-falls back to Ad-Hoc with a warning.

## The canonical flow

Generate Agent A → save it → generate B and C → return to A from the library →
re-run from the same task + context files → optionally evolve A and accept the
best individual back into the stable channel.

## Where to go next

- [Quick Start](/care/getting-started/quick-start/) — boot the TUI in five minutes.
- [CLI reference](/care/cli/overview/) — every `care` subcommand.
