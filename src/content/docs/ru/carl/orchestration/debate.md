---
title: Debate
description: Дискуссия именованных ролей по кругу и один вызов судьи в конце.
sidebar:
  order: 4
---

`DebateStepDescription` проводит дискуссию по кругу. В каждом раунде каждая роль
делает один LLM-вызов и видит тему и всю стенограмму на этот момент. После
последнего раунда судья превращает стенограмму в вердикт.

```python
from mmar_carl import DebateStepConfig, DebateStepDescription, LLMStepConfig

DebateStepDescription(
    number=1,
    title="Debate the proposal",
    config=DebateStepConfig(
        roles=["optimist", "skeptic"],
        role_prompts={
            "optimist": "Round {round}. Argue for the proposal: {task}\n\n{transcript}",
            "skeptic": "Round {round}. Argue against the proposal: {task}\n\n{transcript}",
        },
        rounds=3,
        judge_prompt="Topic: {task}\n\nDebate:\n{transcript}\n\nState the strongest conclusion.",
        judge_llm_config=LLMStepConfig(model="openai/gpt-4o"),
        stop_when_unchanged=1,
        output_memory_key="verdict",
    ),
)
```

## DebateStepConfig

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `roles` | обязательное | Имена ролей в порядке ходов, минимум 2. Ими подписана стенограмма. |
| `role_prompts` | `{}` | Шаблон для роли с `{task}`, `{role}`, `{round}`, `{transcript}`. Роль без шаблона получает встроенную нейтральную инструкцию. |
| `rounds` | `2` | Число раундов, `>= 1`. |
| `task_source` | `"$outer_context"` | Ссылка на тему. Нестроковые значения кодируются в JSON. |
| `judge_prompt` | обязательное | Шаблон вызова судьи с `{task}` и `{transcript}`. |
| `output_memory_key` | `""` | Ключ в памяти родителя для вердикта. Пустая строка отключает запись. |
| `output_namespace` | `"debate"` | Пространство имён для `output_memory_key`. |
| `llm_config` | `None` | Модель для всех ролей и для судьи, если не переопределено. |
| `role_llm_configs` | `{}` | `LLMStepConfig` для отдельных ролей. |
| `judge_llm_config` | `None` | Модель только для судьи. Если не задана, берётся `llm_config`. |
| `stop_when_unchanged` | `None` | Остановиться после стольких раундов подряд, в которых каждая роль повторила свой прошлый аргумент. Сравнение идёт после схлопывания пробелов и приведения регистра. `None` выключает. |
| `convergence_predicate` | `None` | Функция `(transcript: list[dict]) -> bool`, вызывается после каждого раунда. `True` останавливает дискуссию. Исключения пишутся в лог и считаются `False`. Не сериализуется. |

Шаблоны проходят через `str.format`, поэтому фигурные скобки в тексте пишут как `{{` и `}}`.

## Стоимость

Шаг делает `len(roles) * rounds_executed + 1` LLM-вызовов. Без ранней остановки
`rounds_executed == rounds`. Оба критерия остановки по умолчанию выключены.

## Результат

`step_result.result` — вердикт. Типизированное представление:

```python
t = step_result.as_debate_transcript()
t.verdict
t.transcript            # list[DebateTurn]: round, role, argument
t.rounds_executed       # rounds that actually ran
t.rounds_configured     # the configured budget
t.role_call_count       # len(transcript)
t.converged             # True if an early-stop criterion fired
t.convergence_reason    # human-readable reason, or None
```

Через `context.on_step_event` шаг отправляет внутришаговые события:
`debate.round_started`, `debate.turn_argument` на каждый ход и `debate.converged`
при ранней остановке. Отмена прогона проверяется между раундами.

Любое исключение в вызове роли или судьи роняет шаг. Запасного вердикта нет.

:::tip
Разные модели для ролей (`role_llm_configs`) и отдельная модель судьи
(`judge_llm_config`) дают более независимые точки зрения, чем одна модель во всех
ролях.
:::

## См. также

- [Parallel sampling](/ru/carl/orchestration/parallel-sampling/): независимые ответы и голосование вместо спора.
