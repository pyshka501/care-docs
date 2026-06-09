---
title: Обзор оркестрации
description: Многоагентные паттерны — supervisor, debate, handoff, parallel sampling, human-in-the-loop — и шина событий.
sidebar:
  order: 1
---

Помимо одиночных шагов, CARL поставляет типы шагов для **многоагентных** паттернов.
Каждый — это шаг, который вы добавляете в цепочку.

| Паттерн | Шаг | Когда использовать… |
| --- | --- | --- |
| [Supervisor](/ru/carl/orchestration/supervisor/) | `SupervisorStepDescription` | LLM должен маршрутизировать задачу в одного из N специалистов. |
| [Handoff](/ru/carl/orchestration/handoff/) | `AgentHandoffStepDescription` | нужно делегировать полную под-цепочку. |
| [Debate](/ru/carl/orchestration/debate/) | `DebateStepDescription` | несколько ролей должны дискутировать, затем судья синтезирует. |
| [Parallel sampling](/ru/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` | семплировать N ответов и выбрать лучший голосованием / судьёй (совет LLM). |
| [Human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` | человек должен одобрить или предоставить значение. |

## Шина событий

Шаги также могут координироваться **через события** вместо (или вместе с) числовых
`dependencies`. Шаг испускает событие; нижестоящие шаги, ожидающие это событие,
становятся готовыми, как только оно срабатывает.

```python
# Producer: emit from a tool / callback during execution
context.emit_event("error_detected", {"code": 503})

# Consumer: a step that waits for the event
LLMStepDescription(
    number=5, title="Handle error",
    aim="React to the detected error.",
    triggered_by=["error_detected"],   # ready only after ALL listed events fire
)
```

Читайте последний payload через [ссылку](/ru/carl/chains/dynamic-references/)
`$event.<name>`. Шаг с `triggered_by` становится готовым только когда **все** его события
срабатывают **и** числовые `dependencies` выполнены — что позволяет реализовывать
fan-out, где многие шаги следят за одним событием.
