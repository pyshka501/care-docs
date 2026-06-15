---
title: Расширенные шаги
description: MCP, AgentSkills, многоагентная оркестрация, обнаружение инструментов, оценка и шаги с участием человека.
sidebar:
  order: 10
---

Помимо [базовых шагов](/ru/carl/steps/overview/#базовые), CARL поставляет
типы шагов для MCP, навыков, многоагентной оркестрации и многого другого. Каждый
получает полное руководство в своём разделе; эта страница — карта с основной информацией.

## MCP — вызов инструментов на MCP-сервере

`MCPStepDescription` + `MCPStepConfig`. Транспорты: `stdio`, `http`, `sse`.

```python
from mmar_carl import MCPStepDescription
from mmar_carl.models.config import MCPStepConfig, MCPServerConfig

MCPStepDescription(
    number=1,
    title="Call MCP tool",
    config=MCPStepConfig(
        server=MCPServerConfig(server_name="my_server", command="python", args=["-m", "my_mcp_server"]),
        tool_name="search",
        argument_mapping={"query": "$history[-1]"},
    ),
)
```

→ Полное руководство: [Обзор MCP](/ru/carl/mcp/overview/).

## MCP-ресурс — чтение ресурса в память

`MCPResourceStepDescription` + `MCPResourceStepConfig`. Получает данные только для чтения
(файлы, документацию, схемы) и записывает их в память и историю.

```python
from mmar_carl import MCPResourceStepDescription
from mmar_carl.models.config import MCPResourceStepConfig, MCPServerConfig

MCPResourceStepDescription(
    number=1,
    title="Load API reference",
    config=MCPResourceStepConfig(
        server=MCPServerConfig(server_name="docs", transport="sse", url="http://docs/sse"),
        resource_uri="docs://api/reference.md",
        output_memory_key="api_docs",
    ),
)
```

## Передача управления агенту — делегирование под-цепочке

`AgentHandoffStepDescription` запускает полную под-цепочку с изолированным контекстом;
входные данные разрешаются из памяти/истории родителя, результат объединяется обратно через
`config.output_memory_key`.

```python
from mmar_carl import AgentHandoffStepDescription
from mmar_carl.models.config import AgentHandoffStepConfig

AgentHandoffStepDescription(
    number=3,
    title="Delegate to research agent",
    sub_chain=research_chain,
    config=AgentHandoffStepConfig(
        input_mapping={"input.topic": "$memory.input.topic"},
        output_memory_key="research_result",
    ),
)
```

Полный `ReasoningResult` под-цепочки доступен по адресу
`step_result.result_data["sub_result"]`.

## Остальные — кратко

| Шаг | Класс · конфиг | Что делает | Пример |
| --- | --- | --- | --- |
| AgentSkill | `AgentSkillStepDescription` · `AgentSkillStepConfig` | Запускает папку [AgentSkill](https://agentskills.io) (режимы LLM / SCRIPT / HYBRID / SUBAGENT / LLM_AGENT; в изолированной среде). | [agent_skill_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/agent_skill_example.py) |
| Supervisor | `SupervisorStepDescription` · `SupervisorStepConfig` | LLM маршрутизирует задачу в одну из N зарегистрированных специализированных под-цепочек. | [supervisor_routing_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/supervisor_routing_example.py) |
| Debate | `DebateStepDescription` · `DebateStepConfig` | Ролевая дискуссия по кругу, затем судья синтезирует. | — |
| Параллельное семплирование | `ParallelSamplingStepDescription` · `ParallelSamplingStepConfig` | Семплирует N независимых ответов, затем голосует / LLM-судья выбирает лучший. | [llm_council_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/llm_council_example.py) |
| Ввод от человека | `HumanInputStepDescription` · `HumanInputStepConfig` | Пауза для ввода от человека (внутрипроцессный вызываемый объект или вебхук). | [human_in_the_loop_example.py](https://github.com/Glazkoff/carl-experiments/blob/main/examples/agents/human_in_the_loop_example.py) |
| Обнаружение инструментов | `ToolDiscoveryStepDescription` · `ToolDiscoveryStepConfig` | Обнаруживает и регистрирует инструменты во время выполнения из модуля / вызываемых объектов / словаря. | — |
| Оценка | `EvaluationStepDescription` · `EvaluationStepConfig` | Встроенный контроль качества вывода предыдущего шага; реагирует через `on_fail` (continue / abort / retry-with-feedback). | — |

:::note
У каждого из них есть отдельный раздел с полными руководствами:
[Оркестрация](/ru/carl/orchestration/overview/) (supervisor / debate / parallel
sampling / handoff / human-in-the-loop), [AgentSkills](/ru/carl/skills/overview/),
[MCP](/ru/carl/mcp/overview/) и [Оценка](/ru/carl/evaluation/metrics/). Эта
страница — карта с основной информацией.
:::
