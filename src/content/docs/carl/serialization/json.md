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

Both paths load **every** step type that CARL 0.5.2 knows. This was checked by
building one minimal chain per `StepType` with `auto_generate_minimal_step` and
loading it through `from_json` and `from_dict_typed`: all 28 single-step
fixtures loaded, and the typed path reproduced the original `to_dict()`
exactly. (The 29th type, `evaluation`, needs a second step to evaluate, so it
has no single-step fixture; CARL's own round-trip tests cover it.)

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
`metadata["care"]`), `timeout`, `fail_fast`, `max_injections`,
`memory_schema`, `step_groups`, `replan_policy`, `search_config`,
`default_llm_config`, `trace_name`, `session_id`, `chain_tools`, `steps`.
`max_injections`, `memory_schema` and `step_groups` round-trip since format 12
(CARL 0.5.0).

Every step: `number`, `title`, `dependencies`, `step_type`, `checkpoint`,
`checkpoint_name`, `replan_enabled`, `triggered_by`, `loop_back_to`,
`loop_config`, `frozen`. Step-level `metadata` is not written. LLM steps add `aim`, `reasoning_questions`,
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
| `metrics` (chain and step) | none — re-attach `MetricBase` objects |
| `cache` (`StepCache`) | none — re-attach |
| `prompt_template` | default template |
| Host authority (`CommandPolicy`, `CommandCapabilityRegistry`, `NetworkEnforcer`, `CodeExecutionPolicy`, `allow_local_agent_execution`, `decision_endpoints`, `allow_code_tools`) | never part of chain JSON — the host puts them on `ReasoningContext` |
| `ClaudeCodeStepConfig.env` | not written since 0.5.0; a host sets it on trusted steps. A dict that still has `env` loads it. |

## Versioning

`to_dict()` stamps:

- `format_version: int` — `ReasoningChain.FORMAT_VERSION`: `13` in CARL 0.5.0,
  `14` in 0.5.1, `15` in 0.5.2. Each new step type or wire change adds one rung
  to `ReasoningChain.migrate()`.
- `carl_version: str` — informational only.

| Situation | Behaviour |
| --- | --- |
| Older format | `migrate()` walks the ladder; the chain loads. |
| Newer format | `from_dict()` raises `ChainFormatNewerError(required_version, this_version)`. A host can catch it and ask the user to upgrade `mmar-carl`. |
| Unknown `step_type` | The whole chain fails to load (`ValueError` on the typed path, a pydantic `ValidationError` on the default path). Nothing is skipped silently. |

:::caution[Chains from Maestro's bundled CARL build]
The Maestro app does not run a 0.5.x release yet. It pins
`mmar-carl 0.3.0+maestro.contracts.3`, whose `FORMAT_VERSION` is `1`
(see [Maestro integration](/carl/care-integration/overview/#which-carl-maestro-runs)).

- A chain saved by Maestro (format 1, often with `fail_fast`) loads in 0.5.2:
  `migrate()` walks it up to 15 and keeps the saved `fail_fast`.
- A chain saved by 0.5.2 (format 15) is rejected by Maestro's build with
  `ChainFormatNewerError`, even when it only uses step types that build knows.
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
