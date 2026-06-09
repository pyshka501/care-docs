---
title: Обзор шагов
description: Все типы шагов CARL, общие поля и типизированный vs. устаревший API.
sidebar:
  order: 1
---

Цепочка CARL — это список **шагов**. Каждый шаг — типизированный объект-описание,
который объявляет, что делать и от чего зависит. DAG-исполнитель выбирает executor
на основе типа шага.

## Типизированный API vs. устаревший

Используйте **типизированные классы** (`LLMStepDescription`, `ToolStepDescription`, …) для
нового кода — они дают проверяемые типы полей и явное намерение. Устаревший единый
класс `StepDescription` по-прежнему принимается для обратной совместимости; преобразуйте его
с помощью `legacy_step.to_typed_step()`.

## Поля, общие для всех шагов

Все классы шагов наследуют `StepDescriptionBase` и получают эти поля:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `number` | `int` | — (обязательное) | Номер шага в последовательности. |
| `title` | `str` | — (обязательное) | Читаемое название. |
| `dependencies` | `list[int]` | `[]` | Номера шагов, которых ждёт этот шаг. |
| `triggered_by` | `list[str]` | `[]` | Имена событий, блокирующих шаг (см. [шаги с событиями](/ru/carl/steps/advanced/)). Шаг становится готовым только когда **все** указанные события были испущены *и* числовые `dependencies` выполнены. |
| `checkpoint` | `bool` | `False` | Отметить как контрольную точку для отката RE-PLAN. |
| `checkpoint_name` | `str \| None` | `None` | Необязательная метка контрольной точки. |
| `replan_enabled` | `bool \| None` | `None` | Переопределение RE-PLAN на уровне шага (`None` = использовать политику цепочки). |
| `metrics` | `list[MetricBase]` | `[]` | Метрики, вычисляемые после выполнения шага. |
| `loop_back_to` | `int \| None` | `None` | Шаг, к которому нужно вернуться — см. [циклы](/ru/carl/steps/loops/). |
| `loop_config` | `LoopConfig \| None` | `None` | Условие цикла + ограничение итераций. |
| `cache` | `StepCache \| None` | `None` | Мемоизация результата — см. [кэширование](/ru/carl/steps/caching/). |

:::note
`retry_max` и `timeout` есть **не у каждого шага**. Они находятся на
`LLMStepDescription` (см. [LLM-шаги](/ru/carl/steps/llm/)); у tool-шагов повторные попытки
настраиваются через `ToolStepConfig` / `ToolErrorRecovery` (см. [tool-шаги](/ru/carl/steps/tool/)).
:::

## Типы шагов

### Базовые

| Тип | Класс | Что делает |
| --- | --- | --- |
| `llm` | [`LLMStepDescription`](/ru/carl/steps/llm/) | Reasoning по типу chain-of-thought с LLM (по умолчанию). |
| `tool` | [`ToolStepDescription`](/ru/carl/steps/tool/) | Вызывает зарегистрированную Python-функцию. |
| `memory` | [`MemoryStepDescription`](/ru/carl/steps/memory/) | read / write / append / delete / list в общей памяти. |
| `transform` | [`TransformStepDescription`](/ru/carl/steps/transform/) | Преобразование данных без вызова LLM. |
| `conditional` | [`ConditionalStepDescription`](/ru/carl/steps/conditional/) | Переход к шагу на основе условия. |
| `structured_output` | [`StructuredOutputStepDescription`](/ru/carl/steps/structured-output/) | Вывод LLM, ограниченный JSON-схемой. |

### Расширенные

Они описаны на странице [расширенных шагов](/ru/carl/steps/advanced/) и имеют
полноценные руководства в своих разделах (Orchestration, Skills, MCP, Evaluation).

| Тип | Класс | Что делает |
| --- | --- | --- |
| `mcp` | `MCPStepDescription` | Вызывает инструмент на MCP-сервере. |
| `mcp_resource` | `MCPResourceStepDescription` | Читает именованный MCP-ресурс в память. |
| `agent_skill` | `AgentSkillStepDescription` | Запускает папку [AgentSkill](https://agentskills.io). |
| `agent_handoff` | `AgentHandoffStepDescription` | Делегирует выполнение полной под-цепочке. |
| `supervisor` | `SupervisorStepDescription` | LLM маршрутизирует задачу в одну из N под-цепочек. |
| `debate` | `DebateStepDescription` | Многоагентная дискуссия по кругу + судья. |
| `parallel_sampling` | `ParallelSamplingStepDescription` | Семплирует N ответов, голосует / выбирает лучший. |
| `human_input` | `HumanInputStepDescription` | Пауза для ввода от человека (вызываемый объект или вебхук). |
| `tool_discovery` | `ToolDiscoveryStepDescription` | Обнаруживает и регистрирует инструменты во время выполнения. |
| `evaluation` | `EvaluationStepDescription` | Встроенный контроль качества вывода другого шага. |

## Сквозные возможности

- [Циклы](/ru/carl/steps/loops/) — повторный запуск диапазона шагов до выполнения условия.
- [Кэширование](/ru/carl/steps/caching/) — мемоизация результата шага в рамках запуска.
- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — `$history`, `$memory`, … связывают шаги между собой.
