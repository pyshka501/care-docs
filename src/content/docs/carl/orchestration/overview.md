---
title: Orchestration Overview
description: Multi-agent patterns — supervisor, debate, handoff, sampling, human-in-the-loop — and the event bus.
sidebar:
  order: 1
---

Beyond single steps, CARL ships step types for **multi-agent** patterns. Each is a
step you drop into a chain.

| Pattern | Step | Use when… |
| --- | --- | --- |
| [Supervisor](/carl/orchestration/supervisor/) | `SupervisorStepDescription` | an LLM should route the task to one of N specialists. |
| [Handoff](/carl/orchestration/handoff/) | `AgentHandoffStepDescription` | you want to delegate to a complete sub-chain. |
| [Debate](/carl/orchestration/debate/) | `DebateStepDescription` | multiple roles should argue, then a judge synthesises. |
| [Parallel sampling](/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` | sample N answers and vote / judge the best (LLM council). |
| [Human-in-the-loop](/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` | a human must approve or supply a value. |

## The event bus

Steps can also coordinate by **events** instead of (or alongside) numeric
`dependencies`. A step emits an event; downstream steps gated on that event become
ready once it fires.

```python
# Producer: emit from a tool / callback during execution
context.emit_event("error_detected", {"code": 503})

# Consumer: a step that waits for the event
LLMStepDescription(
    number=5, title="Handle error",
    aim="React to the detected error.",
    triggered_by=["error_detected"],   # ready only after ALL listed events fire
)
```

Read the most-recent payload with the [`$event.<name>`](/carl/chains/dynamic-references/)
reference. A step with `triggered_by` becomes ready only when **all** its events
have fired **and** its numeric `dependencies` are met — enabling fan-out where many
steps watch the same event.
