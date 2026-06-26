---
title: Glossary
description: Key MAESTRO terms in one place.
sidebar:
  order: 2
---

| Term | Meaning |
| --- | --- |
| **MAESTRO** | The whole system — generate, run, and evolve reasoning chains. You use it via the MAESTRO CARE TUI or the `care` CLI. |
| **MAESTRO CARE** | The Textual TUI — the terminal interface to MAESTRO (the `care` command launches it). |
| **CARL** | Collaborative Agent Reasoning Library — the format reasoning chains are written in (and the library that runs them). See the [CARL docs](/carl/getting-started/overview/). |
| **MAGE** | The generator that turns a task into a CARL chain. |
| **GigaEvo Memory** | The store for saved entities (chains, agents, skills, run records) — the Library. |
| **GigaEvo Platform** | The evolution service (genetic search over chains). |
| **Chain** | A CARL reasoning chain — the unit MAGE generates and CARL executes. |
| **`chain_id`** | The stable id a chain is saved under in Memory. |
| **Agent** | A saved, named chain in the Library you return to and re-run. |
| **AgentSkill** | A portable skill folder (`SKILL.md` + scripts) a chain can run. See [Capabilities](/care/capabilities/overview/). |
| **`memory_card`** | A saved note / run digest entity in Memory. |
| **Channel** | A version channel for a saved chain; `latest` is the default `care run` reads. |
| **Lineage** | A chain's ancestry DAG (parents it was derived/evolved from) — see `care lineage`. |
| **Fitness** | An evolved chain's score on the dataset; higher wins. |
| **Ad-Hoc mode** | Generate + run inline; nothing is saved. |
| **Interactive mode** | The default chat surface — generate a chain, run it on the spot, answer inline; save / evolve are your call (button-driven). The legacy `ad_hoc` name normalises to this. See [Chat surfaces](/care/workflows/modes/). |
| **Production mode** | Generate a reproducible chain, save it to Memory, seed a dataset, optionally evolve. |
| **Per-stage policy** | How each pipeline stage behaves: `ask` (confirm gate first), `auto` (do it silently), or `skip` (never, and skip dependents). Set per surface via `CARE_CHAT__MODE__<MODE>__<STAGE>`. See [Stage policy](/care/workflows/modes/). |
| **Soft config parsing** | A malformed or legacy `default_mode` never crashes the config load: known aliases are normalised, anything unrecognised falls back to the default (`interactive`) with a logged warning. |
| **Version** | An immutable point in a saved entity's history. Channels (`latest`, `stable`) are named pointers into that history — see `care versions`. |
| **`rollback`** | Repoint a channel at a specific version — a non-destructive pin, not a revert (`care rollback`, TUI `/rollback`). |
| **`promote`** | Copy one channel pointer to another (default `latest → stable`) — `care promote`. The TUI `/promote` layers a baseline/eval gate on top. |
| **Library bundle** | A portable tarball packing saved chains (+ AgentSkills) for transfer to another machine — `care export` / `care import`. |
| **Dataset (eval case)** | A chain's set of `task → expected` test cases used to baseline and score it — `care dataset list/add/run/export`. |
| **Long-term memory (LTM)** | A per-session notes store that persists facts and preferences across runs (`care remember` / `care notes`), separate from the entity Library. |
| **Agent hub** | A lightweight local process that serves a deployed chain as an HTTP agent with its own Swagger UI — `care deploy` / `deployments` / `metrics`. See [Deploy](/care/workflows/deploy/). |
| **DAG modal** | The full-screen chain view (`F`) that puts the box-and-arrow graph, step list, and details side by side; under `/revise` it overlays the new version's diff. See [Reading the DAG](/care/tui/dag/). |
| **Latency heat-map** | A DAG overlay that shades each step box by a run metric (latency / tokens / cost) on a low→high scale. |
| **Pareto front** | The table of non-dominated individuals from an evolution run; with ≥ 2 objectives a 2D scatter sits beneath it. |
| **Evolution dashboard** | The TUI screen (`/evolution`) that lists active + recent runs and streams a live Fitness chart, Pareto front, Programs, and Versions. See [Evolution](/care/tui/evolution/). |
| **Preflight** | Static validation of a chain before execution (`care validate` / `care run`). |
| **Catalog** | The list of installed capabilities (skills / MCP / tools / cards) — `Ctrl+K` or `care catalog`. |

## See also

- [Architecture](/care/concepts/architecture/) — how the modules fit together.
- [FAQ & Troubleshooting](/care/reference/faq/)
