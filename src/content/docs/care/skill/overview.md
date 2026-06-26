---
title: Overview
description: The Maestro agent skill — install it so Claude Code or hermes can drive Maestro, with portable auto-detection of `care`.
sidebar:
  order: 1
---

**maestro** is an [agentskills.io](https://agentskills.io)-format **Agent Skill**: a
small bundle that teaches an agent (Claude Code, or NousResearch
[hermes](https://github.com/nousresearch/hermes-agent)) to drive Maestro from the
headless [`care` command](/care/cli/overview/) — generate and run chains, browse
memory, evolve chains, and **interpret & visualize** them — without hardcoding any
path to Maestro.

:::tip[Install in one command]
```bash
uvx maestro-install skill
```
Downloads and unpacks the skill into Claude Code / Codex / hermes / OpenClaw (pick with
`--agent`). Full steps: [Install & Use](/care/skill/install/). (Direct bundle:
[`maestro.skill`](https://airi-maestro.github.io/care-docs/maestro.skill).)
:::

## What's in the bundle

```
maestro/
├── SKILL.md                      # when-to-trigger + the full command map & workflows
├── scripts/
│   ├── care.sh                   # portable launcher that locates `care`
│   └── viz_chain.py              # chain JSON → Mermaid graph + steps table
└── references/
    ├── commands.md               # every subcommand & flag
    ├── production-and-tui.md      # Ad-Hoc vs Production, TUI slash-commands
    ├── chain-format.md            # chain JSON: step types, $-references
    ├── interpret.md              # interpret & visualize a chain (graph + per-step)
    └── integration.md             # embedding into hermes / CI / other hosts
```

## What it lets the agent do

| Area | Skill drives |
| --- | --- |
| **Generate / run** | `care generate "<task>"`, preflight or `run --execute` with `--input`, `replay`, export to `.json`/`.py` |
| **Memory & library** | `memory ls/show/history`, `search`, `diff`, `lineage`, `favourite` |
| **Validate / import** | `validate <chain.json>`, `import '<glob>' [--apply]` |
| **Evolution** | `catalog`, `marketplace`, `evolve … --wait --accept` |
| **Setup / diagnostics** | `doctor`, `init`, `migrate-secrets` |

It also carries the knowledge that makes those commands reliable: the
[Ad-Hoc vs Production](/care/workflows/modes/) distinction, an honest map of what is
CLI-reachable vs [TUI-only](/care/slash-commands/overview/) (revise / dataset /
promote / upload / forget), the [chain format](/carl/chains/overview/), and practical
gotchas (`doctor`/`init` have no `--json`; a fresh memory's `search` index is empty —
use `memory ls --q`; pass absolute file paths because the launcher may run `care` from
the workspace).

## Beyond the CLI: interpret & visualize

After a chain is generated, the skill offers more than raw JSON — its first move is to
**interpret & visualize** it (and it can also run or evolve it):

- **Interpret & visualize, together** — render the dependency DAG (Maestro's own
  `to_mermaid`, plus critical-path and token / latency / cost heatmaps when you pass a
  run) **and** walk every step in plain language: what it does, what it reads via
  `$`-references, what it produces, and why it depends on what it does. The graph gives
  the shape, the per-step notes give the meaning — as one explanation. The agent does
  the interpreting, so it works even with no model key or services. For example, a
  two-step weather chain:

  ```mermaid
  flowchart TD
      S1["1 · fetch_forecast<br/>mcp"]
      S2["2 · summarise_forecast<br/>llm"]
      S1 --> S2
  ```

- **Run / evolve** — execute the chain on a sample input (`care run --execute`) or
  improve it automatically (`care evolve --wait --accept`).

## Portable by design

The bundled `scripts/care.sh` resolves `care` the same way in any environment, so the
skill works on a developer machine, in CI, or inside hermes without edits:

1. a global `care` on `PATH` (what [`uvx maestro-install`](/care/getting-started/quick-start/)
   installs as a shim), else
2. a local checkout (via `$CARE_HOME` or common locations), else
3. the published package directly: `uvx --from maestro-care care`.

With none of these present it prints an actionable hint instead of failing silently.
See [Install & Use](/care/skill/install/) to set it up.
