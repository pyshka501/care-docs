---
title: Миграция — legacy → типизированные шаги
description: Переход с единого StepDescription на типизированные классы, обновление старого JSON цепочек и контракты входа 0.5.0.
sidebar:
  order: 2
---

На этой странице три миграции: legacy-объекты шагов в типизированные классы,
старый JSON цепочек в текущий формат и код, написанный под поведение входа и
ввода человека до 0.4.

## Legacy `StepDescription` → типизированные классы

Единый `StepDescription` по-прежнему работает для своих типов (`llm`, `tool`,
`mcp`, `memory`, `transform`, `conditional`, `structured_output`, `command`,
`shell_session`). В новом коде используйте
[типизированные классы](/ru/carl/steps/overview/). Они есть для каждого типа
шага. Новые типы (`agent`, `code`, `wait`, `map`, `human_input`,
многоагентные шаги, `claude_code`, `codex`) существуют только как
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
**теряет `retry_max` и `timeout`** у LLM-шагов (проверено на 0.5.0). Задайте
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
версии CARL по ступеням. Заметные ступени:

| Формат | Изменение |
| --- | --- |
| 6 | Удаляет `HumanInputStepConfig.fallback_value` из сохранённых конфигов и пишет предупреждение. |
| 9 | Добавляет список `chain_tools` верхнего уровня. |
| 10 | Типы шагов Claude Code и Codex. |
| 11 | Топология субагентов в шагах взаимодействия. В старых цепочках остаются заглушки `__placeholder__`, хост восстанавливает их сам. |

Если `format_version` в словаре новее среды, будет `ChainFormatNewerError`.
Обновите `mmar-carl`, а не правьте номер вручную.

## Переход на контракты 0.5.0

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

## См. также

- [Обзор шагов](/ru/carl/steps/overview/)
- [JSON-сериализация](/ru/carl/serialization/json/)
- [История изменений](/ru/carl/reference/changelog/)
