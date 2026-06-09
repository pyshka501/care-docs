---
title: Debate
description: Round-robin role-based debate with a judge synthesis.
sidebar:
  order: 4
---

`DebateStepDescription` runs a round-robin debate: each **role** argues in turn for
a number of rounds, then a **judge** synthesises a conclusion.

```python
from mmar_carl import DebateStepDescription, DebateStepConfig

DebateStepDescription(
    number=1,
    title="Debate the proposal",
    config=DebateStepConfig(
        roles=["optimist", "skeptic"],
        role_prompts={
            "optimist": "Argue for the proposal's strengths.",
            "skeptic": "Probe the proposal's weaknesses.",
        },
        rounds=2,
        judge_prompt="Weigh both sides and state the strongest conclusion.",
        output_memory_key="verdict",
    ),
)
```

## DebateStepConfig

| Field | Purpose |
| --- | --- |
| `roles` | The debating roles (in turn order). |
| `role_prompts` | Per-role system prompt. |
| `rounds` | How many full round-robins. |
| `task_source` | Reference for the topic (default `$history[-1]`). |
| `judge_prompt` | Prompt the judge uses to synthesise. |
| `output_memory_key` / `output_namespace` | Where the verdict is stored. |
| `llm_config` | Default model for all roles + judge. |
| `role_llm_configs` | Per-role model overrides (use different models per role). |

:::tip
Give each role a different model via `role_llm_configs` for genuinely diverse
viewpoints.
:::

## See also

- [Parallel sampling](/carl/orchestration/parallel-sampling/) — sample many answers and vote.
