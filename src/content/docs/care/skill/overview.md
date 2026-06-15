---
title: Overview
description: The care-cli Agent Skill — let Claude Code or hermes drive the CARE CLI, with portable auto-detection of `care`.
sidebar:
  order: 1
---

**care-cli** is an [agentskills.io](https://agentskills.io)-format **Agent Skill**:
a small bundle that teaches an agent (Claude Code, or NousResearch
[hermes](https://github.com/nousresearch/hermes-agent)) how to drive the headless
[`care` CLI](/care/cli/overview/) — generate and run CARL chains, browse Memory,
evolve chains, and diagnose the environment — without hardcoding any path to CARE.

:::tip[Download]
**[Download `care-cli.skill`](/care-cli.skill)** — a zip of the skill folder. Install
it for Claude Code or hermes per [Install & Use](/care/skill/install/).
:::

## What's in the bundle

```
care-cli/
├── SKILL.md                      # when-to-trigger + the full command map & workflows
├── scripts/care.sh               # portable launcher that locates `care`
└── references/
    ├── commands.md               # every subcommand & flag
    ├── production-and-tui.md      # Ad-Hoc vs Production, TUI slash-commands
    ├── chain-format.md            # CARL chain JSON: step types, $-references
    └── integration.md             # embedding into hermes / CI / other hosts
```

## What it lets the agent do

| Area | Skill drives |
| --- | --- |
| **Generate / run** | `care generate "<task>"`, preflight or `run --execute` with `--input`, `replay`, export to `.json`/`.py` |
| **Memory & library** | `memory ls/show/history`, `search`, `diff`, `lineage`, `favourite` |
| **Validate / import** | `validate <chain.json>`, `import '<glob>' [--apply]` |
| **Capabilities / evolution** | `catalog`, `marketplace`, `evolve … --wait --accept` |
| **Setup / diagnostics** | `doctor`, `init`, `migrate-secrets` |

It also carries the knowledge that makes those commands reliable: the
[Ad-Hoc vs Production](/care/workflows/modes/) distinction, an honest map of what is
CLI-reachable vs [TUI-only](/care/slash-commands/overview/) (revise / dataset /
promote / upload / forget), the [CARL chain format](/carl/chains/overview/), and
practical gotchas (`doctor`/`init` have no `--json`; a fresh Memory's `search` index
is empty — use `memory ls --q`; pass absolute file paths because the launcher may run
`care` from the workspace).

## Portable by design

The bundled `scripts/care.sh` resolves `care` the same way in any environment, so the
skill works on a developer machine, in CI, or inside hermes without edits:

1. a global `care` on `PATH` (what [`uvx care-install`](/care/getting-started/quick-start/)
   installs as a shim), else
2. a local `maestro-care` checkout (via `$CARE_HOME` or common locations), else
3. the published package directly: `uvx --from maestro-care care`.

With none of these present it prints an actionable hint instead of failing silently.
See [Install & Use](/care/skill/install/) to set it up.
