---
title: Обзор шагов
description: Все 29 типов шагов CARL, общие поля всех шагов, типизированный и legacy API.
sidebar:
  order: 1
---

Цепочка CARL состоит из **шагов**. Каждый шаг описывается типизированным объектом.
Он задаёт, что сделать и от чего зависит результат. DAG-исполнитель выбирает
исполнитель шага по его типу.

## Типизированный API и legacy

В новом коде используйте **типизированные классы** (`LLMStepDescription`,
`ToolStepDescription`, …). Поля в них проверяются по типам, а намерение видно
сразу. Старый единый класс `StepDescription` по-прежнему принимается ради
обратной совместимости. Преобразовать его можно через `legacy_step.to_typed_step()`.

Чтобы загрузить сохранённый JSON в типизированные классы, вызовите
`ReasoningChain.from_dict_typed(data)`. `from_dict()`, `from_json()` и `load()`
по умолчанию идут по legacy-пути (см. [ReasoningChain](/ru/carl/chains/overview/)).

## Общие поля всех шагов

Все классы шагов наследуют `StepDescriptionBase` и получают эти поля:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `number` | `int` | обязательное | Номер шага в последовательности. |
| `title` | `str` | обязательное | Название для человека. |
| `dependencies` | `list[int]` | `[]` | Номера шагов, которых этот шаг ждёт. |
| `triggered_by` | `list[str]` | `[]` | Имена событий, без которых шаг не запустится (см. [шину событий](/ru/carl/orchestration/overview/#шина-событий)). Шаг готов, только когда сработали **все** перечисленные события *и* выполнены числовые `dependencies`. |
| `checkpoint` | `bool` | `False` | Пометить шаг как точку отката для RE-PLAN. |
| `checkpoint_name` | `str \| None` | `None` | Необязательная метка чекпоинта. |
| `replan_enabled` | `bool \| None` | `None` | Переопределение RE-PLAN для шага (`None` = политика цепочки). |
| `frozen` | `bool` | `False` | Помощникам эволюции нельзя менять, перетипизировать или удалять шаг. Учитывают его помощники `mmar_carl.meta`, а `ChainMutator` нет (см. [примитивы EvoC](/ru/carl/evolution/overview/#примитивы-evoc)). |
| `metadata` | `dict` | `{}` | Произвольные метаданные шага. Сюда исполнитель пишет происхождение шага. |
| `metrics` | `list[MetricBase]` | `[]` | Метрики, которые считаются после выполнения шага. |
| `loop_back_to` | `int \| None` | `None` | Шаг, к которому вернуться в цикле. См. [циклы](/ru/carl/steps/loops/). |
| `loop_config` | `LoopConfig \| None` | `None` | Условие цикла и ограничение на число итераций. |
| `cache` | `StepCache \| None` | `None` | Мемоизация результата. См. [кэширование](/ru/carl/steps/caching/). `command`, `shell_session`, `command_plan`, `planner`, `claude_code` и `codex` его не принимают. |

:::note
`retry_max` и `timeout` есть **не** у каждого шага. Они объявлены в
`LLMStepDescription` (см. [LLM-шаги](/ru/carl/steps/llm/)). Остальные типы шагов
задают свои лимиты в конфиге. Tool-шаги используют `ToolStepConfig.timeout` и
`ToolErrorRecovery`, у агентных шагов и шагов рантайма есть явные лимиты по
времени и размеру.
:::

## Типы шагов

В 0.5.2 у `StepType` 29 значений. `"bash"` из старого JSON цепочки по-прежнему
загружается как `command`. Новые с 0.4.0: `claude_code`, `codex`, `selection` и
`planner` (0.5.0), `decision` (0.5.1) и `terminate` (0.5.2).

### Рассуждение и данные

| Тип | Класс | Что делает |
| --- | --- | --- |
| `llm` | [`LLMStepDescription`](/ru/carl/steps/llm/) | Рассуждение chain-of-thought одним вызовом LLM (тип по умолчанию). |
| `structured_output` | [`StructuredOutputStepDescription`](/ru/carl/steps/structured-output/) | Ответ LLM, проверенный по JSON Schema. |
| `tool` | [`ToolStepDescription`](/ru/carl/steps/tool/) | Вызывает зарегистрированную Python-функцию. |
| `memory` | [`MemoryStepDescription`](/ru/carl/steps/memory/) | read / write / append / delete / list над общей памятью. |
| `transform` | [`TransformStepDescription`](/ru/carl/steps/transform/) | Преобразование данных без вызова LLM. |
| `conditional` | [`ConditionalStepDescription`](/ru/carl/steps/conditional/) | Направляет выполнение в одну ветку, остальные пропускаются. |
| `tool_discovery` | [`ToolDiscoveryStepDescription`](/ru/carl/steps/tool-discovery/) | Находит и регистрирует инструменты во время выполнения. |
| `evaluation` | `EvaluationStepDescription` | Встроенная проверка качества результата другого шага. См. [метрики](/ru/carl/evaluation/metrics/). |
| `selection` | [`SelectionStepDescription`](/ru/carl/steps/selection/) | Выбирает элементы списка (top-k, взвешенно, случайно, фильтром) без вызова LLM. |
| `decision` | [`DecisionStepDescription`](/ru/carl/steps/decision/) | Задаёт decision-модели типизированные вопросы (predicate, choice, score) через разрешённый хостом эндпоинт. |

### Агенты и делегирование

| Тип | Класс | Что делает |
| --- | --- | --- |
| `agent` | [`AgentStepDescription`](/ru/carl/steps/agent/) | Ограниченный цикл ReAct по явному списку зарегистрированных инструментов. Завершается обязательным `finish`. |
| `planner` | [`PlannerStepDescription`](/ru/carl/steps/planner/) | Модель выбирает и упорядочивает объявленные в цепочке действия-инструменты, они выполняются как вставленные tool-шаги. |
| `claude_code` | [`ClaudeCodeStepDescription`](/ru/carl/steps/claude-code/) | Передаёт целую подзадачу headless-агенту Claude Code CLI. |
| `codex` | [`CodexStepDescription`](/ru/carl/steps/codex/) | Передаёт целую подзадачу локальному агенту Codex через Codex SDK. |
| `agent_skill` | `AgentSkillStepDescription` | Запускает папку [AgentSkill](/ru/carl/skills/overview/). |
| `agent_handoff` | `AgentHandoffStepDescription` | Делегирует работу полной подцепочке. См. [handoff](/ru/carl/orchestration/handoff/). |
| `supervisor` | `SupervisorStepDescription` | LLM направляет задачу в одну из N подцепочек. См. [supervisor](/ru/carl/orchestration/supervisor/). |
| `debate` | `DebateStepDescription` | Дебаты нескольких ролей по кругу и судья. См. [дебаты](/ru/carl/orchestration/debate/). |
| `parallel_sampling` | `ParallelSamplingStepDescription` | Берёт N ответов, затем голосование или судья. См. [параллельный сэмплинг](/ru/carl/orchestration/parallel-sampling/). |
| `human_input` | `HumanInputStepDescription` | Спрашивает человека через callback хоста, исход типизирован. См. [human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/). |

Цепочка также может открыть другую цепочку как вызываемый инструмент. Это не тип
шага, а поле верхнего уровня `chain_tools`. См. [цепочки как инструменты](/ru/carl/steps/chain-tools/).

### Выполнение и время

| Тип | Класс | Что делает |
| --- | --- | --- |
| `code` | [`CodeStepDescription`](/ru/carl/steps/code/) | Выполняет одну точную строку Python-кода в строго изолированном рантайме хоста. |
| `command` | [`CommandStepDescription`](/ru/carl/steps/command/) | Запускает одну argv-команду через рантайм навыка под `CommandPolicy` хоста. |
| `command_plan` | [`CommandPlanStepDescription`](/ru/carl/steps/command-plan/) | LLM выбирает типизированные аргументы для командной возможности, зарегистрированной хостом. |
| `shell_session` | [`ShellSessionStepDescription`](/ru/carl/steps/shell-session/) | Выполняет статический скрипт в одном процессе shell. |
| `wait` | [`WaitStepDescription`](/ru/carl/steps/wait/) | Ждёт таймер, абсолютное время или именованное событие. |
| `map` | [`MapStepDescription`](/ru/carl/steps/map/) | Ограниченный упорядоченный fan-out одного инструмента по JSON-массиву. |
| `terminate` | [`TerminateStepDescription`](/ru/carl/steps/terminate/) | Возвращает явный ответ и останавливает цепочку после текущего батча. |

### MCP

| Тип | Класс | Что делает |
| --- | --- | --- |
| `mcp` | `MCPStepDescription` | Вызывает инструмент на MCP-сервере. См. [MCP](/ru/carl/mcp/overview/). |
| `mcp_resource` | `MCPResourceStepDescription` | Читает именованный MCP-ресурс в память. См. [MCP-ресурсы](/ru/carl/mcp/resources/). |

## Полномочия остаются у хоста

Шаги, которые запускают код, команды или агентов, подчиняются одному правилу:
**сериализованная цепочка является входными данными, а не источником полномочий.**
Цепочка говорит, чего она хочет. Разрешение выдаёт хост во время выполнения
через объекты, которые никогда не попадают в JSON цепочки: `CommandPolicy`,
`CommandCapabilityRegistry`, `CodeExecutionPolicy`, сетевой контролёр,
провайдер человеческого ввода, зарегистрированные инструменты и два поля
контекста:

- `ReasoningContext.allow_local_agent_execution` (по умолчанию `False`) должен
  быть `True`, чтобы шаг `claude_code` или `codex` мог запустить локального
  агента. Загрузка цепочки этот флаг не ставит.
- `ReasoningContext.decision_endpoints` разрешает точный URL и переменную с
  ключом для каждого провайдера шага `decision`.

Шаг `claude_code` по-прежнему сериализует флаги CLI (`permission_mode`,
`allowed_tools`, `extra_cli_args`, `add_dirs`), так что цепочка может попросить
для агента широкие права. Переопределения `env` в JSON не пишутся. Шаг `codex`
ограничивает песочницу режимами `read-only` и `workspace-write`. Проверяйте
цепочки с такими шагами, прежде чем разрешать локальных агентов.

## Перед запуском

`chain.preflight(context)` показывает, что нужно цепочке и чего не хватает:
инструменты, MCP-серверы, навыки, профили кода, Claude Code CLI, рантайм Codex
и ключи decision-моделей.
См. [preflight](/ru/carl/care-integration/preflight/).

## Сквозные возможности

- [Циклы](/ru/carl/steps/loops/): повторять диапазон шагов, пока выполняется условие.
- [Кэширование](/ru/carl/steps/caching/): мемоизировать результат шага в пределах запуска.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/): `$history`, `$memory`, `$outer_context`, `$steps` и другие связывают шаги между собой.
- [Управление запуском](/ru/carl/chains/run-controls/): fail-fast, пауза, возобновление, отмена и таймауты.
