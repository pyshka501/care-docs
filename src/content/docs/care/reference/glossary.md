---
title: Glossary
description: Key Maestro terms in one place.
sidebar:
  order: 2
---

| Term | Meaning |
| --- | --- |
| **Maestro** | The product: a desktop app (plus TUI and CLI) to generate, run, repair, save and evolve agent chains. |
| **Maestro desktop app** | The primary interface: a native window around the Maestro harness. Started with `maestro` or `Maestro.app`. |
| **Maestro harness** | The resident chat agent inside the app: sessions, model selection, tools, approvals, background jobs. |
| **`maestro-care`, `care`** | The Python package and its import name. `care` is also a command alias of `maestro`. CARE stands for Collaborative Agent Reasoning Ecosystem. |
| **Session** | One conversation in a workspace. Generated chains, runs and approvals belong to it. |
| **Chat model** | The model selected in a session. In the app it does generation, execution, repair, data generation, drafts and idea translation. |
| **Strategy** | How the agent handles a chain request: direct answer, reuse a saved chain, generate one, let the agent write one, or use an artifact from the session. |
| **Chain** | A CARL program of typed steps with dependencies. MAGE generates it; CARL executes it. |
| **Artifact** | An exact chain or input staged in a session, pinned by SHA-256. Runs and evolution use artifacts, never "whatever is current". |
| **Input contract** | The input schema a chain declares. Input is checked against it before a run. |
| **Repair** | A proposed corrected chain after a failed run. Never run automatically; the original does not change. |
| **Library** | The app panel with saved chains, memory cards, ideas, datasets, tools and skills. |
| **Chain card** | A saved chain in the Library: structure graph, rename, evolutions, Run / Evolve / Data actions. |
| **Draft request** | Text that a Library action puts into a session's input field. You review and send it; nothing runs from the panel. |
| **Activity** | The app panel listing Maestro work across all sessions. |
| **Full access** | A session preset that never asks; paid Maestro work then runs without a dialog. |
| **Paid work** | Actions that call a model: generation, execution, repair, evolution start, data generation start, drafts, idea translation. One confirmation each. |
| **Background job** | Generation, execution, repair or evolution moved to the harness job list. Lost on restart. |
| **CARL** | The chain runtime and format. See [CARL](/carl/getting-started/overview/). |
| **MAGE** | The generator that turns a task into a CARL chain. |
| **GigaEvo Memory** | The store for chains, memory cards, tools and skills. |
| **IdeaL** | The idea lake in GigaEvo Memory: ideas per namespace, rated by evolution outcomes. See [IdeaL](/ideal/getting-started/overview/). |
| **Namespace** | The IdeaL space Maestro reads and writes (`CARE_MEMORY__IDEAL_NAMESPACE`). |
| **Idea** | A concrete, reusable change to a chain, given to evolution mutations. Archived, never deleted. |
| **Radar** | The app view of one evolution run in IdeaL: ideas around the task, their effect, best-score curve, ideas versus control. |
| **Evolution platform** | GigaEvo Platform: mutates and scores chains on a dataset. |
| **Evolution data / benchmark factory** | Maestro's generator of verified datasets for evolution. Versions are named `bf_<hex>.v<N>`. |
| **Search part / holdout** | The dataset part given to evolution / the hidden part kept in the local store. |
| **Workshop** | Draft → checks → save for tools and skills. |
| **Tool** | A Python function a chain step calls. |
| **AgentSkill** | A portable `SKILL.md` folder a chain step can run. See [Capabilities](/care/capabilities/overview/). |
| **Sandbox** | Where skill scripts and generated code run. Docker by default. |
| **STARM solver** | A small trained model for an algorithmic task, exposed as a tool. See [STARM solvers](/care/solvers/starm/). |
| **`chain_id`** | The id a chain is saved under in Memory. |
| **Version, channel** | Saved entities have immutable versions; channels (`latest`, `stable`) point at versions. |
| **`memory_card`** | A saved note or run digest in Memory. |
| **Interactive mode** | TUI mode (default; formerly Ad-Hoc): generate, ask before running, show the answer; save and evolve by buttons. |
| **Ad-Hoc** | Former name of Interactive. `ad_hoc` is still read as `interactive`. |
| **Production mode** | TUI mode: generate, save, baseline, evolve; follow-ups revise the saved chain. |
| **Stage policy** | TUI per-stage behaviour: `ask`, `auto` or `skip` (`CARE_CHAT__MODE__<MODE>__<STAGE>`). |
| **Dataset (eval cases)** | TUI/CLI test cases of a chain stored as memory cards (`maestro dataset`, `/dataset`). Separate from evolution data. |
| **Lineage** | A chain's ancestry (`maestro lineage`). |
| **Fitness** | A candidate chain's score on the dataset. |
| **Preflight** | Static validation before execution (`maestro validate`). |
| **Agent hub** | A local process that serves deployed chains as HTTP agents (`/deploy`, `maestro deploy`). |
| **Catalog** | Installed skills, MCP servers, tools and memory cards (`maestro catalog`, `Ctrl+K` in the TUI). |

## See also

- [Architecture](/care/concepts/architecture/) · [FAQ](/care/reference/faq/)
