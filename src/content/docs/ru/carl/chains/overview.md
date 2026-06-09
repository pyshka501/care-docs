---
title: ReasoningChain
description: Построение, запуск и сериализация цепочки шагов.
sidebar:
  order: 1
---

`ReasoningChain` — основной публичный API: список [шагов](/ru/carl/steps/overview/)
плюс настройки исполнения. Он прогоняет шаги через DAG-исполнитель и сериализуется в
JSON для повторного использования.

## Конструктор

```python
ReasoningChain(steps, max_workers=3, ...)
```

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `steps` | `Sequence[StepDescription...]` | — (обязательное) | Шаги для выполнения. |
| `max_workers` | `int \| str` | `3` | Размер пула параллельных воркеров. `"auto"` подбирает оптимальное значение. |
| `enable_progress` | `bool` | `False` | Включить логирование прогресса. |
| `search_config` | `ContextSearchConfig \| None` | `None` | Стратегия извлечения контекста (substring / vector). |
| `metrics` | `list[MetricBase]` | `[]` | Метрики на уровне цепочки. |
| `timeout` | `float \| None` | `None` | Таймаут цепочки в секундах. |
| `replan_policy` | `ReplanPolicy \| None` | `None` | Политика RE-PLAN. |
| `default_llm_config` | `LLMStepConfig \| None` | `None` | Конфигурация LLM по умолчанию для всех LLM-шагов. |
| `memory_schema` | `dict \| None` | `None` | Схема проверки записей в память. |
| `metadata` | `dict \| None` | `None` | Произвольные метаданные, сохранённые в цепочке. |

(Также: `prompt_template`, `trace_name`, `session_id`, `step_groups`, `max_injections`.)

## Запуск цепочки

```python
result = chain.execute(context)             # synchronous
result = await chain.execute_async(context) # async
```

Для пошагового стриминга используйте [`stream_async`](/ru/carl/async/streaming/). Подробнее
об асинхронном выполнении — см. [async execution](/ru/carl/async/overview/).

## Сериализация

Цепочки сохраняются в JSON и загружаются обратно:

```python
chain.save("my_chain.json")              # write to disk
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict();  ReasoningChain.from_dict(d)
s = chain.to_json();  ReasoningChain.from_json(s)
```

`from_dict` выполняет полную валидацию (циклы, ссылки на зависимости, предупреждения о
синтаксисе ссылок).

## Другие методы цепочки

- `chain.estimate_cost(pricing=...)` — предварительный расчёт токенов/USD без запуска.
- `chain.to_mermaid()` — отрисовка DAG в виде Mermaid-диаграммы.
- `chain.reflect(...)` — анализ завершённого запуска.

## Способы построения цепочки

- **Напрямую** — передать список типизированных описаний шагов (эта страница).
- [**`ChainBuilder`**](/ru/carl/chains/builder/) — fluent-построитель.
- [**`ChainBuilder.from_description`**](/ru/carl/chains/from-description/) — генерация цепочки из текста на естественном языке.
