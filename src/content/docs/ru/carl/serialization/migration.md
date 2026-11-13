---
title: Миграция — legacy → типизированные шаги
description: Переход с единого StepDescription на типизированные классы, подъём старого JSON цепочек до формата 15 и контракты хоста 0.5.x.
sidebar:
  order: 2
---

На этой странице три миграции: legacy-объекты шагов в типизированные классы,
старый JSON цепочек в текущий формат и код, написанный под поведение входа и
ввода человека до 0.4, плюс изменения на стороне хоста в 0.5.0.

## Legacy `StepDescription` → типизированные классы

Единый `StepDescription` по-прежнему работает для своих типов (`llm`, `tool`,
`mcp`, `memory`, `transform`, `conditional`, `structured_output`, `command`,
`shell_session`). В новом коде используйте
[типизированные классы](/ru/carl/steps/overview/). Они есть для каждого типа
шага. Новые типы (`agent`, `code`, `wait`, `map`, `human_input`,
многоагентные шаги, `claude_code`, `codex`, `selection`, `planner`, `decision`,
`terminate`) существуют только как
типизированные классы.

| Legacy | Типизированный |
| --- | --- |
| `StepDescription(..., step_type=StepType.LLM)` | `LLMStepDescription(...)` |
| `StepDescription(..., step_type=StepType.TOOL, step_config=ToolStepConfig(...))` | `ToolStepDescription(config=ToolStepConfig(...))` |
| `StepDescription(..., step_type=StepType.MEMORY, step_config=MemoryStepConfig(...))` | `MemoryStepDescription(config=MemoryStepConfig(...))` |

```python
# Было
StepDescription(number=1, title="Analysis", aim="Analyze data",
                reasoning_questions="What patterns exist?", step_type=StepType.LLM)

# Стало
LLMStepDescription(number=1, title="Analysis", aim="Analyze data",
                   reasoning_questions="What patterns exist?")
```

### Преобразование объектов

`StepDescription.to_typed_step()` преобразует один объект:

```python
legacy = StepDescription(number=1, title="Old", aim="Old step")
typed = legacy.to_typed_step()      # -> LLMStepDescription
```

:::caution
`to_typed_step()` сохраняет `llm_config`, `checkpoint` и `triggered_by`, но
**теряет `retry_max` и `timeout`** у LLM-шагов (проверено на 0.5.2). Задайте
их заново у типизированного шага или загружайте JSON типизированным путём.
:::

### Преобразование сохранённых цепочек

Загрузите типизированным путём и сохраните снова:

```python
import json
from pathlib import Path
from mmar_carl import ReasoningChain

raw = json.loads(Path("chain.json").read_text(encoding="utf-8"))
chain = ReasoningChain.from_dict_typed(ReasoningChain.migrate(raw))
chain.save("chain.json")
```

`load()` / `from_json()` по умолчанию тоже загружают все типы шагов, но для
перечисленных выше типов дают legacy-объекты. См.
[JSON-сериализация](/ru/carl/serialization/json/#два-пути-загрузки).

## Старый JSON → текущий формат

`ReasoningChain.migrate(data, to_version=None)` поднимает словарь из старой
версии CARL по ступеням. `from_dict()` сам её не вызывает, поэтому надёжная
загрузка выглядит так:

```python
chain = ReasoningChain.from_dict(ReasoningChain.migrate(raw))
```

| Формат | Релиз | Изменение |
| --- | --- | --- |
| 6 | 0.4.0 | Удаляет `HumanInputStepConfig.fallback_value` из сохранённых конфигов и пишет предупреждение. |
| 9 | 0.4.0 | Добавляет список `chain_tools` верхнего уровня. |
| 10 | 0.5.0 | Тип шага Codex. |
| 11 | 0.5.0 | Топология субагентов в шагах взаимодействия. В старых цепочках остаются заглушки `__placeholder__`, подключите субагентов из исходника заново. |
| 12 | 0.5.0 | Сохраняются `fail_fast`, `max_injections`, `memory_schema` и `step_groups`. Уже записанный `fail_fast` (как в цепочках из сборки CARL в Maestro) остаётся. |
| 13 | 0.5.0 | Тип шага planner. |
| 14 | 0.5.1 | Тип шага decision. |
| 15 | 0.5.2 | Тип шага terminate. |

Ступени 10, 11 и 13–15 ничего не переписывают, они только повышают номер.
Так старый читатель останавливается на границе цепочки с
`ChainFormatNewerError`, а не падает позже на незнакомом enum. `claude_code` и
`selection` появились в 0.5.0 без своей ступени: любая цепочка 0.5.0 и так
имеет формат 13.

Если `format_version` в словаре новее среды, будет `ChainFormatNewerError`.
Обновите `mmar-carl`, а не правьте номер вручную.

## Переход на контракты 0.4.0

### Ввод человека

`fallback_value` больше нет. Отсутствие ответа никогда не считается успехом.

```python
from mmar_carl import HumanInputRequest, HumanInputResponse

async def ask_human(request: HumanInputRequest) -> HumanInputResponse:
    answer = ...   # показать request.prompt, получить ответ
    return HumanInputResponse(request_id=request.request_id, value=answer)

context.on_human_input_requested = ask_human
```

Ответ должен вернуть тот же `request.request_id`, иначе шаг падает.
Проверяйте `step_result.as_human_input_outcome().status`. Успех только у
`answered`. См. [ввод человека](/ru/carl/orchestration/human-in-the-loop/).

### Структурированный вход хоста

Если хост раньше клал JSON в `outer_context`, чтобы шаги читали
`$outer_context.<field>`, передавайте данные через `runtime_input`. А
`outer_context` оставьте для текста промпта:

```python
context = ReasoningContext(
    outer_context="Find hotels for the trip",   # это читают LLM-шаги
    runtime_input={"city": "Paris", "nights": 3},
    api=client,
)
# в конфиге шага: input_mapping={"city": "$outer_context.city"}
```

### Обязательные входы инструментов

Если обязательный параметр инструмента разрешился в `None`, шаг падает до
вызова инструмента (`CARL_TOOL_INPUT_UNRESOLVED`). Литералы без кавычек вроде
`input_mapping={"values": "[1, 2]"}` разрешаются в `None`. Пишите их как
JSON-литералы (`'"[1, 2]"'`) и объявляйте типизированный `ToolParameter`. См.
[динамические ссылки](/ru/carl/chains/dynamic-references/).

## Обновление хоста до 0.5.x

Ниже ломающие и поведенческие изменения 0.5.0. 0.5.1 и 0.5.2 только добавляют
типы шагов, и хост менять не нужно, пока вы ими не пользуетесь.

### Локальным агентам нужно разрешение хоста

Шаги `claude_code` и `codex` падают, если доверенный контекст хоста их не
разрешил. Загрузка цепочки этот флаг не ставит:

```python
context = ReasoningContext(
    outer_context=task,
    api=client,
    allow_local_agent_execution=True,   # только для цепочек, которым доверяете
)
```

`ClaudeCodeStepConfig.env` больше не пишется в `to_dict()`. Загрузка при этом
несимметрична: словарь, в котором `env` всё ещё есть, его загрузит (проверено
на 0.5.2). Вычищайте `env` из чужого JSON, прежде чем давать флаг.

### Сбой инструмента валит шаг

Tool-шаг, вызвавший [инструмент-цепочку](/ru/carl/steps/chain-tools/), чья
вложенная цепочка не завершилась, теперь падает. Так же падает MCP-вызов с
`isError: true` в ответе. Код, который доставал ошибку из «успешного» шага,
должен обрабатывать `success=False` (или включить `fail_fast`, чтобы
остановить цепочку).

### Формат ответа задаёт шаг

Стандартные английская и русская обёртки промпта несут вход, инструкции шага и
историю, но больше не подразумевают фиксированный формат ответа. Нужный формат
пропишите в самом шаге (`stage_action`, `aim` или шаг
[структурированного вывода](/ru/carl/steps/structured-output/)) или передайте
свой `PromptTemplate` в `ReasoningChain(prompt_template=...)`, если у всех
шагов один стиль. См.
[руководство по workflow](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/docs/WORKFLOW_BEST_PRACTICES.md)
в репозитории.

### Новые разрешения для новых шагов

Шагу `decision` (0.5.1) ещё нужен `ReasoningContext.decision_endpoints`, см.
[шаг Decision](/ru/carl/steps/decision/#разрешение-хоста-и-ключи).

## См. также

- [Обзор шагов](/ru/carl/steps/overview/)
- [JSON-сериализация](/ru/carl/serialization/json/)
- [История изменений](/ru/carl/reference/changelog/)
