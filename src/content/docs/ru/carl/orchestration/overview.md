---
title: Обзор оркестрации
description: Многоагентные типы шагов (supervisor, handoff, debate, parallel sampling, human input), их типизированные результаты и шина событий.
sidebar:
  order: 1
---

В CARL есть пять типов шагов для многоагентных схем. Каждый из них — обычный шаг.
Его ставят в цепочку рядом с LLM-, tool- или memory-шагами.

| Паттерн | Шаг | Когда нужен | Что попадает в JSON |
| --- | --- | --- | --- |
| [Supervisor](/ru/carl/orchestration/supervisor/) | `SupervisorStepDescription` | LLM должна выбрать одну из N именованных под-цепочек | `agents` как вложенные цепочки |
| [Handoff](/ru/carl/orchestration/handoff/) | `AgentHandoffStepDescription` | задачу нужно отдать одной заранее известной под-цепочке с изолированным контекстом | `sub_chain` как вложенная цепочка |
| [Debate](/ru/carl/orchestration/debate/) | `DebateStepDescription` | несколько ролей спорят по раундам, потом судья выносит вердикт | только конфиг |
| [Parallel sampling](/ru/carl/orchestration/parallel-sampling/) | `ParallelSamplingStepDescription` | один LLM-шаг запускается N раз, победителя выбирает голосование или судья | `base_step` как вложенный шаг |
| [Human-in-the-loop](/ru/carl/orchestration/human-in-the-loop/) | `HumanInputStepDescription` | цепочка должна дождаться ответа человека | только конфиг |

Другие способы собрать агентов вместе:

- [Цепочки как инструменты](/ru/carl/steps/chain-tools/): целая цепочка становится инструментом, который может вызвать агент.
- [Agent-шаг](/ru/carl/steps/agent/): цикл LLM-агента с вызовами инструментов внутри одного шага.
- [Шаг Claude Code](/ru/carl/steps/claude-code/) и [шаг Codex](/ru/carl/steps/codex/): внешний агент для кода как шаг цепочки.

## Сериализация топологии

`to_dict()` и `to_json()` сохраняют не только конфиги шагов совместной работы,
но и самих участников. Версия формата цепочки — 11.

- `agent_handoff` пишет `sub_chain` как полный вложенный словарь цепочки.
- `supervisor` пишет `agents` как словарь «имя агента → вложенная цепочка».
- `parallel_sampling` пишет `base_step` как вложенный словарь шага. Это шаг, а не
  цепочка, поэтому уровень вложенности он не добавляет.

У вложенной цепочки есть свой `format_version`, поэтому под-агента можно загрузить
отдельно. При сериализации действуют два ограничения:

- Вложенность — не больше 8 уровней цепочек. Более глубокая цепочка вызывает `ValueError`.
- Цепочка, которая содержит саму себя (напрямую или через под-цепочки), тоже
  вызывает `ValueError`. Бесконечной рекурсии не будет.

В цепочках формата 10 и старше топологии нет. Они по-прежнему загружаются: handoff
получает под-цепочку из одного шага `__placeholder__`, supervisor получает пустой
`agents`, parallel sampling получает LLM-шаг `__placeholder__`. Перед запуском их
нужно заменить. Вызываемые объекты не сериализуются никогда:
`ParallelSamplingStepConfig.answer_extractor` и
`DebateStepConfig.convergence_predicate` после загрузки равны `None`. Общий формат
описан в разделе [JSON-сериализация](/ru/carl/serialization/json/).

## Типизированные представления result_data

Каждый шаг кладёт подробности в `StepExecutionResult.result_data`, обычный `dict`.
Для распространённых типов шагов у `StepExecutionResult` есть типизированные
методы. Метод возвращает `None`, если тип шага не тот или данные не проходят
валидацию. Поэтому удобно писать через оператор `:=`:

```python
for sr in result.step_results:
    if (debate := sr.as_debate_transcript()):
        print(debate.verdict, debate.rounds_executed, debate.converged)
        for turn in debate.transcript:          # list[DebateTurn]
            print(turn.round, turn.role, turn.argument)
    if (samples := sr.as_parallel_samples()):
        print(samples.aggregation_outcome, samples.vote_degenerate)
```

| Метод | Тип шага | Возвращает | Основные поля |
| --- | --- | --- | --- |
| `as_supervisor_decision()` | `supervisor` | `SupervisorDecision` | `agent_selected`, `routing_reply`, `routing_match_tier`, `routing_ambiguous`, `routing_candidates`, `sub_result`, `sub_chain_success`, `steps_executed` |
| `as_debate_transcript()` | `debate` | `DebateTranscript` | `verdict`, `transcript`, `rounds_executed`, `rounds_configured`, `role_call_count`, `topic`, `converged`, `convergence_reason` |
| `as_parallel_samples()` | `parallel_sampling` | `ParallelSamples` | `n_samples`, `n_successes`, `aggregation`, `candidates`, `aggregation_outcome`, `vote_distribution`, `vote_winning_count`, `vote_total`, `vote_degenerate` |
| `as_human_input_outcome()` | `human_input` | `HumanInputOutcome` | `status`, `request_id`, `elapsed_seconds`, `value`, `actor_id`, `responded_at`, `provenance`, `redacted`, `error_message` |
| `as_skill_output()` | `agent_skill` | `SkillOutput` | `skill_name`, `execution_mode`, `output_files`, `parsed_output`, `iterations` |
| `as_wait_outcome()` | `wait` | `WaitOutcome` | `trigger`, `elapsed_seconds`, `name`, `payload` |
| `as_map_outcome()` | `map` | `MapOutcome` | `items`, `total_items`, `completed_items`, `failed_items` |
| `as_code_execution_outcome()` | `code` | `CodeExecutionOutcome` | см. [Code-шаг](/ru/carl/steps/code/) |

Все модели импортируются из `mmar_carl`. `SupervisorDecision`,
`DebateTranscript`, `ParallelSamples` и `SkillOutput` сохраняют незнакомые ключи
(`extra="allow"`). Например, ключи судьи в parallel sampling (`judge_reply`,
`judge_selected_index`, `judge_error`) доступны через `samples.model_extra`.
`HumanInputOutcome`, `WaitOutcome` и `MapOutcome` — строгие модели. У handoff
типизированного представления нет: читайте `result_data["sub_result"]`,
`["sub_chain_success"]` и `["steps_executed"]` напрямую.

## Шина событий

Шаг может ждать именованное событие вместо числовых `dependencies` или вместе с ними.

```python
# Producer: any code that holds the context (a tool, a callback, a host)
context.emit_event("error_detected", {"code": 503})

# Consumer: a step gated on the event
LLMStepDescription(
    number=5,
    title="Handle error",
    aim="React to the detected error.",
    triggered_by=["error_detected"],
)
```

- Шаг с `triggered_by` готов к запуску, только когда **все** перечисленные события
  уже произошли **и** выполнены его числовые `dependencies`.
- Payload читается через [`$event.<name>`](/ru/carl/chains/dynamic-references/).
  Если событие отправили повторно, действует последний payload.
- Событие срабатывает сразу и живёт в пределах процесса. Параллельные ветки делят
  одну шину. Если шаг-отправитель потом упадёт, событие не откатывается.
- Если ни один шаг не может стартовать из-за неслучившегося события, исполнитель
  выбрасывает `ValueError("Deadlock detected: ...")` со списком таких событий.
- `to_dict()` сохраняет `triggered_by`, `from_dict()` его восстанавливает.

Чтобы остановиться внутри шага до прихода события, используйте
[Wait-шаг](/ru/carl/steps/wait/) с условием по событию.
