---
title: Generate from a Description
description: Have an LLM plan a chain from a natural-language task.
sidebar:
  order: 3
---

`ChainBuilder.from_description` is a meta-agent: it asks an LLM to **plan** a chain
of LLM / Tool / Memory / Transform / Conditional steps for a task, then parses the
plan through `ReasoningChain.from_dict` so all the usual validation applies (cycle
detection, dependency references, reference-syntax warnings).

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

## Parameters

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `task` | `str` | — (required) | Natural-language description of what the chain should do. |
| `llm_client` | `Any` | — (required) | Async client with `get_response_with_retries(prompt, retries=…)` or `get_response(prompt)`. |
| `available_skills` | `list[str] \| None` | `None` | Skill names surfaced in the planning prompt. |
| `available_tools` | `list[str] \| None` | `None` | Tool names the planner may reference (tool steps must use these). |
| `max_steps` | `int` | `10` | Upper bound on planned steps (raises `ValueError` if exceeded). |
| `max_workers` | `int \| str` | `"auto"` | Worker setting on the resulting chain. |
| `extra_instructions` | `str` | `""` | Free-form text appended to the planning prompt. |
| `max_retries` | `int` | `2` | Self-correction rounds when the produced chain fails validation. |

It's an `async` classmethod — `await` it.

## Provenance

The full planner trail is written into `chain.metadata` for offline diagnosis:
`planner_prompt`, `planner_reply`, and the per-attempt `planner_attempts` log
(including validation errors that triggered a retry).

## See also

- [chain_from_description example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/skills/chain_from_description_example.py) in the repo.
