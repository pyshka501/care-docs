---
title: Migration — Legacy → Typed Steps
description: Move from the unified StepDescription to typed step classes, lift old chain JSON to format 15, and adopt the 0.5.x host contracts.
sidebar:
  order: 2
---

This page covers three migrations: legacy step objects to typed classes, old
chain JSON to the current format, and code written against the pre-0.4 input
and human-input behaviour, plus the host-side changes of 0.5.0.

## Legacy `StepDescription` → typed classes

The unified `StepDescription` still works for the step types it covers
(`llm`, `tool`, `mcp`, `memory`, `transform`, `conditional`,
`structured_output`, `command`, `shell_session`). New code should use the
[typed step classes](/carl/steps/overview/): every step type has one, and
newer types (`agent`, `code`, `wait`, `map`, `human_input`, the
multi-agent steps, `claude_code`, `codex`, `selection`, `planner`, `decision`,
`terminate`) exist only as typed classes.

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
**drops `retry_max` and `timeout`** on LLM steps (checked on 0.5.2). Set them
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
older CARL rung by rung. `from_dict()` does not call it, so the safe load is:

```python
chain = ReasoningChain.from_dict(ReasoningChain.migrate(raw))
```

| Format | Release | Change |
| --- | --- | --- |
| 6 | 0.4.0 | Removes `HumanInputStepConfig.fallback_value` from saved configs and warns. |
| 9 | 0.4.0 | Adds the top-level `chain_tools` list. |
| 10 | 0.5.0 | Codex step type. |
| 11 | 0.5.0 | Sub-agent topology on collaboration steps. Older chains keep `__placeholder__` sub-agents; reattach them from the original source. |
| 12 | 0.5.0 | `fail_fast`, `max_injections`, `memory_schema` and `step_groups` are saved. A `fail_fast` already present (as in chains from Maestro's CARL build) is kept. |
| 13 | 0.5.0 | Planner step type. |
| 14 | 0.5.1 | Decision step type. |
| 15 | 0.5.2 | Terminate step type. |

Rungs 10, 11 and 13–15 rewrite nothing: they only raise the number, so that an
older reader stops at the chain boundary with `ChainFormatNewerError` instead
of failing on an unknown enum later. `claude_code` and `selection` arrived in
0.5.0 without a rung of their own; any 0.5.0 chain is format 13 anyway.

A dict with a newer `format_version` than the runtime raises
`ChainFormatNewerError`; upgrade `mmar-carl` instead of editing the number.

## Adopting the 0.4.0 contracts

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

## Upgrading a host to 0.5.x

These are the breaking and behavioural changes of 0.5.0. 0.5.1 and 0.5.2 only
add step types; they need no host change unless you use those types.

### Local agents need host approval

`claude_code` and `codex` steps fail unless the trusted host context allows
them. Loading a chain never sets the flag:

```python
context = ReasoningContext(
    outer_context=task,
    api=client,
    allow_local_agent_execution=True,   # only for chains you trust
)
```

`ClaudeCodeStepConfig.env` is no longer written by `to_dict()`. Loading is not
symmetric: a dict that still contains `env` loads it (checked on 0.5.2), so
strip `env` from chain JSON you did not write before you grant the flag.

### Tool failures fail the step

A tool step that calls a [chain tool](/carl/steps/chain-tools/) whose nested
chain did not complete now fails, and so does an MCP call whose result has
`isError: true`. Code that read the error out of a "successful" step must
handle `success=False` instead (or use `fail_fast` to stop the chain).

### Steps own their answer format

The default English and Russian prompt wrappers carry the input, the step's
instructions and the history; they no longer imply a fixed answer format. Put
the required output format into the step (`stage_action`, `aim`, or a
[structured-output](/carl/steps/structured-output/) step), or pass your own
`PromptTemplate` to `ReasoningChain(prompt_template=...)` when all steps share
one style. See the repo's
[workflow guide](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/docs/WORKFLOW_BEST_PRACTICES.md).

### New grants for new steps

A `decision` step (0.5.1) also needs `ReasoningContext.decision_endpoints`; see
[Decision step](/carl/steps/decision/#host-grant-and-credentials).

## See also

- [Steps overview](/carl/steps/overview/)
- [JSON serialization](/carl/serialization/json/)
- [Changelog](/carl/reference/changelog/)
