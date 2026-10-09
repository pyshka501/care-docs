---
title: What is IdeaL?
description: IdeaL is the idea lake for chain evolution. It stores concrete changes to a chain and missing tools, hands them to evolution and generation, and rates them by measured outcomes.
sidebar:
  order: 1
---

**IdeaL** (the idea lake) is a shared store of ideas for improving chains. It
lives inside the GigaEvo Memory API, next to saved chains, and adds two things
on top of plain storage:

- it hands relevant ideas to evolution before each mutation and to chain
  generation before planning;
- it records what happened after an idea was applied, and ranks ideas by those
  measured outcomes.

## What the lake holds

| Item | What it is | Stored as |
| --- | --- | --- |
| **Idea** | One concrete, testable change to a chain: which step, what changes, when it helps. Example: "Add a step after extraction that recomputes the total from the line items and flags a mismatch." | `memory_card` with `content.status = "active"` |
| **Tool** | A deterministic capability that an LLM step does poorly: arithmetic, date normalisation, exact lookup. | `tool` with a `tool_key` |
| **Task chain** | The best chain of a finished evolution run, tagged with its task. | `chain` tagged `task:<task_key>` |

Generic advice ("improve the prompt", "use a stronger model") is not an idea.
An idea must be something a mutator can apply as written.

## Who writes and who reads

| Actor | Reads | Writes |
| --- | --- | --- |
| **Evolution** | An idea slate before each mutation (`mode=evolution`). | The outcome of every evaluated mutation, and the best chain at the end of the run. |
| **Generation** (MAGE in Maestro) | Ideas, tools and task chains before planning (`mode=catalog`). | Nothing. Catalog reads are not recorded. |
| **People in Maestro** | The Ideas section of the Library, the run radar. | New ideas, edits, archive and restore. |
| **The Maestro agent** | The lake graph and run radars. | Seeded ideas, after you approve the list. |
| **IdeaL web UI** | Overview, graph, runs. | Ideas and tools added by hand or seeded with the lake's own LLM. |
| **Any agent harness** | Through REST or MCP (`/mcp`). | Mutation and run outcomes. |

Everything written to a namespace is visible to every key that can read that
namespace. See [Namespaces and keys](/ideal/concepts/namespaces-and-keys/).

## How the loop works

1. Ideas get into the lake: seeded by a person or an agent, or extracted from
   past mutations when extraction is enabled on the server.
2. Before each mutation, evolution asks for a slate. About 30% of slates are
   deliberately empty (the **control** arm), so the lake can compare "with
   ideas" against "without ideas".
3. After the child chain is evaluated, evolution reports the score change and
   the ideas it actually applied.
4. IdeaL updates each idea's rating: gain rate and strength, per task and
   across tasks. Better-rated ideas are picked more often next time.
5. At the end of a run, the best chain is stored as a task chain. Generation
   can start from it on the same task.

## Limits to know up front

- **Search is English-only.** Full-text search uses PostgreSQL's English
  configuration. A Russian query or a Russian idea usually finds nothing by
  relevance; the lake then falls back to padding by name. Write ideas in
  English. Maestro's idea form can translate a draft for you.
- **Ratings need volume.** With few applications, gain rate and strength are
  shrunk toward neutral. The UI marks such ratings as unreliable.
- **Path attribution is naive.** Every idea on the lineage of the best chain
  counts as a "path win".

## Next

- [Quick start](/ideal/getting-started/quick-start/): run the lake locally,
  log in, create and find an idea.
- [Ideas](/ideal/concepts/ideas/) and [Rating and outcomes](/ideal/concepts/rating/).
- [IdeaL in Maestro](/ideal/maestro/connect/).
