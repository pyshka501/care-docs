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

## Типизированные представления result-data

Каждый шаг оркестрации записывает свои детали в `StepExecutionResult.result_data`
(нестрогий `dict`). Для распространённых паттернов CARL предлагает **типизированные
представления**, чтобы читать поля, не копаясь в ключах словаря. Аксессоры
определены на `StepExecutionResult` и возвращают `None`, когда тип шага не совпадает
(или payload не проходит валидацию), так что они аккуратно сочетаются с
оператором-моржом:

```python
for sr in result.step_results:
    if (debate := sr.as_debate_transcript()):
        print(debate.verdict)
        for turn in debate.transcript:          # list[DebateTurn]
            print(turn.round, turn.role, turn.argument)
```

| Аксессор | Возвращает | Ключевые поля |
| --- | --- | --- |
| `sr.as_skill_output()` | `SkillOutput` | `skill_name`, `execution_mode`, `output_files`, `parsed_output`, `iterations`. |
| `sr.as_debate_transcript()` | `DebateTranscript` | `verdict`, `transcript` (`list[DebateTurn]` из `round`/`role`/`argument`), `rounds_executed`. |
| `sr.as_supervisor_decision()` | `SupervisorDecision` | `agent_selected`, `routing_reply`, `sub_result`, `sub_chain_success`, `steps_executed`. |
| `sr.as_parallel_samples()` | `ParallelSamples` | `n_samples`, `n_successes`, `aggregation`, `candidates`. |

Модели представлений (`SkillOutput`, `DebateTranscript`, `DebateTurn`,
`SupervisorDecision`, `ParallelSamples`) импортируются из `mmar_carl`. Они
снисходительны — лишние или будущие ключи сохраняются, а не отвергаются — поэтому
чтение через них никогда не ломается при изменении на стороне источника.

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
