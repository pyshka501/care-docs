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
Mermaid renders `<br/>` (not `\n`) as a line break inside node labels — every
CARL `to_mermaid_*` method already uses `<br/>`.
:::

## ChainVisualizer — compose many views

`ChainVisualizer` is a fluent facade that buffers several views into one output:

```python
from mmar_carl import ChainVisualizer

ChainVisualizer(result, chain=chain).token_pie().gantt().heatmap(metric="tokens").print()
```

It also accepts `evolution_result=` to fold in evolution charts.

## Jupyter

`ReasoningResult`, `EvolutionResult`, `DatasetEvaluationReport`, `CostEstimate`,
and `ChainVisualizer` all implement `_repr_markdown_` — type the object bare in a
notebook cell and it renders a status banner + tables + Mermaid, no `print()`.

## See also

- [Tracing & observability](/carl/tracing/overview/)
- [Cost estimation](/carl/tracing/cost/)
- [The chain DAG in MAESTRO CARE](/care/tui/dag/) — the TUI renders this same DAG live as a coloured box-and-arrow graph, with an [ASCII glyph mode](/care/tui/dag/) for plain terminals.
