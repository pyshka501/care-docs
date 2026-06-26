---
title: Визуализация
description: Пироги токенов, разбивка стоимости, таблицы профилирования, Mermaid-диаграммы и фасад ChainVisualizer.
sidebar:
  order: 2
---

Объекты результата и цепочки CARL отрисовывают себя сами. По умолчанию всё **текстовое** —
для PNG-вывода установите `pip install 'mmar-carl[viz]'`.

## Из результата

```python
result = chain.execute(context)

print(result.format_token_pie())                 # "text" | "mermaid" | "png"
print(result.format_prompt_completion_breakdown())
print(result.format_profiling_table())           # per-step cost / latency / cache
print(result.format_cost_by_model(pricing={"qwen/qwen3-8b": (0.00002, 0.00006)}))
```

Также полезно: `result.token_usage_by_step`, `result.partial_outputs`,
`result.get_partial_final_output()`.

## Из цепочки

```python
print(chain.to_mermaid())                          # the DAG
print(chain.to_mermaid_critical_path(result))      # highlight the critical path
print(chain.to_mermaid_heatmap(result, metric="tokens"))  # "tokens" | "latency" | "cost"
```

:::note
Mermaid использует `<br/>` (не `\n`) как перенос строки внутри меток узлов — каждый
метод CARL `to_mermaid_*` уже использует `<br/>`.
:::

## ChainVisualizer — компоновка нескольких представлений

`ChainVisualizer` — fluent-фасад, буферизующий несколько представлений в одном выводе:

```python
from mmar_carl import ChainVisualizer

ChainVisualizer(result, chain=chain).token_pie().gantt().heatmap(metric="tokens").print()
```

Также принимает `evolution_result=` для включения графиков эволюции.

## Jupyter

`ReasoningResult`, `EvolutionResult`, `DatasetEvaluationReport`, `CostEstimate`
и `ChainVisualizer` реализуют `_repr_markdown_` — введите объект в ячейку ноутбука
и он отрисует баннер статуса + таблицы + Mermaid без `print()`.

## Смотрите также

- [Трассировка и наблюдаемость](/ru/carl/tracing/overview/)
- [Оценка стоимости](/ru/carl/tracing/cost/)
- [DAG цепочки в MAESTRO CARE](/ru/care/tui/dag/) — TUI рисует тот же DAG прямо во время выполнения цветным графом из блоков и стрелок, а для простых терминалов есть [ASCII-режим](/ru/care/tui/dag/).
