---
title: Memory and Reuse
description: How MAGE reads and writes GigaEvo Memory today, how Maestro feeds it IdeaL catalog hints, and the experimental reuse ladder of the v3 generator.
sidebar:
  order: 3
---

Memory in MAGE comes in two layers. The library layer is what
`MAGEGenerator` does and what Maestro runs. The v3 layer is research code; it
is described at the end of this page and is not callable from the package.

## Library: recall and save

**Released**, with stricter rules on the development line. Memory is optional:
it needs the `memory` extra (`gigaevo-client`) and a running GigaEvo Memory
service at `memory_base_url` (default `http://localhost:8002`). Every memory
failure is logged and generation continues.

| What | Switch (default) | Notes |
| --- | --- | --- |
| Recall related chains before planning | `enable_memory_research` (off) | Deep mode only. Sub-queries over `current_task`, search by `memory_search_mode` (`hybrid`, `bm25` or `vector`), an applicability gate (`memory_applicability_threshold`, `memory_min_applicable_hits`), then a short digest for the step planner. With no applicable hits it is a cold start. |
| Recall skills from Memory | `enable_memory_skill_lookup` (off) | Feeds capability lookup. |
| Save the generated chain | `enable_memory` (on) | `MemoryManager.save_chain`. |
| Save skills, reusable steps, failure cards, artifacts | `enable_*_save` flags (off) | Keys appear in `MAGEResult.memory_keys`. |

The save is implicit and has conditions (development line):

- the task was a plain string, or the request has
  `PersistencePolicy(mode="safe_projection_only")`;
- nothing private reached the planning prompt;
- `compile()` never saves.

A saved chain carries a metadata block in `content.metadata`:
`task_description` (the safe task only), `context_files`,
`generated_by="mage"`, `mage_metadata`, `display_name`, `description`. See
[CARL chain metadata](/carl/care-integration/metadata/).

## Maestro: recall by the host, IdeaL hints

**Development line.** Maestro does not let MAGE search memory on its own when
IdeaL is the chain memory. Before generation it asks the IdeaL catalog for
related chains, ideas and tools of the task (`mode=catalog`), then passes the
answer to MAGE as one `RetrievedUntrustedContext` with id `ideal-catalog`
under `DataEgressPolicy(generation_model_context="allow_selected_retrieved_context")`.
In that case Maestro turns off `enable_memory`, `enable_memory_research` and
`enable_memory_skill_lookup`. MAGE sees the hints as labelled data and writes
nothing back: catalog reads are not recorded in IdeaL.

With the legacy GigaEvo backend Maestro also recalls first and passes the
result as untrusted context. See
[Maestro as host](/mage/integration/maestro-host/) and
[IdeaL overview](/ideal/getting-started/overview/).

## Experimental: generation memory and the reuse ladder

**Experimental**, branch `feat/v3-ideal-loop`, used only by the v3 generator
in the evaluation harness (`mmar_mage/generation_memory.py`,
`mmar_mage/ideal_loop.py`).

A task gets a **profile** (task families derived from the input schema, tools,
output contract) and a stable **task key**. Two memories build on that:

**Examples and ideas** (`memory_mode`): skeletons of up to two proven chains
of similar tasks, and up to three IdeaL ideas, are added to the author's
prompt; the ideas used are cited in the generation's trace. Stores: a local
JSON file or the IdeaL catalog.

**Reuse ladder** (`memory_loop`, hypothesis H1 of the memory study):

| Rung | Condition (defaults) | What happens |
| --- | --- | --- |
| Exact | Same task key, execution fitness ≥ 0.999 | The stored chain is compiled and admitted for the new contract and returned with **no model call**. |
| Near | Profile similarity ≥ 0.8, fitness ≥ 0.999 | The stored chain is the starting draft. By default (`memory_loop_near_mode: adapt`) the author gets one call to check every requirement; the planner is skipped. |
| Demotion | A reused chain later fails execution | It is never offered again. |

Fitness comes from execution: after a benchmark case runs, the runner records
the chain with its execution quality, in a local store or as an IdeaL run
outcome.

:::note[What was measured]
An internal measurement on 9 October 2026 showed no gain from skeleton
examples on a set without repeated tasks. The reuse ladder and the IdeaL loop
were added on 2 November 2026 and tested offline (fake stores, no model
calls); they have not been measured.
:::

## See also

- [IdeaL loop](/mage/concepts/ideal-loop/)
- [Configuration](/mage/integration/configuration/)
