---
title: Migration — Legacy → Typed Steps
description: Move from the unified StepDescription to typed step classes, lift old chain JSON, and adopt the 0.5.0 input and human-input contracts.
sidebar:
  order: 2
---

This page covers three migrations: legacy step objects to typed classes, old
chain JSON to the current format, and code written against the pre-0.4 input
and human-input behaviour.

## Legacy `StepDescription` → typed classes

The unified `StepDescription` still works for the step types it covers
(`llm`, `tool`, `mcp`, `memory`, `transform`, `conditional`,
`structured_output`, `command`, `shell_session`). New code should use the
[typed step classes](/carl/steps/overview/): every step type has one, and
newer types (`agent`, `code`, `wait`, `map`, `human_input`, the
multi-agent steps, `claude_code`, `codex`) exist only as typed classes.

| Legacy | Typed |
| --- | --- |
| `StepDescription(..., step_type=StepType.LLM)` | `LLMStepDescription(...)` |
| `StepDescription(..., step_type=StepType.TOOL, step_config=ToolStepConfig(...))` | `ToolStepDescription(config=ToolStepConfig(...))` |
| `StepDescription(..., step_type=StepType.MEMORY, step_config=MemoryStepConfig(...))` | `MemoryStepDescription(config=MemoryStepConfig(...))` |

```python
# Before
StepDescription(number=1, title="Analysis", aim="Analyze data",
                reasoning_questions="What patterns exist?", step_type=StepType.LLM)

# After
LLMStepDescription(number=1, title="Analysis", aim="Analyze data",
                   reasoning_questions="What patterns exist?")
```

### Converting objects

`StepDescription.to_typed_step()` converts one object:

```python
legacy = StepDescription(number=1, title="Old", aim="Old step")
typed = legacy.to_typed_step()      # -> LLMStepDescription
```

:::caution
`to_typed_step()` keeps `llm_config`, `checkpoint` and `triggered_by` but
**drops `retry_max` and `timeout`** on LLM steps (checked on 0.5.0). Set them
again on the typed step, or load the JSON through the typed path instead.
:::

### Converting saved chains

Load with the typed path and save again:

```python
import json
from pathlib import Path
from mmar_carl import ReasoningChain

raw = json.loads(Path("chain.json").read_text(encoding="utf-8"))
chain = ReasoningChain.from_dict_typed(ReasoningChain.migrate(raw))
chain.save("chain.json")
```

The default `load()` / `from_json()` also loads every step type, but gives you
legacy objects for the types listed above. See
[JSON serialization](/carl/serialization/json/#two-load-paths).

## Old chain JSON → current format

`ReasoningChain.migrate(data, to_version=None)` lifts a dict written by an
older CARL rung by rung. Notable rungs:

| Format | Change |
| --- | --- |
| 6 | Removes `HumanInputStepConfig.fallback_value` from saved configs and warns. |
| 9 | Adds the top-level `chain_tools` list. |
| 10 | Claude Code and Codex step types. |
| 11 | Sub-agent topology on collaboration steps. Older chains keep `__placeholder__` sub-agents; the host rebuilds them. |

A dict with a newer `format_version` than the runtime raises
`ChainFormatNewerError`; upgrade `mmar-carl` instead of editing the number.

## Adopting the 0.5.0 contracts

### Human input

`fallback_value` is gone, and a missing answer is never a success.

```python
from mmar_carl import HumanInputRequest, HumanInputResponse

async def ask_human(request: HumanInputRequest) -> HumanInputResponse:
    answer = ...   # show request.prompt, collect the answer
    return HumanInputResponse(request_id=request.request_id, value=answer)

context.on_human_input_requested = ask_human
```

The response must echo `request.request_id`; otherwise the step fails. Check
`step_result.as_human_input_outcome().status`; only `answered` is a success. See [human-in-the-loop](/carl/orchestration/human-in-the-loop/).

### Structured host input

If your host used to put JSON into `outer_context` so that steps could read
`$outer_context.<field>`, pass the data as `runtime_input` instead and keep
`outer_context` for the prompt text:

```python
context = ReasoningContext(
    outer_context="Find hotels for the trip",   # what LLM steps read
    runtime_input={"city": "Paris", "nights": 3},
    api=client,
)
# step config: input_mapping={"city": "$outer_context.city"}
```

### Required tool inputs

A required tool parameter that resolves to `None` now fails the step before
the tool runs (`CARL_TOOL_INPUT_UNRESOLVED`). Unquoted literals such as
`input_mapping={"values": "[1, 2]"}` resolve to `None`; write them as JSON
literals (`'"[1, 2]"'`) and declare a typed `ToolParameter`. See
[dynamic references](/carl/chains/dynamic-references/).

## See also

- [Steps overview](/carl/steps/overview/)
- [JSON serialization](/carl/serialization/json/)
- [Changelog](/carl/reference/changelog/)
