---
title: Handoff
description: Delegate to a complete sub-chain with isolated context.
sidebar:
  order: 3
---

`AgentHandoffStepDescription` runs a complete sub-chain inside the parent run. The
sub-chain gets an isolated `ReasoningContext` derived from the parent, with inputs
resolved from parent memory/history; its result is merged back via
`output_memory_key`.

```python
from mmar_carl import AgentHandoffStepDescription, AgentHandoffStepConfig

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={"input.topic": "$memory.input.topic"},
        output_memory_key="research_result",
    ),
)
```

## AgentHandoffStepConfig

| Field | Default | Purpose |
| --- | --- | --- |
| `input_mapping` | `{}` | Map sub-chain memory keys ← parent references. |
| `output_memory_key` | — | Where the sub-chain's final output is stored. |
| `output_namespace` | — | Namespace for the output. |
| `propagate_failure` | `True` | Whether sub-chain failure fails this step. |
| `inherit_tools` | — | Share the parent's tools with the sub-chain. |
| `timeout` | `None` | Sub-chain timeout. |

The sub-chain's full `ReasoningResult` is always available at
`step_result.result_data["sub_result"]`. `sub_chain` is runtime-only (not serialized).

## Supervisor vs handoff

- **Handoff** — delegate to one **fixed** sub-chain.
- **[Supervisor](/carl/orchestration/supervisor/)** — let an LLM **choose** among several.
