---
title: Supervisor
description: An LLM picks one of N named sub-chains and the step runs it.
sidebar:
  order: 2
---

`SupervisorStepDescription` makes one routing LLM call, matches the reply against
the names in `agents`, and runs the chosen sub-chain in an isolated context. The
result is written back to the parent like a [handoff](/carl/orchestration/handoff/).

```python
from mmar_carl import SupervisorStepConfig, SupervisorStepDescription

SupervisorStepDescription(
    number=1,
    title="Route to specialist",
    agents={"pdf": pdf_chain, "search": search_chain, "code": code_chain},
    config=SupervisorStepConfig(
        routing_prompt=(
            "Pick ONE specialist for the task. Reply with just the name.\n"
            "Specialists: {agents}\n\nTask: {task}"
        ),
        fallback_agent="search",
        output_memory_key="specialist_result",
    ),
)
```

`agents` is a required `dict[str, ReasoningChain]`. An empty map fails the step.

## SupervisorStepConfig

| Field | Default | Meaning |
| --- | --- | --- |
| `routing_prompt` | required | Template for the routing call. `{task}` is the resolved task, `{agents}` is a comma-separated list of names. It goes through `str.format`, so write literal braces as `{{` and `}}`. |
| `task_source` | `"$outer_context"` | Where the task text comes from: `$outer_context`, `$memory.ns.key`, `$history[-1]` or a quoted literal. Non-string values are JSON-encoded. |
| `fallback_agent` | `None` | Agent used when the reply matches no name. With `None` an unmatched reply fails the step. |
| `allow_substring_match` | `False` | Enables the third matching tier (see below). |
| `warn_on_ambiguous_route` | `True` | Warn when the reply matches more than one name at the winning tier. |
| `input_mapping` | `{}` | Values copied into the sub-chain's memory. Same rules as in [handoff](/carl/orchestration/handoff/). |
| `output_memory_key` | `""` | Parent memory key for the sub-chain's final output. Empty disables the write. |
| `output_namespace` | `"supervisor"` | Namespace for `output_memory_key`. |
| `propagate_failure` | `True` | When `False`, a failed sub-chain is recorded in `result_data` but the step succeeds. |
| `inherit_tools` | `True` | Copy the parent's tool registry (and tool tags) into the sub-context. |
| `timeout` | `None` | Seconds for the sub-chain run, `> 0`. A timeout fails the step. |
| `llm_config` | `None` | `LLMStepConfig` override for the routing call only. |

## How the reply is matched

The reply is trimmed and lower-cased, then compared with the agent names
(case-insensitive):

1. `exact`: the whole reply is an agent name.
2. `whole_word`: an agent name appears in the reply as a whole word.
3. `substring`: an agent name appears anywhere in the reply. This tier runs only
   with `allow_substring_match=True`, because it mis-routes: an agent named `code`
   matches a reply that mentions "codebase".

If no tier matches, `fallback_agent` is used and a warning is emitted (both
`warnings.warn` and the `mmar_carl` logger). Without a fallback the step fails with
an error that quotes the reply.

If the reply matches several names at the winning tier, the first match wins,
`routing_ambiguous` is `True`, all matches go to `routing_candidates`, and a warning
is emitted unless `warn_on_ambiguous_route=False`.

## What the sub-chain sees

The sub-context gets the parent's `outer_context`, LLM client, language, system
prompt and command policy, an empty history and a deep copy of the parent memory.
Before `input_mapping` is applied, the supervisor writes two keys:

- `$memory.input.task`: the resolved task text;
- `$memory.input.supervisor_agent`: the chosen agent name.

## Result

`step_result.result` is the sub-chain's final output. Read the details through the
typed view:

```python
decision = step_result.as_supervisor_decision()
decision.agent_selected        # "search"
decision.routing_match_tier    # "exact" | "whole_word" | "substring" | "fallback_agent"
decision.routing_ambiguous     # bool
decision.routing_candidates    # list[str]
decision.routing_reply         # raw routing reply
decision.sub_result            # ReasoningResult of the sub-chain
```

Before the sub-chain starts, the step fires the intra-step event
`supervisor.route_selected` with `{"agent_name": ...}` through
`context.on_step_event`.

## Serialization

`to_dict()` writes `agents` as nested chain dicts (format 11) and `from_dict()`
rebuilds them. Chains saved at format 10 or earlier load with an empty `agents`
map that you must fill. Limits are on the
[overview](/carl/orchestration/overview/#serialized-topology).

## See also

- [Handoff](/carl/orchestration/handoff/): delegate to one fixed sub-chain.
- [Supervisor routing example](https://github.com/Glazkoff/carl/blob/main/examples/agents/supervisor_routing_example.py)
  (mock client, no API key).
