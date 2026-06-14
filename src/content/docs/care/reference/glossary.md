---
title: Glossary
description: Key MAESTRO CARE terms in one place.
sidebar:
  order: 2
---

| Term | Meaning |
| --- | --- |
| **MAESTRO CARE** | The product you interact with — a Textual TUI plus the headless `care` CLI. (*CARE* = Collaborative Agent Reasoning Ecosystem.) |
| **CARL** | The format reasoning chains are written in — typed steps, dependencies, and DAG execution. Reference library: `mmar-carl` (Collaborative Agent Reasoning Library). See the [CARL docs](/carl/getting-started/quick-start/). |
| **MAGE** | The generator that turns a task into a CARL chain. |
| **GigaEvo Memory** | The store for saved entities (chains, agents, skills, run records) — the Library. |
| **GigaEvo Platform** | The evolution service (genetic search over chains). |
| **Chain** | A reasoning chain in the CARL format — the unit MAGE generates and MAESTRO CARE runs. |
| **`chain_id`** | The stable id a chain is saved under in Memory. |
| **Agent** | A saved, named chain in the Library you return to and re-run. |
| **AgentSkill** | A portable skill folder (`SKILL.md` + scripts) a chain can run. See [Capabilities](/care/capabilities/overview/). |
| **`memory_card`** | A saved note / run digest entity in Memory. |
| **Channel** | A version channel for a saved chain; `latest` is the default `care run` reads. |
| **Lineage** | A chain's ancestry DAG (parents it was derived/evolved from) — see `care lineage`. |
| **Fitness** | An evolved chain's score on the dataset; higher wins. |
| **Ad-Hoc mode** | Generate + run inline; nothing is saved. |
| **Production mode** | Generate a reproducible chain, save it to Memory, seed a dataset, optionally evolve. |
| **Preflight** | Static validation of a chain before execution (`care validate` / `care run`). |
| **Catalog** | The list of installed capabilities (skills / MCP / tools / cards) — `Ctrl+K` or `care catalog`. |

## See also

- [Architecture](/care/concepts/architecture/) — how the modules fit together.
- [FAQ & Troubleshooting](/care/reference/faq/)
