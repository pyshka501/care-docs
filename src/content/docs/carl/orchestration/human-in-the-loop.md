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
The response is written to memory under the `human_input` namespace, so read it
downstream with `$memory.human_input.<output_memory_key>`.

## Wiring the input handler

Set `context.on_human_input_requested` to an async callable
`(prompt: str, future: asyncio.Future) -> None`. It receives the prompt and
resolves the future with the human's answer; if it never resolves, the step falls
back after `timeout`.

```python
async def human_approver(prompt: str, future: asyncio.Future) -> None:
    answer = await collect_from_ui(prompt)   # your UI / queue / webhook bridge
    if not future.done():
        future.set_result(answer)

context.on_human_input_requested = human_approver
```

If **no** callback is registered, the step uses `fallback_value` immediately —
which keeps chains containing a human step fully runnable in batch/test contexts.

## Example

The repo's [human-in-the-loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py)
(no API key) shows an approval gate: a tool drafts a post, a human step collects
the decision, and a final tool publishes or discards based on it.

```python
ReasoningChain(steps=[
    ToolStepDescription(number=1, title="Draft Blog Post",
        config=ToolStepConfig(tool_name="draft_post", input_mapping={"topic": "$memory.input.topic"})),
    HumanInputStepDescription(number=2, title="Human Approval", dependencies=[1],
        config=HumanInputStepConfig(prompt="Approve to publish?", timeout=10.0,
                                    fallback_value="approve", output_memory_key="decision")),
    ToolStepDescription(number=3, title="Publish or Discard", dependencies=[2],
        config=ToolStepConfig(tool_name="route_decision", input_mapping={
            "draft": "$history[0]",                       # tool result → history
            "decision": "$memory.human_input.decision",   # human answer → memory
        })),
])
```

When the timeout fires before a human responds, the step uses the fallback and
records `result_data["timed_out"] = True`. The example also covers a revision
feedback loop and the no-callback batch mode.

## See also

- [Human-in-the-loop example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) in the repo — shows wiring the input handler.
- [Conditional steps](/carl/steps/conditional/) — branch on the human's answer.
