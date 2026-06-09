---
title: Human-in-the-Loop
description: Pause a chain for human input — approval, a value, or a correction.
sidebar:
  order: 6
---

`HumanInputStepDescription` pauses execution and waits for a human to supply a
value — useful for approvals, missing inputs, or corrections. The input is provided
by a handler you wire in (an in-process callable, or a webhook for out-of-process
flows).

```python
from mmar_carl import HumanInputStepDescription, HumanInputStepConfig

HumanInputStepDescription(
    number=2,
    title="Approve the plan",
    config=HumanInputStepConfig(
        prompt="Approve this plan? Reply 'yes' to continue.",
        timeout=300.0,
        fallback_value="no",
        output_memory_key="approval",
    ),
)
```

## HumanInputStepConfig

| Field | Purpose |
| --- | --- |
| `prompt` | What the human is asked. |
| `timeout` | Seconds to wait before falling back. |
| `fallback_value` | Value used if the human doesn't respond in time. |
| `output_memory_key` | Where the response is stored (read it later with `$memory.*`). |

The collected value flows into the rest of the chain like any other step output —
gate downstream branches on it with a [conditional step](/carl/steps/conditional/).

## See also

- [Human-in-the-loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) in the repo — shows wiring the input handler.
- [Conditional steps](/carl/steps/conditional/) — branch on the human's answer.
