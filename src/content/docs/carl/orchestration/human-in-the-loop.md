---
title: Human-in-the-Loop
description: Ask a person for one text answer through a typed, in-process provider; every non-answer is an explicit failure.
sidebar:
  order: 6
---

`HumanInputStepDescription` sends one typed text request to a provider that your
host installs on the context, and waits for a typed response. Only a validated
answer counts as success. A missing provider, a timeout, a cancel or an invalid
response each produce an explicit non-success outcome. CARL never invents a
default answer.

The provider runs in the same process as the chain. CARL has no webhook or other
network transport for human input; if the answer comes from elsewhere, your
provider bridges to it.

## Provider contract

```python
from mmar_carl import HumanInputRequest, HumanInputResponse

async def provider(request: HumanInputRequest) -> HumanInputResponse:
    value = await show_in_my_ui(request.prompt)   # your UI, queue or chat bridge
    return HumanInputResponse(
        request_id=request.request_id,   # must echo the request id
        value=value,
        actor_id="user-42",
    )

context.on_human_input_requested = provider
```

- The provider receives a `HumanInputRequest` with `request_id`, `step_number`,
  `step_title`, `kind="text"`, `prompt`, `min_length`, `max_length`, `sensitive`
  and `deadline` (timezone-aware, or `None` without a timeout).
- It returns a `HumanInputResponse` (or a dict that validates as one): `request_id`,
  `value` (at most 65 536 chars), optional `actor_id`, `responded_at` (defaults to
  now, UTC) and `provenance` (JSON, at most 8 KiB).
- A plain function is allowed too, but it must return at once. An async provider
  should own any waiting it needs. CARL owns the provider task, the timeout and
  cleanup on cancel.

## Example

A runnable chain without LLM calls: a person approves or rejects, then a tool acts
on the answer read from memory. The provider here is a stub that always approves.

```python
import asyncio

from mmar_carl import (
    HumanInputRequest,
    HumanInputResponse,
    HumanInputStepConfig,
    HumanInputStepDescription,
    LLMClientBase,
    ReasoningChain,
    ReasoningContext,
    ToolStepConfig,
    ToolStepDescription,
)


class NoLLM(LLMClientBase):
    """The chain below makes no LLM calls; ReasoningContext still wants a client."""

    async def get_response(self, prompt: str) -> str:
        raise RuntimeError("no LLM calls expected")

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


def publish_or_discard(decision: str) -> str:
    return "published" if decision.strip().lower() == "approve" else "discarded"


chain = ReasoningChain(steps=[
    HumanInputStepDescription(
        number=1,
        title="Approve the post",
        config=HumanInputStepConfig(
            prompt="Reply 'approve' to publish, anything else to discard.",
            timeout=300,
            min_length=1,
            max_length=64,
            output_memory_key="decision",
        ),
    ),
    ToolStepDescription(
        number=2,
        title="Publish or discard",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="publish_or_discard",
            input_mapping={"decision": "$memory.human_input.decision"},
        ),
    ),
])


async def provider(request: HumanInputRequest) -> HumanInputResponse:
    # A real host shows request.prompt in its UI and waits for the user.
    print("asked:", request.prompt)
    return HumanInputResponse(
        request_id=request.request_id,  # must echo the request id
        value="approve",
        actor_id="reviewer@example.com",
    )


async def main() -> None:
    context = ReasoningContext(outer_context="Draft post", api=NoLLM())
    context.register_tool("publish_or_discard", publish_or_discard)
    context.on_human_input_requested = provider

    result = await chain.execute_async(context)

    outcome = result.step_results[0].as_human_input_outcome()
    print(outcome.status, outcome.value, outcome.actor_id)  # answered approve reviewer@example.com
    print(result.step_results[1].result)                     # published


asyncio.run(main())
```

The repository has a longer
[human-in-the-loop example](https://github.com/Glazkoff/carl/blob/main/examples/agents/human_in_the_loop_example.py)
(no API key) that also shows a timeout, a missing provider and an explicit fake
human for tests.

## HumanInputStepConfig

Unknown fields are rejected.

| Field | Default | Meaning |
| --- | --- | --- |
| `prompt` | `"Please provide input:"` | Text shown to the person. Stripped; must be non-empty and at most 8192 chars. |
| `prompt_input_mapping` | `{}` | Name → reference (`$memory...`, `$history[...]`, `$outer_context...`). The resolved values are appended to the prompt as a `Context (JSON):` block. |
| `timeout` | `None` | Seconds to wait, `> 0` and finite. `None` waits without limit. |
| `min_length` | `0` | Minimum answer length, `>= 0`. |
| `max_length` | `4096` | Maximum answer length, 1 to 65 536. Must be `>= min_length`. |
| `sensitive` | `False` | Keep the answer out of the step result and history. Requires `output_memory_key`. |
| `output_memory_key` | `None` | Write the answer to `$memory.human_input.<key>`. Stripped, non-empty, at most 256 chars. |

`fallback_value` no longer exists. Passing it raises a validation error. Older
chain JSON that still contains it is cleaned by `ReasoningChain.migrate()`, which
drops the field and warns.

## Outcomes

Read the outcome with `step_result.as_human_input_outcome()`, which returns a
`HumanInputOutcome` (`status`, `request_id`, `elapsed_seconds`, `value`,
`actor_id`, `responded_at`, `provenance`, `redacted`, `error_message`).

| `status` | When | Step |
| --- | --- | --- |
| `answered` | A valid response with the right `request_id` and a length within bounds. | success |
| `unavailable` | `context.on_human_input_requested` is not set. | failed |
| `timed_out` | No response before `timeout`. | failed |
| `cancelled` | The run was cancelled before or during the wait. | failed, `skipped=True` |
| `invalid_response` | The response does not validate, has another `request_id`, or its length is out of bounds. | failed |
| `failed` | The provider raised. | failed |

`answered` is the only success. Nothing is written to memory or history for the
other statuses, so a downstream step can never mistake a timeout for an approval.
For batch jobs and tests, install an explicit fake-human provider.

## Where the answer goes

- `step_result.result`: the answer text.
- History: one entry for the step with the answer (`Human input (answered): <value>`
  when the context language is English).
- Memory: `$memory.human_input.<output_memory_key>` when the key is set.

Branch on it downstream with a [conditional step](/carl/steps/conditional/) or
pass it to a tool, as in the example above.

### Sensitive input

With `sensitive=True` the raw answer is written **only** to
`$memory.human_input.<output_memory_key>`. The step result is `[redacted]`, the
history entry shows `[redacted]`, and the outcome has `redacted=True`, no `value`
and an empty `provenance`. Your application is responsible for protecting and
clearing that memory key.

:::note
`HumanInputStepConfig` is also accepted as `step_config` of a legacy
`StepDescription(step_type=StepType.HUMAN_INPUT, ...)`, so chains in the legacy
step format can contain a human step.
:::

## See also

- [Conditional steps](/carl/steps/conditional/): branch on the answer.
- [Wait step](/carl/steps/wait/): pause until a time or an event instead of a person.
- [Run controls](/carl/chains/run-controls/): cancel a run that waits for input.
