---
title: Visualization
description: Token pies, cost breakdowns, profiling tables, Mermaid diagrams, and the ChainVisualizer facade.
sidebar:
  order: 2
---

CARL's result and chain objects render themselves. Everything is **text by
default** — opt into PNG output with `pip install 'mmar-carl[viz]'`.

## From a result

```python
result = chain.execute(context)

print(result.format_token_pie())                 # "text" | "mermaid" | "png"
print(result.format_prompt_completion_breakdown())
print(result.format_profiling_table())           # per-step cost / latency / cache
print(result.format_cost_by_model(pricing={"qwen/qwen3-8b": (0.00002, 0.00006)}))
```

Also handy: `result.token_usage_by_step`, `result.partial_outputs`,
`result.get_partial_final_output()`.

## From a chain

```python
print(chain.to_mermaid())                          # the DAG
print(chain.to_mermaid_critical_path(result))      # highlight the critical path
print(chain.to_mermaid_heatmap(result, metric="tokens"))  # "tokens" | "latency" | "cost"
```

:::note
Line breaks inside node labels differ: `to_mermaid_heatmap` uses `<br/>`,
while `to_mermaid` and `to_mermaid_critical_path` write a literal `\n`.
Some Mermaid renderers show `\n` as text.
:::

## ChainVisualizer — compose many views

`ChainVisualizer` is a fluent facade that buffers several views into one output:

```python
from mmar_carl import ChainVisualizer

ChainVisualizer(result, chain=chain).token_pie().gantt().heatmap(metric="tokens").print()
```

Views: `token_pie`, `prompt_completion`, `profiling_table`, `gantt`, `dag`,
`critical_path`, `heatmap`, `score_evolution`, `spend_vs_quality`. Finish with
`print()` or `render()`; `view_titles` lists what is buffered and `clear()`
empties it. Pass `evolution_result=` to use the evolution views.

## Jupyter

`ReasoningResult`, `EvolutionResult`, `DatasetEvaluationReport`, `CostEstimate`,
and `ChainVisualizer` all implement `_repr_markdown_` — type the object bare in a
notebook cell and it renders a status banner + tables + Mermaid, no `print()`.

## See also

- [Tracing & observability](/carl/tracing/overview/)
- [Cost estimation](/carl/tracing/cost/)
- [The chain DAG in the TUI](/care/tui/dag/) — the same DAG rendered live in the terminal.
