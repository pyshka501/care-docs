---
title: ReasoningChain
description: Construct, run, check and serialize a chain of steps.
sidebar:
  order: 1
---

`ReasoningChain` is the main public API: a list of [steps](/carl/steps/overview/)
plus execution settings. It runs them through the DAG executor and serializes to
JSON for reuse.

## Constructor

```python
ReasoningChain(steps, max_workers=3, ...)
```

| Parameter | Type | Default | Purpose |
| --- | --- | --- | --- |
| `steps` | `Sequence[...]` | required | The steps to run (typed classes or legacy `StepDescription`). |
| `max_workers` | `int \| str` | `3` | Parallel worker pool size. `"auto"` sizes it for you. |
| `fail_fast` | `bool` | `False` | Stop scheduling new steps after the first final failure. See [run controls](/carl/chains/run-controls/). |
| `timeout` | `float \| None` | `None` | Chain-level timeout in seconds (active time, pauses excluded). |
| `enable_progress` | `bool` | `False` | Progress logging. |
| `search_config` | `ContextSearchConfig \| None` | `None` | Context extraction strategy (substring or vector). |
| `metrics` | `list[MetricBase] \| None` | `None` | Chain-level metrics. |
| `replan_policy` | `ReplanPolicy \| None` | `None` | RE-PLAN policy. |
| `default_llm_config` | `LLMStepConfig \| None` | `None` | Default LLM config for LLM steps. |
| `memory_schema` | `dict \| None` | `None` | Write-time memory validation schema. |
| `chain_tools` | `list[ChainToolDefinition] \| None` | `None` | Chains exposed as tools. See [chain tools](/carl/steps/chain-tools/). |
| `metadata` | `dict \| None` | `None` | Free-form metadata stored on the chain. |
| `prompt_template` | `PromptTemplate \| None` | `None` | Custom prompt template. |
| `trace_name`, `session_id` | `str \| None` | `None` | Tracing identifiers. |
| `step_groups` | `Sequence[StepGroup] \| None` | `None` | Named step groups. |
| `max_injections` | `int` | `50` | Upper bound on steps injected at run time. |

The constructor validates the graph: duplicate numbers, unknown dependencies,
cycles (except declared loops) and chain tool boundaries raise `ValueError`.

## Running a chain

```python
result = chain.execute(context)             # synchronous
result = await chain.execute_async(context) # async
async for item in chain.stream_async(context):
    ...   # each StepExecutionResult as it finishes, then the ReasoningResult
```

`execute` and `execute_async` return a `ReasoningResult`: `success`,
`get_final_output()`, `step_results`, token usage, `metadata` and an execution
trace. See [async execution](/carl/async/overview/) and
[streaming](/carl/async/streaming/).

A failed step does not raise; it gives `success=False` on its
`StepExecutionResult` and on the chain result. Cancellation and the chain
timeout do raise. See [run controls](/carl/chains/run-controls/).

## Check before running

```python
report = chain.preflight(context)
if not report.all_present:
    print(report.format_text())
```

`preflight` compares what the chain needs with what the context provides: tools,
MCP servers, skills, code profiles, Claude Code CLIs and the Codex runtime. See
[preflight](/carl/care-integration/preflight/).

Other dry-run helpers:

- `chain.required_tools()`: tool names the steps reference.
- `chain.estimate_cost(pricing=...)`: token/USD projection before running. Agent
  steps that run outside CARL (`claude_code`, `codex`) are not modelled.
- `chain.to_mermaid()`: the DAG as a Mermaid diagram.

## Serialization

```python
chain.save("my_chain.json")
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict()
typed = ReasoningChain.from_dict_typed(d)   # typed step classes
legacy = ReasoningChain.from_dict(d)        # legacy StepDescription where possible
s = chain.to_json();  ReasoningChain.from_json(s)
```

- Every dict carries `format_version` (currently `11`) and `carl_version`.
  A newer `format_version` than the library knows raises `ChainFormatNewerError`.
  Older dicts are lifted with `ReasoningChain.migrate(raw)`.
- `from_dict`, `from_json` and `load` build legacy `StepDescription` objects for
  the classic step types; use `from_dict_typed` to get typed classes everywhere.
- `fail_fast`, `chain_tools`, loops (`loop_back_to`, `loop_config`),
  `triggered_by`, and collaboration topology (`sub_chain`, `agents`, `base_step`)
  round-trip.
- Not serialized: `metrics` and `cache` on steps, `memory_schema`, `step_groups`,
  `max_injections`, and all host authority (tools, policies, providers,
  enforcers). Re-attach them after loading.

Details: [JSON format](/carl/serialization/json/) and
[migration](/carl/serialization/migration/).

## Other chain methods

- `chain.reflect(...)`: analyse a completed run.

## Ways to build a chain

- **Directly**: pass a list of typed step descriptions (this page).
- [**`ChainBuilder`**](/carl/chains/builder/): a fluent builder.
- [**`ChainBuilder.from_description`**](/carl/chains/from-description/): generate a chain from natural language.
