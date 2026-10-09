---
title: Handoff
description: Run a complete sub-chain inside the parent run with an isolated context.
sidebar:
  order: 3
---

`AgentHandoffStepDescription` runs a whole sub-chain as one step. The sub-chain
gets its own `ReasoningContext` derived from the parent, its inputs come from
`input_mapping`, and its final output is written back to parent memory.

```python
from mmar_carl import AgentHandoffStepConfig, AgentHandoffStepDescription

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={
            "input.topic": "$memory.input.topic",
            "input.lang": "'english'",
        },
        output_memory_key="research_result",
    ),
)
```

`sub_chain` is a required `ReasoningChain`. If it is `None` at run time the step
fails with an explicit error.

## AgentHandoffStepConfig

| Field | Default | Meaning |
| --- | --- | --- |
| `input_mapping` | `{}` | Keys are `namespace.key` paths in the sub-chain's memory. A key without a dot goes to the `input` namespace. Values are parent references: `$memory.ns.key`, `$history[-1]`, `$outer_context` or a quoted literal. |
| `output_memory_key` | `""` | Parent memory key for the sub-chain's final output. Empty disables the write. Written only when the sub-chain succeeds. |
| `output_namespace` | `"handoff"` | Namespace for `output_memory_key`. |
| `propagate_failure` | `True` | When `False`, a failed sub-chain is recorded but the step succeeds. |
| `inherit_tools` | `True` | Copy the parent's tool registry into the sub-context. |
| `timeout` | `None` | Seconds for the sub-chain run, `> 0`. A timeout fails the step. |

## What the sub-chain sees

The sub-context gets the parent's `outer_context`, LLM client, model, retry
setting, language, system prompt, history limits and command policy. History starts
empty. Memory is a **deep copy** of the parent memory, so writes inside the
sub-chain do not leak back. Only `output_memory_key` is written to the parent.

## Result

- `step_result.result`: the sub-chain's final output (or its last history entry).
- `result_data["sub_result"]`: the full `ReasoningResult` of the sub-chain.
- `result_data["sub_chain_success"]` and `result_data["steps_executed"]`.

There is no typed accessor for handoff; read these keys directly.

## Serialization

`to_dict()` writes `sub_chain` as a complete nested chain dict (format 11), and
`from_dict()` rebuilds the real sub-chain. A chain saved at format 10 or earlier has
no sub-chain in the JSON and loads with a one-step `__placeholder__` sub-chain that
you must replace before running. Depth and cycle limits are on the
[overview](/carl/orchestration/overview/#serialized-topology).

## Handoff, supervisor or chain tool

- **Handoff** runs one fixed sub-chain at a fixed place in the DAG.
- **[Supervisor](/carl/orchestration/supervisor/)** lets an LLM choose among several sub-chains.
- **[Chain tools](/carl/steps/chain-tools/)** expose a chain as a tool that an agent may call or skip.
