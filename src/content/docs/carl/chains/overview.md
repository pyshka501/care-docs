---
title: ReasoningChain
description: Construct, run, and serialize a chain of steps.
sidebar:
  order: 1
---

`ReasoningChain` is the main public API: a list of [steps](/carl/steps/overview/)
plus execution settings. It runs them through the DAG executor and serialises to
JSON for reuse.

## Constructor

```python
ReasoningChain(steps, max_workers=3, ...)
```

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `steps` | `Sequence[StepDescription...]` | — (required) | The steps to run. |
| `max_workers` | `int \| str` | `3` | Parallel worker pool size. `"auto"` sizes it for you. |
| `enable_progress` | `bool` | `False` | Emit progress logging. |
| `search_config` | `ContextSearchConfig \| None` | `None` | Context-extraction strategy (substring / vector). |
| `metrics` | `list[MetricBase]` | `[]` | Chain-level metrics. |
| `timeout` | `float \| None` | `None` | Chain-level timeout in seconds. |
| `replan_policy` | `ReplanPolicy \| None` | `None` | RE-PLAN policy. |
| `default_llm_config` | `LLMStepConfig \| None` | `None` | Default LLM config for all LLM steps. |
| `memory_schema` | `dict \| None` | `None` | Write-time memory validation schema. |
| `metadata` | `dict \| None` | `None` | Arbitrary metadata stored on the chain. |

(Also: `prompt_template`, `trace_name`, `session_id`, `step_groups`, `max_injections`.)

## Running a chain

```python
result = chain.execute(context)             # synchronous
result = await chain.execute_async(context) # async
```

For step-by-step streaming, use [`stream_async`](/carl/async/streaming/). See
[async execution](/carl/async/overview/) for parallelism, callbacks, and timeouts.

## Serialization

Chains round-trip to JSON so you can save and reload them:

```python
chain.save("my_chain.json")              # write to disk
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict();  ReasoningChain.from_dict(d)
s = chain.to_json();  ReasoningChain.from_json(s)
```

`from_dict` runs full validation (cycles, dependency references, reference-syntax
warnings).

## Other chain methods

- `chain.estimate_cost(pricing=...)` — dry-run token/USD projection before running.
- `chain.to_mermaid()` — render the DAG as a Mermaid diagram.
- `chain.reflect(...)` — analyse a completed run.

## Ways to build a chain

- **Directly** — pass a list of typed step descriptions (this page).
- [**`ChainBuilder`**](/carl/chains/builder/) — a fluent builder.
- [**`ChainBuilder.from_description`**](/carl/chains/from-description/) — generate a chain from natural language.
