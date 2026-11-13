---
title: Terminate Step
description: Return an explicit answer and stop the chain once the current batch settles.
sidebar:
  order: 25
---

`TerminateStepDescription` (`step_type: "terminate"`, new in 0.5.2) ends a
chain early with an explicit answer. Use it on a branch that already has a
complete result, for example a cache hit or an answer that passed validation.
The chain stops after the current batch and returns that answer through
`ReasoningResult.get_final_output()`.

## Example

```python
from mmar_carl import (
    Language, LLMStepDescription, ReasoningChain, ReasoningContext,
    TerminateStepConfig, TerminateStepDescription, ToolStepConfig, ToolStepDescription,
)

def lookup(question):
    return {"answer": "42", "confident": True}

chain = ReasoningChain(steps=[
    ToolStepDescription(
        number=1,
        title="Look up",
        config=ToolStepConfig(tool_name="lookup", input_mapping={"question": "$outer_context"}),
    ),
    TerminateStepDescription(
        number=2,
        title="Return the cached answer",
        dependencies=[1],
        config=TerminateStepConfig(output_source="$steps.1.result_data", reason="Cache hit"),
    ),
    LLMStepDescription(number=3, title="Think harder", aim="Work the answer out.", dependencies=[2]),
])

context = ReasoningContext(outer_context="What is six times seven?", api=client,
                           language=Language.ENGLISH)
context.register_tool("lookup", lookup)

result = chain.execute(context)
result.get_final_output()      # '{"answer": "42", "confident": true}'
result.metadata["terminated"]  # {'step_number': 2, 'reason': 'Cache hit'}
# step 3 is reported with skipped=True and never calls the model
```

In practice the terminate step sits behind a
[conditional](/carl/steps/conditional/) branch, so it runs only when the early
answer is good enough.

## TerminateStepConfig

The model rejects unknown fields. Supply **exactly one** of `output` and
`output_source`.

| Field | Type | Default | Purpose |
| --- | --- | --- | --- |
| `output` | JSON value | — | A literal answer. `null` counts when you pass it explicitly. |
| `output_source` | `str \| None` | `None` | A `$` [reference](/carl/chains/dynamic-references/) to the answer. A reference that does not resolve fails the step. |
| `reason` | `str` | `""` | Why the chain stopped. Recorded in the result and the trace. |

Strings are returned as text; other JSON values are rendered as JSON.

## What happens to the rest of the chain

- The current batch settles first. Siblings in the same batch still run,
  including ones that were waiting for a worker slot, and may still have side
  effects. If a side-effectful step must never run once an early answer
  exists, make it depend on the other branch.
- When several terminate steps in one batch succeed, the lowest step number
  selects the output.
- Every later step is reported as skipped. The batch schedules no new planner
  actions, loop iterations or RE-PLAN work.
- Failures that already happened still count against the chain verdict. Host
  cancellation and [fail-fast](/carl/chains/run-controls/#fail-fast) take
  priority over termination.
- `result.metadata["terminated"]` and the trace metadata carry the step number
  and the reason. `get_final_output()` returns the selected answer even when
  the history was trimmed.

## Resume

A snapshot that already executed a terminate step cannot resume past it.
In-process pause and resume before termination work as usual.

## Serialization

Chain format 15 introduced the step type; older formats migrate without
changes to existing steps. Every chain that 0.5.2 saves carries format 15, so
readers older than 0.5.2 reject it with `ChainFormatNewerError`, with or
without a terminate step.

## See also

- [Conditional step](/carl/steps/conditional/) · [Run controls](/carl/chains/run-controls/)
- [Decision step](/carl/steps/decision/): decide whether the early answer is good enough.
