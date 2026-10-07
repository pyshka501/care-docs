---
title: JSON-сериализация
description: Сохранение, загрузка и версии цепочек в JSON — что сохраняется, по какому пути загрузки и что теряется.
sidebar:
  order: 1
---

Цепочки сохраняются в JSON и загружаются обратно. Так их можно хранить,
передавать и перезапускать.

```python
chain.save("my_chain.json")                     # записать на диск
loaded = ReasoningChain.load("my_chain.json")   # путь загрузки по умолчанию

d = chain.to_dict();   ReasoningChain.from_dict(d)
s = chain.to_json();   ReasoningChain.from_json(s)

typed = ReasoningChain.from_dict_typed(d)       # типизированный путь
```

`from_dict` проверяет цепочку (циклы, ссылки на зависимости, синтаксис ссылок)
и только потом возвращает её.

## Два пути загрузки

| Путь | Вызовы | Какие объекты шагов получаются |
| --- | --- | --- |
| **По умолчанию** | `load()`, `from_json()`, `from_dict(data)` | Legacy `StepDescription` для `llm`, `tool`, `mcp`, `memory`, `transform`, `conditional`, `structured_output`, `command`, `shell_session`. Для остальных типов — типизированные классы. |
| **Типизированный** | `from_dict_typed(data)` = `from_dict(data, use_typed_steps=True)` | Типизированный класс для каждого типа шага (`LLMStepDescription`, `ToolStepDescription`, …). |

Оба пути загружают **все** типы шагов CARL 0.5.0. Мы проверили это так:
сохранили по одной цепочке на каждый `StepType` (25 типов) и загрузили через
`from_json`, `load` и `from_dict_typed`. Всё загрузилось, а типизированный путь
дал в точности исходный `to_dict()`.

На пути по умолчанию шаг legacy-типа возвращается как `StepDescription`. При
запуске он ведёт себя так же. Но его `to_dict()` получает пустые LLM-поля
(`aim: ""`, `reasoning_questions: ""`, …), которые legacy-класс носит всегда.
Побайтовое сравнение JSON покажет разницу. Если нужны типизированные объекты
или стабильный diff, используйте типизированный путь:

```python
import json
from pathlib import Path
from mmar_carl import ReasoningChain

raw = json.loads(Path("chain.json").read_text(encoding="utf-8"))
chain = ReasoningChain.from_dict_typed(ReasoningChain.migrate(raw))
```

`migrate()` поднимает словари из старых версий CARL до текущего формата.
`from_dict()` сам его не вызывает.

## Что сохраняется

Уровень цепочки: `format_version`, `carl_version`, `max_workers`,
`enable_progress`, `metadata` (Maestro хранит свой блок в
`metadata["care"]`), `timeout`, `fail_fast`, `replan_policy`,
`search_config`, `default_llm_config`, `trace_name`, `session_id`,
`chain_tools`, `steps`.

Каждый шаг: `number`, `title`, `dependencies`, `step_type`, `checkpoint`,
`checkpoint_name`, `replan_enabled`, `triggered_by`, `loop_back_to`,
`loop_config`. LLM-шаги добавляют `aim`, `reasoning_questions`,
`step_context_queries`, `stage_action`, `example_reasoning`, `llm_config`,
`retry_max`, `timeout`. Остальные шаги пишут полный `*StepConfig` в
`step_config`.

Шаги взаимодействия сохраняют субагентов.
`AgentHandoffStepDescription.sub_chain`, `SupervisorStepDescription.agents` и
`ParallelSamplingStepDescription.base_step` пишутся как вложенные снимки
цепочек и восстанавливаются при загрузке. У каждого вложенного снимка свой
`format_version`, поэтому субагента можно загрузить отдельно. `to_dict()`
бросает `ValueError`, если вложенность глубже 8 уровней или цепочка встраивает
сама себя. В JSON до формата 11 топологии нет. Такая цепочка загружается с
заглушками `__placeholder__`, и хост должен их заменить.

## Что не сериализуется

| Поле | После загрузки |
| --- | --- |
| `max_injections` | значение по умолчанию `50` |
| `memory_schema` | `None`, передайте заново |
| `step_groups` | пусто. `llm_config` группы вливается в шаги при сборке цепочки, поэтому итоговые настройки шагов сохраняются. |
| `metrics` (цепочки и шагов) | нет, подключите объекты `MetricBase` заново |
| `cache` (`StepCache`) | нет, подключите заново |
| `prompt_template` | шаблон по умолчанию |
| Полномочия хоста (`CommandPolicy`, `CommandCapabilityRegistry`, `NetworkEnforcer`, `CodeExecutionPolicy`) | никогда не входят в JSON цепочки, хост кладёт их в `ReasoningContext` |

## Версии

`to_dict()` записывает:

- `format_version: int` — это `ReasoningChain.FORMAT_VERSION`, в CARL 0.5.0
  он равен `11`. Каждый новый тип шага или изменение формата добавляет одну
  ступень в `ReasoningChain.migrate()`.
- `carl_version: str` — только для информации.

| Ситуация | Поведение |
| --- | --- |
| Формат старше | `migrate()` проходит лестницу, цепочка загружается. |
| Формат новее | `from_dict()` бросает `ChainFormatNewerError(required_version, this_version)`. Maestro показывает сообщение «обновите CARL». |
| Неизвестный `step_type` | Цепочка не загружается целиком (`ValueError`). Ничего не пропускается молча. |

:::caution[Цепочки из сборки CARL внутри Maestro]
Сборка CARL, которая поставляется в приложении Maestro
(`0.3.0+maestro.contracts.*`), нумерует форматы отдельно: формат 2 там
означает chain tools. Её JSON содержит `fail_fast`, а для chain tools ещё и
`required_tool_revisions`. Лестница миграций не покрывает перенос JSON между
этой сборкой и средой с `FORMAT_VERSION = 11`. Проверяйте такие цепочки через
`maestro validate` перед запуском.
:::

## Сериализация результатов

Результаты тоже сохраняются и загружаются. Именно их оборачивает
[`RunRecord`](/ru/carl/care-integration/run-record/):

```python
result = chain.execute(context)

result.save("result.json")
loaded = ReasoningResult.load("result.json")

d = result.to_dict(full=True)      # full=True сохраняет все детали шагов
ReasoningResult.from_dict(d)
```

`StepExecutionResult.to_dict(truncate=False)` / `from_dict` сериализуют
результат одного шага. `truncate=True` обрезает длинный вывод.
`injected_steps` всегда пишется как `[]`, поэтому шаги, добавленные во время
прогона, не сохраняются.

## См. также

- [Миграция: legacy → типизированные шаги](/ru/carl/serialization/migration/)
- [ReasoningChain](/ru/carl/chains/overview/) · [RunRecord](/ru/carl/care-integration/run-record/)
- [История изменений](/ru/carl/reference/changelog/)
