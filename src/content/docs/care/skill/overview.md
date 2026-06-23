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
evolve chains, **visualize and interpret them**, and diagnose the environment — without
hardcoding any path to CARE. It can even **fix bugs in the library source** (autodebug).

:::tip[Download]
**[Download `care-cli.skill`](/care-cli.skill)** — a zip of the skill folder. Install
it for Claude Code or hermes per [Install & Use](/care/skill/install/).
:::

## What's in the bundle

```
care-cli/
├── SKILL.md                      # when-to-trigger + the full command map & workflows
├── scripts/
│   ├── care.sh                   # portable launcher that locates `care`
│   └── viz_chain.py              # chain JSON → Mermaid (via CARL) + steps table
└── references/
    ├── commands.md               # every subcommand & flag
    ├── production-and-tui.md      # Ad-Hoc vs Production, TUI slash-commands
    ├── chain-format.md            # CARL chain JSON: step types, $-references
    ├── visualize.md              # render a chain (CARL to_mermaid + run overlays)
    ├── interpret.md              # explain each step's semantics in plain language
    ├── autodebug.md              # repo map + fix-at-the-source playbook
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

## Beyond the CLI: visualize · interpret · autodebug

After a chain is generated, the skill offers more than raw JSON — it proactively
proposes to **visualize**, **interpret**, run, or **evolve** it:

- **Visualize** — render the dependency DAG using CARL's own `to_mermaid()` (plus
  critical-path and token / latency / cost heatmaps when you pass a run). For example,
  the weather chain:

  ```mermaid
  flowchart TD
      S1["1 · fetch_forecast<br/>mcp"]
      S2["2 · summarise_forecast<br/>llm"]
      S1 --> S2
  ```

- **Interpret** — a plain-language, per-step walkthrough (what each step does, what it
  reads via `$`-references, what it produces, and why it depends on what it does). The
  agent explains it, so this works even with no LLM key or services.
- **Autodebug** — the bundle ships a **repo map** of the whole CARE/CARL stack (what
  each repository owns, key files, a symptom→repo table) and a reproduce → locate →
  patch → verify playbook, so the agent can fix a bug in the library *source* — after
  verifying which install is actually live — instead of only working around it.

## Portable by design

The bundled `scripts/care.sh` resolves `care` the same way in any environment, so the
skill works on a developer machine, in CI, or inside hermes without edits:

1. a global `care` on `PATH` (what [`uvx care-install`](/care/getting-started/quick-start/)
   installs as a shim), else
2. a local `maestro-care` checkout (via `$CARE_HOME` or common locations), else
3. the published package directly: `uvx --from maestro-care care`.

With none of these present it prints an actionable hint instead of failing silently.
See [Install & Use](/care/skill/install/) to set it up.
