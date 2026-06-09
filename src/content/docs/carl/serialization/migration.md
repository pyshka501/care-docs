---
title: Migration — Legacy → Typed Steps
description: Move from the unified StepDescription to typed step classes.
sidebar:
  order: 2
---

The legacy unified `StepDescription` class still works, but new code should use the
[typed step classes](/carl/steps/overview/) — they give you type checking, clearer
intent, and get new features first.

## Convert in place

Every legacy `StepDescription` has `to_typed_step()`:

```python
legacy = StepDescription(number=1, title="Old", aim="Old step")
typed = legacy.to_typed_step()      # → LLMStepDescription
```

Loading also converts for you: `ReasoningChain.from_dict(data, use_typed_steps=True)`
(or `from_dict_typed(data)`) rebuilds typed classes.

## By hand

| Legacy | Typed |
| --- | --- |
| `StepDescription(..., step_type=StepType.LLM)` | `LLMStepDescription(...)` (no `step_type` needed). |
| `StepDescription(..., step_type=StepType.TOOL, step_config=ToolStepConfig(...))` | `ToolStepDescription(config=ToolStepConfig(...))`. |
| `StepDescription(..., step_type=StepType.MEMORY, step_config=MemoryStepConfig(...))` | `MemoryStepDescription(config=MemoryStepConfig(...))`. |

```python
# Before
StepDescription(number=1, title="Analysis", aim="Analyze data",
                reasoning_questions="What patterns exist?", step_type=StepType.LLM)

# After
LLMStepDescription(number=1, title="Analysis", aim="Analyze data",
                   reasoning_questions="What patterns exist?")
```

## Why migrate

- **Type safety** — IDE autocomplete + type checking.
- **Clear intent** — the class name *is* the step type.
- **Better validation** — clearer errors for missing fields.
- **Future-proof** — new features land on typed classes first.

## See also

- [Steps overview](/carl/steps/overview/) — the typed classes.
- [JSON serialization](/carl/serialization/json/)
