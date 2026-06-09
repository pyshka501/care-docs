---
title: Supervisor
description: Let an LLM route a task to one of N specialist sub-chains.
sidebar:
  order: 2
---

`SupervisorStepDescription` asks an LLM to pick **one** specialist for the task,
then runs that specialist's sub-chain. Specialists are registered by name in the
runtime-only `agents` field.

```python
from mmar_carl import SupervisorStepDescription, SupervisorStepConfig

SupervisorStepDescription(
    number=1,
    title="Route to specialist",
    agents={"pdf": pdf_chain, "search": search_chain, "code": code_chain},
    config=SupervisorStepConfig(
        routing_prompt=(
            "Pick ONE specialist for the task. Reply with just the name.\n"
            "Specialists: {agents}\n\nTask: {task}"
        ),
        output_memory_key="specialist_result",
    ),
)
```

The `routing_prompt` can use `{agents}` (the available names) and `{task}`
placeholders.

## SupervisorStepConfig

| Field | Purpose |
| --- | --- |
| `routing_prompt` | Prompt the LLM uses to choose a specialist. |
| `task_source` | Reference for the task text (default `$history[-1]`). |
| `fallback_agent` | Agent name to use if routing fails. |
| `input_mapping` | Inputs passed into the chosen sub-chain. |
| `output_memory_key` / `output_namespace` | Where the result is stored. |
| `propagate_failure` | Whether sub-chain failure fails this step. |
| `inherit_tools` | Share the parent's registered tools with the sub-chain. |
| `llm_config` | Per-step model override for the routing call. |

:::note
`agents` is runtime-only (not serialized) — keyed by the names the router chooses from.
:::

## See also

- [Handoff](/carl/orchestration/handoff/) — delegate to a single fixed sub-chain.
- [Supervisor routing example](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) in the repo.
