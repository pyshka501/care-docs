---
title: ReasoningChain
description: Создание, запуск, проверка и сериализация цепочки шагов.
sidebar:
  order: 1
---

`ReasoningChain` — основной публичный API: список [шагов](/ru/carl/steps/overview/)
и настройки исполнения. Цепочка выполняется через DAG-исполнитель и
сериализуется в JSON для повторного использования.

## Конструктор

```python
ReasoningChain(steps, max_workers=3, ...)
```

| Параметр | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `steps` | `Sequence[...]` | обязателен | Шаги (типизированные классы или legacy `StepDescription`). |
| `max_workers` | `int \| str` | `3` | Размер пула параллельных воркеров. `"auto"` подбирает его сам. |
| `fail_fast` | `bool` | `False` | Не запускать новые шаги после первого окончательного сбоя. См. [управление запуском](/ru/carl/chains/run-controls/). |
| `timeout` | `float \| None` | `None` | Таймаут цепочки в секундах (активное время, паузы не считаются). |
| `enable_progress` | `bool` | `False` | Логирование прогресса. |
| `search_config` | `ContextSearchConfig \| None` | `None` | Стратегия извлечения контекста (подстрока или вектор). |
| `metrics` | `list[MetricBase] \| None` | `None` | Метрики уровня цепочки. |
| `replan_policy` | `ReplanPolicy \| None` | `None` | Политика RE-PLAN. |
| `default_llm_config` | `LLMStepConfig \| None` | `None` | LLM-настройки по умолчанию для LLM-шагов. |
| `memory_schema` | `dict \| None` | `None` | Схема проверки записей в память. |
| `chain_tools` | `list[ChainToolDefinition] \| None` | `None` | Цепочки, доступные как инструменты. См. [цепочки-инструменты](/ru/carl/steps/chain-tools/). |
| `metadata` | `dict \| None` | `None` | Произвольные метаданные цепочки. |
| `prompt_template` | `PromptTemplate \| None` | `None` | Свой шаблон промпта. |
| `trace_name`, `session_id` | `str \| None` | `None` | Идентификаторы трассировки. |
| `step_groups` | `Sequence[StepGroup] \| None` | `None` | Именованные группы шагов. |
| `max_injections` | `int` | `50` | Предел числа шагов, вставленных во время запуска. |

Конструктор проверяет граф. Повторяющиеся номера, несуществующие зависимости,
циклы (кроме объявленных циклов-loop) и нарушение границ цепочек-инструментов
дают `ValueError`.

## Запуск цепочки

```python
result = chain.execute(context)             # synchronous
result = await chain.execute_async(context) # async
async for item in chain.stream_async(context):
    ...   # each StepExecutionResult as it finishes, then the ReasoningResult
```

`execute` и `execute_async` возвращают `ReasoningResult`: `success`,
`get_final_output()`, `step_results`, расход токенов, `metadata` и трассу
исполнения. См. [асинхронное исполнение](/ru/carl/async/overview/) и
[стриминг](/ru/carl/async/streaming/).

Упавший шаг не бросает исключение. Он даёт `success=False` в своём
`StepExecutionResult` и в результате цепочки. Отмена и таймаут цепочки
исключение бросают. См. [управление запуском](/ru/carl/chains/run-controls/).

## Проверка перед запуском

```python
report = chain.preflight(context)
if not report.all_present:
    print(report.format_text())
```

`preflight` сравнивает, что нужно цепочке и что есть в контексте: инструменты,
MCP-серверы, навыки, профили кода, CLI Claude Code и рантайм Codex. См.
[preflight](/ru/carl/care-integration/preflight/).

Другие помощники без запуска:

- `chain.required_tools()`: имена инструментов, на которые ссылаются шаги.
- `chain.estimate_cost(pricing=...)`: прогноз токенов и долларов до запуска.
  Агентные шаги, которые работают вне CARL (`claude_code`, `codex`), не
  моделируются.
- `chain.to_mermaid()`: DAG в виде диаграммы Mermaid.

## Сериализация

```python
chain.save("my_chain.json")
loaded = ReasoningChain.load("my_chain.json")

d = chain.to_dict()
typed = ReasoningChain.from_dict_typed(d)   # typed step classes
legacy = ReasoningChain.from_dict(d)        # legacy StepDescription where possible
s = chain.to_json();  ReasoningChain.from_json(s)
```

- В каждом dict есть `format_version` (сейчас `11`) и `carl_version`. Если
  `format_version` новее, чем знает библиотека, будет `ChainFormatNewerError`.
  Старые dict поднимаются через `ReasoningChain.migrate(raw)`.
- `from_dict`, `from_json` и `load` для классических типов шагов строят legacy
  `StepDescription`. Чтобы везде получить типизированные классы, используйте
  `from_dict_typed`.
- Сохраняются и читаются обратно: `fail_fast`, `chain_tools`, циклы
  (`loop_back_to`, `loop_config`), `triggered_by` и топология коллабораций
  (`sub_chain`, `agents`, `base_step`).
- Не сериализуются: `metrics` и `cache` у шагов, `memory_schema`,
  `step_groups`, `max_injections` и все полномочия хоста (инструменты,
  политики, обработчики, enforcer'ы). После загрузки их нужно подключить заново.

Подробнее: [формат JSON](/ru/carl/serialization/json/) и
[миграция](/ru/carl/serialization/migration/).

## Другие методы цепочки

- `chain.reflect(...)`: разбор завершённого запуска.

## Как собрать цепочку

- **Напрямую**: передать список типизированных шагов (эта страница).
- [**`ChainBuilder`**](/ru/carl/chains/builder/): fluent-сборщик.
- [**`ChainBuilder.from_description`**](/ru/carl/chains/from-description/): генерация цепочки по описанию на естественном языке.
