---
title: Расширенные шаги
description: Карта небазовых типов шагов (агенты, выполнение в рантайме, время, MCP, навыки, оркестрация и оценка) со ссылками на их руководства.
sidebar:
  order: 10
---

Помимо [базовых шагов](/ru/carl/steps/overview/#рассуждение-и-данные), в CARL есть
типы шагов для агентов, выполнения кода и команд, времени, MCP, навыков и
многоагентной оркестрации. У каждого есть полное руководство. Эта страница служит
картой.

## Агенты и делегирование

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [Agent](/ru/carl/steps/agent/) | `AgentStepDescription` · `AgentStepConfig` | Ограниченный цикл ReAct по явному списку разрешённых инструментов. Один вызов инструмента за итерацию. `finish` единственный успешный выход. |
| [Claude Code](/ru/carl/steps/claude-code/) | `ClaudeCodeStepDescription` · `ClaudeCodeStepConfig` | Передаёт подзадачу headless-агенту `claude` CLI с собственными инструментами. |
| [Codex](/ru/carl/steps/codex/) | `CodexStepDescription` · `CodexStepConfig` | Передаёт подзадачу локальному агенту Codex (песочница read-only или workspace-write). |
| [Цепочки как инструменты](/ru/carl/steps/chain-tools/) | `ChainToolDefinition` (поле цепочки, не шаг) | Открывает целую цепочку как изолированный типизированный инструмент. |
| [AgentSkill](/ru/carl/skills/overview/) | `AgentSkillStepDescription` · `AgentSkillStepConfig` | Запускает папку AgentSkill (режимы LLM / SCRIPT / HYBRID / SUBAGENT / LLM_AGENT). |

## Код и команды

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [Code](/ru/carl/steps/code/) | `CodeStepDescription` · `CodeStepConfig` | Выполняет один точный исходник Python с `def run(inputs)` под профилем `CodeExecutionPolicy` хоста, со схемами входа и выхода. |
| [Command](/ru/carl/steps/command/) | `CommandStepDescription` · `CommandStepConfig` | Запускает одну argv-команду через рантайм (`local`, `docker`, `e2b`, `firejail`) под `CommandPolicy` хоста. |
| [Command plan](/ru/carl/steps/command-plan/) | `CommandPlanStepDescription` · `CommandPlanStepConfig` | LLM выбирает типизированные аргументы для возможности, зарегистрированной хостом. Запланированный command-шаг выполняет её после одобрения. |
| [Shell session](/ru/carl/steps/shell-session/) | `ShellSessionStepDescription` · `ShellSessionStepConfig` | Выполняет статический скрипт в одном процессе shell. |

## Время и fan-out

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [Wait](/ru/carl/steps/wait/) | `WaitStepDescription` · `WaitStepConfig` | Ждёт заданное время, абсолютный момент, именованное событие или первое из нескольких. |
| [Map](/ru/carl/steps/map/) | `MapStepDescription` · `MapStepConfig` | Вызывает один инструмент для каждого элемента JSON-массива, с ограничением и по порядку. |

## MCP

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [MCP](/ru/carl/mcp/overview/) | `MCPStepDescription` · `MCPStepConfig` | Вызывает инструмент на MCP-сервере (`stdio`, `http`, `sse`). |
| [MCP-ресурс](/ru/carl/mcp/resources/) | `MCPResourceStepDescription` · `MCPResourceStepConfig` | Читает именованный ресурс в память и историю. |

## Оркестрация

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [Handoff](/ru/carl/orchestration/handoff/) | `AgentHandoffStepDescription` · `AgentHandoffStepConfig` | Запускает полную подцепочку и вливает её результат обратно. |
| [Supervisor](/ru/carl/orchestration/supervisor/) | `SupervisorStepDescription` · `SupervisorStepConfig` | LLM направляет задачу в одну из N подцепочек. |
| [Дебаты](/ru/carl/orchestration/debate/) | `DebateStepDescription` · `DebateStepConfig` | Роли выступают по кругу, затем судья. |
| [Параллельный сэмплинг](/ru/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` · `ParallelSamplingStepConfig` | N сэмплов одного LLM-шага, затем голосование или судья. |
| [Ввод человека](/ru/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` · `HumanInputStepConfig` | Спрашивает человека через провайдер хоста. Исход типизирован (`answered` единственный успешный). |

## Инструменты и качество

| Шаг | Класс · конфиг | Что делает |
| --- | --- | --- |
| [Обнаружение инструментов](/ru/carl/steps/tool-discovery/) | `ToolDiscoveryStepDescription` · `ToolDiscoveryStepConfig` | Регистрирует инструменты из модуля, фабрики или словаря во время запуска. |
| Evaluation | `EvaluationStepDescription` · `EvaluationStepConfig` | Встроенная проверка качества результата другого шага (ниже). |

### Evaluation-шаг

`EvaluationStepConfig` проверяет результат шага `evaluates_step` по `criteria` и
реагирует согласно `on_fail`:

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `evaluates_step` | обязательное | Номер шага, результат которого проверяется. |
| `criteria` | обязательное | Правила-выражения (`simpleeval`) или, при `evaluation_method="llm"`, утверждения для LLM-судьи. |
| `evaluation_method` | `"rule"` | `"rule"` или `"llm"`. |
| `on_fail` | `EvalFailAction.CONTINUE` | `CONTINUE`, `ABORT` или `RETRY_WITH_FEEDBACK`. |
| `input_source` | `"$history[-1]"` | Что именно оценивается. |
| `max_retries` | `1` | Число повторов для `RETRY_WITH_FEEDBACK`. |

См. также [метрики](/ru/carl/evaluation/metrics/) для оценки на уровне шага и цепочки.
