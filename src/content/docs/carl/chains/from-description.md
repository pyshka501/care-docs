---
title: Generate from a Description
description: Have an LLM plan a chain from a natural-language task.
sidebar:
  order: 3
---

`ChainBuilder.from_description` asks an LLM to **plan** a chain for a task, then
parses the plan through `ReasoningChain.from_dict`, so the usual validation
applies (cycle detection, dependency references, reference-syntax warnings).

```python
from mmar_carl import ChainBuilder

chain = await ChainBuilder.from_description(
    task="Outline the key arguments in the text, then condense them to 3 bullets.",
    llm_client=client,
    max_steps=4,
    max_retries=2,                       # self-correct on validation errors
    available_tools=["fetch", "summarise"],
)
```

It is an `async` classmethod.

## What the planner can produce

The planning prompt offers four step types: `llm`, `tool`, `memory` and
`transform`. When you pass `available_skills`, it also allows `agent_skill` steps
with those names. Other step types (agents, code, commands, orchestration) are
not planned by this helper. For full chain generation with those, Maestro uses
its own generator.

## Parameters

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `task` | `str` | required | What the chain should do. |
| `llm_client` | `Any` | required | An `LLMClientBase`, or any object with async `get_response_with_retries(prompt, retries=…)` or `get_response(prompt)`. |
| `available_skills` | `list[str] \| None` | `None` | Skill names the planner may use in `agent_skill` steps. |
| `available_tools` | `list[str] \| None` | `None` | Tool names the planner is told to use in `tool` steps. |
| `max_steps` | `int` | `10` | Upper bound on planned steps (`ValueError` if exceeded). |
| `max_workers` | `int \| str` | `"auto"` | Worker setting on the resulting chain. |
| `extra_instructions` | `str` | `""` | Free text appended to the planning prompt. |
| `max_retries` | `int` | `2` | Self-correction rounds when the plan fails to parse or validate. |

:::caution
`available_tools` is guidance in the prompt, not a check. A plan that names an
unknown tool is accepted. Run `chain.preflight(context)` before executing a
generated chain to catch missing tools.
:::

The reply may be wrapped in a ```` ```json ```` fence; it is stripped.

## Provenance

The planner trail is written into `chain.metadata` for offline diagnosis:
`planner_prompt` and `planner_reply` (both truncated), `planner_attempts` (one
entry per attempt with its prompt, reply and validation error), and
`generated_from_description`.

## See also

- [chain_from_description example](https://github.com/Glazkoff/carl/blob/main/examples/skills/chain_from_description_example.py) in the repo.
- [ChainBuilder](/carl/chains/builder/) · [Preflight](/carl/care-integration/preflight/)
