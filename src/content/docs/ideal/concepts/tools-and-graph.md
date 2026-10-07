---
title: Tools, chains and the graph
description: Tools as first-class lake entities, how saved chains are decomposed into tool relations, task chains, and the IdeaL graph of ideas, tools, runs and chains.
sidebar:
  order: 4
---

## Tools

A **tool** is a deterministic capability that a chain can call: arithmetic,
date normalisation, an exact lookup. It is a separate versioned entity
(`/v1/tools`), not an idea and not a chain step.

| Field | Meaning |
| --- | --- |
| `tool_key` | Canonical key, unique within a namespace. Experience transfers between namespaces by this key. |
| `name`, `description` | What it does. |
| `input_schema`, `output_schema` | JSON schemas. |
| `runtime`, `implementation_ref`, implementation hash | Where the code lives and how it runs. |
| `status` | Delivered unless `archived`. |

Both retrieve modes return at most `RETRIEVE_TOOL_LIMIT` (default 1)
relevant tools. Tools are never added as padding: an irrelevant tool is not
returned at all.

Use a tool when an LLM step keeps failing at something exact. If you have no
implementation yet, write the need as an idea instead ("add a deterministic
step that …"). In Maestro, real tools are created in the tools workshop,
which writes code and tests it in a sandbox; the idea form does not create
tools.

## Chains in the lake

Two kinds of chains matter to IdeaL:

- **Task chains**: the best chain of each finished run, stored by the run
  outcome and tagged `task:<task_key>` (prefix from `IDEAL_TASK_TAG_PREFIX`).
  Catalog retrieval with a `task_key` returns them ordered by fitness. When
  the task has no chains yet, or no `task_key` is given, chains of similar
  tasks are found by search.
- **Any saved chain**: every saved chain version is decomposed without an
  LLM. For each `step_type=tool` step, IdeaL resolves `carl:<tool_name>` in the
  same namespace or creates an `unresolved` tool stub, and records:
  - `chain uses_tool tool` (with the step numbers);
  - `step invokes_tool tool` (the step is a virtual node inside the chain
    version, identified by chain version, step number and a fingerprint).

Run outcomes add `chain derived_from idea` for each path idea. Relation
writes are idempotent. If decomposition fails, the chain is still saved; the
migration backfill retries it.

## The graph

`GET /v1/ideal/graph?namespace=...` returns one generic graph:

| Node types | Edge types |
| --- | --- |
| `idea`, `tool`, `run`, `chain`, virtual `step` | Events: `delivered`, `cited`, `path`, `result`. Relations: `uses_tool`, `invokes_tool`, `derived_from`, projected `contains_step`. |

Idea and tool nodes carry their rating fields (`gain_rate`, `strength`,
delivered and cited counts). For each chain the graph uses its `evolved`
channel, falling back to `latest`.

Maestro's Library draws this graph (see
[Ideas in the Library](/ideal/maestro/library/)). The IdeaL web UI has its own
graph view behind the **Graph** button on the IdeaL tab.

## Known limits

- An `unresolved` tool stub is inserted without an entity event and starts
  at `version_number=0`.
- Tools stay namespace-scoped; only their experience transfers by `tool_key`.
- Decomposition does not attribute ideas to individual steps from mutation
  diffs.
