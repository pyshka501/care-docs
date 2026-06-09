---
title: Architecture
description: How CARE sits on top of the four-module stack — generation, execution, persistence, evolution.
sidebar:
  order: 1
---

CARE is the user-facing consumer at the top of a four-module stack. Each module
owns one stage of an agent's lifecycle.

```text
                    ┌──────── GigaEvo Memory ────────┐  (save / load)
                    ▼                                 │
You → CARE → MAGE ──generate──▶ CARL ──result──▶ CARE ┘
                                                 │
                                                 └──evolve──▶ GigaEvo Platform ──winner──▶ Memory
```

| Module | Package | Stage | Role |
| --- | --- | --- | --- |
| **MAGE** | `mmar-mage` | Generation | Turns a natural-language task into a CARL chain. |
| **CARL** | `mmar-carl` | Execution | Runs the chain — DAG parallelism, tools, memory, multi-agent. See the [CARL docs](/carl/getting-started/quick-start/). |
| **GigaEvo Memory** | `gigaevo-client` | Persistence | Stores entities (chain / agent / agent_skill / memory_card), the library, run history. |
| **GigaEvo Platform** | — | Evolution | Genetic search over chains; accept-and-promote the winner. |

## The lifecycle

1. **Generation** — you describe a task; MAGE plans a CARL chain.
2. **Execution** — CARL runs the chain and returns a result (with a token/cost trail).
3. **Persistence** — in Production mode, CARE saves the chain to Memory under a
   stable `chain_id` and records each run.
4. **Evolution** — optionally, Platform runs a GA over the chain and you accept the
   best individual back into the stable channel.

## Canonical flow

Generate Agent A → save it → generate B and C → return to A from the
[Library](/care/tui/screens/) → re-run from the same task + context files →
optionally evolve A and accept the best individual back into the stable channel.

## Graceful degradation

CARE imports every upstream module **lazily** — inside the function that needs it.
So a minimal install still boots the CLI and TUI; a missing piece (e.g. the
optional `care[carl]` extra, or an unconfigured Memory URL) surfaces as a friendly
hint rather than a crash. Without Memory configured, Production mode auto-falls
back to [Ad-Hoc](/care/getting-started/overview/).

## See also

- [What is CARE?](/care/getting-started/overview/) — modes + the big picture.
- [CARL](/carl/getting-started/quick-start/) — the execution engine, documented in full.
