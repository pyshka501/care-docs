---
title: JSON Serialization
description: Save, load and version chains as JSON — what round-trips, on which load path, and what is lost.
sidebar:
  order: 1
---

Chains round-trip to JSON so you can persist, share and reload them.

```python
chain.save("my_chain.json")                     # write to disk
loaded = ReasoningChain.load("my_chain.json")   # default load path

d = chain.to_dict();   ReasoningChain.from_dict(d)
s = chain.to_json();   ReasoningChain.from_json(s)

typed = ReasoningChain.from_dict_typed(d)       # typed load path
```

`from_dict` validates the chain (cycles, dependency references, reference
syntax warnings) before returning it.

## Two load paths

| Path | Calls | Step objects you get back |
| --- | --- | --- |
| **Default** | `load()`, `from_json()`, `from_dict(data)` | Legacy `StepDescription` for `llm`, `tool`, `mcp`, `memory`, `transform`, `conditional`, `structured_output`, `command`, `shell_session`. Typed classes for every other step type. |
| **Typed** | `from_dict_typed(data)` = `from_dict(data, use_typed_steps=True)` | The typed class for every step type (`LLMStepDescription`, `ToolStepDescription`, …). |

Both paths load **every** step type that CARL 0.5.0 knows. This was checked by
saving one chain per `StepType` (25 types) and loading it through `from_json`,
`load` and `from_dict_typed`: all loaded, and the typed path reproduced the
original `to_dict()` exactly.

On the default path a legacy-capable step comes back as a `StepDescription`.
It behaves the same at run time. Its `to_dict()` gains the empty LLM fields
(`aim: ""`, `reasoning_questions: ""`, …) that the legacy class always
carries, so a byte-for-byte diff of the JSON shows a change. Use the typed path
when you need typed objects or a stable diff:

```python
import json
from pathlib import Path
from mmar_carl import ReasoningChain

raw = json.loads(Path("chain.json").read_text(encoding="utf-8"))
chain = ReasoningChain.from_dict_typed(ReasoningChain.migrate(raw))
```

`migrate()` lifts dicts written by an older CARL to the current format.
`from_dict()` does not call it for you.

## What round-trips

Chain level: `format_version`, `carl_version`, `max_workers`,
`enable_progress`, `metadata` (Maestro keeps its block under
`metadata["care"]`), `timeout`, `fail_fast`, `replan_policy`,
`search_config`, `default_llm_config`, `trace_name`, `session_id`,
`chain_tools`, `steps`.

Every step: `number`, `title`, `dependencies`, `step_type`, `checkpoint`,
`checkpoint_name`, `replan_enabled`, `triggered_by`, `loop_back_to`,
`loop_config`. LLM steps add `aim`, `reasoning_questions`,
`step_context_queries`, `stage_action`, `example_reasoning`, `llm_config`,
`retry_max`, `timeout`. Other steps add their full `*StepConfig` under
`step_config`.

Collaboration steps keep their sub-agents: `AgentHandoffStepDescription.sub_chain`,
`SupervisorStepDescription.agents` and `ParallelSamplingStepDescription.base_step`
are written as nested chain snapshots and rebuilt on load. Each nested snapshot
carries its own `format_version`, so a sub-agent can be loaded on its own.
`to_dict()` raises `ValueError` when nesting is deeper than 8 levels or a chain
embeds itself. A chain written before format 11 has no topology in its JSON;
it loads with `__placeholder__` stand-ins that the host has to replace.

## What is not serialized

| Field | After a load |
| --- | --- |
| `max_injections` | default `50` |
| `memory_schema` | `None` — pass it again |
| `step_groups` | empty. A group's `llm_config` is merged into its member steps when the chain is built, so the merged per-step config survives. |
| `metrics` (chain and step) | none — re-attach `MetricBase` objects |
| `cache` (`StepCache`) | none — re-attach |
| `prompt_template` | default template |
| Host authority (`CommandPolicy`, `CommandCapabilityRegistry`, `NetworkEnforcer`, `CodeExecutionPolicy`) | never part of chain JSON — the host puts them on `ReasoningContext` |

## Versioning

`to_dict()` stamps:

- `format_version: int` — `ReasoningChain.FORMAT_VERSION`, which is `11` in
  CARL 0.5.0. Each new step type or wire change adds one rung to
  `ReasoningChain.migrate()`.
- `carl_version: str` — informational only.

| Situation | Behaviour |
| --- | --- |
| Older format | `migrate()` walks the ladder; the chain loads. |
| Newer format | `from_dict()` raises `ChainFormatNewerError(required_version, this_version)`. Maestro shows an "upgrade CARL" message. |
| Unknown `step_type` | The whole chain fails to load (`ValueError` on the typed path, a pydantic `ValidationError` on the default path). Nothing is skipped silently. |

:::caution[Chains from Maestro's bundled CARL build]
The CARL build that ships inside the Maestro app (`0.3.0+maestro.contracts.*`)
numbers its formats separately: format 2 there means "chain tools". Its chain
JSON carries `fail_fast` and, for chain tools, `required_tool_revisions`. Moving
JSON between that build and a `FORMAT_VERSION = 11` runtime is not covered by
the migration ladder; check such chains with `maestro validate` before you run
them.
:::

## Result serialization

Results round-trip too. This is what [`RunRecord`](/carl/care-integration/run-record/)
wraps:

```python
result = chain.execute(context)

result.save("result.json")
loaded = ReasoningResult.load("result.json")

d = result.to_dict(full=True)      # full=True keeps every step's detail
ReasoningResult.from_dict(d)
```

`StepExecutionResult.to_dict(truncate=False)` / `from_dict` serialize single
step results; `truncate=True` clips long outputs. `injected_steps` is always
written as `[]`, so steps injected at run time are not persisted.

## See also

- [Migration: legacy → typed steps](/carl/serialization/migration/)
- [ReasoningChain](/carl/chains/overview/) · [RunRecord](/carl/care-integration/run-record/)
- [Changelog](/carl/reference/changelog/)
