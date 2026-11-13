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

Оба пути загружают **все** типы шагов CARL 0.5.2. Мы проверили это так:
собрали по минимальной цепочке на каждый `StepType` через
`auto_generate_minimal_step` и загрузили через `from_json` и `from_dict_typed`.
Все 28 одношаговых фикстур загрузились, а типизированный путь дал в точности
исходный `to_dict()`. (29-му типу, `evaluation`, нужен второй шаг, который он
проверяет, поэтому одношаговой фикстуры у него нет; его покрывают собственные
тесты CARL.)

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
`metadata["care"]`), `timeout`, `fail_fast`, `max_injections`,
`memory_schema`, `step_groups`, `replan_policy`, `search_config`,
`default_llm_config`, `trace_name`, `session_id`, `chain_tools`, `steps`.
`max_injections`, `memory_schema` и `step_groups` сохраняются с формата 12
(CARL 0.5.0).

Каждый шаг: `number`, `title`, `dependencies`, `step_type`, `checkpoint`,
`checkpoint_name`, `replan_enabled`, `triggered_by`, `loop_back_to`,
`loop_config`, `frozen`. `metadata` шага не пишется. LLM-шаги добавляют `aim`, `reasoning_questions`,
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
| `metrics` (цепочки и шагов) | нет, подключите объекты `MetricBase` заново |
| `cache` (`StepCache`) | нет, подключите заново |
| `prompt_template` | шаблон по умолчанию |
| Полномочия хоста (`CommandPolicy`, `CommandCapabilityRegistry`, `NetworkEnforcer`, `CodeExecutionPolicy`, `allow_local_agent_execution`, `decision_endpoints`, `allow_code_tools`) | никогда не входят в JSON цепочки, хост кладёт их в `ReasoningContext` |
| `ClaudeCodeStepConfig.env` | с 0.5.0 не пишется, хост задаёт его на доверенных шагах. Если в словаре `env` есть, он загрузится. |

## Версии

`to_dict()` записывает:

- `format_version: int` — это `ReasoningChain.FORMAT_VERSION`: `13` в CARL
  0.5.0, `14` в 0.5.1, `15` в 0.5.2. Каждый новый тип шага или изменение
  формата добавляет одну ступень в `ReasoningChain.migrate()`.
- `carl_version: str` — только для информации.

| Ситуация | Поведение |
| --- | --- |
| Формат старше | `migrate()` проходит лестницу, цепочка загружается. |
| Формат новее | `from_dict()` бросает `ChainFormatNewerError(required_version, this_version)`. Хост может поймать её и попросить обновить `mmar-carl`. |
| Неизвестный `step_type` | Цепочка не загружается целиком (`ValueError`). Ничего не пропускается молча. |

:::caution[Цепочки из сборки CARL внутри Maestro]
Приложение Maestro пока не работает на релизе 0.5.x. Оно закрепляет
`mmar-carl 0.3.0+maestro.contracts.3`, у которой `FORMAT_VERSION` равен `1`
(см. [какой CARL запускает Maestro](/ru/carl/care-integration/overview/#какой-carl-запускает-maestro)).

- Цепочка, сохранённая в Maestro (формат 1, часто с `fail_fast`), загружается в
  0.5.2: `migrate()` поднимает её до 15 и сохраняет `fail_fast`.
- Цепочку, сохранённую в 0.5.2 (формат 15), сборка Maestro отклоняет с
  `ChainFormatNewerError`, даже если в ней только знакомые этой сборке типы шагов.
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
