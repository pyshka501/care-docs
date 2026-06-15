---
title: LLM-шаг
description: Шаги reasoning по типу chain-of-thought — тип шага CARL по умолчанию.
sidebar:
  order: 2
---

`LLMStepDescription` — тип шага по умолчанию: шаг reasoning по типу chain-of-thought,
подкреплённый вызовом LLM.

## Поля

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `aim` | `str` | `""` (**обязательное, непустое**) | Основная цель шага. |
| `reasoning_questions` | `str` | `""` | Ключевые вопросы, на которые должен ответить шаг. |
| `stage_action` | `str` | `""` | Конкретное действие для выполнения. |
| `example_reasoning` | `str` | `""` | Пример экспертного рассуждения, которое вы хотите получить. |
| `step_context_queries` | `list[ContextQuery \| str]` | `[]` | RAG-подобные запросы, извлекающие нужный контекст из `outer_context` в промпт этого шага. |
| `llm_config` | `LLMStepConfig \| None` | `None` | Переопределение модели / temperature / режима на уровне шага. |
| `retry_max` | `int \| None` | `None` | Количество попыток для этого шага (`None` = значение по умолчанию из контекста). |
| `timeout` | `float \| None` | `None` | Таймаут шага в секундах. |

Плюс все [общие поля](/ru/carl/steps/overview/#поля-общие-для-всех-шагов).

:::tip
`aim`, `reasoning_questions`, `stage_action` и `example_reasoning` принимают
**список** так же, как и строку — список приводится к блоку `"- item\n- item"`.
Это делает цепочки, сгенерированные LLM-планировщиком, более устойчивыми.
:::

## Базовый пример

```python
from mmar_carl import LLMStepDescription

LLMStepDescription(
    number=1,
    title="Assess data quality",
    aim="Assess the quality and completeness of the input data.",
    reasoning_questions="What data patterns and anomalies are present?",
    step_context_queries=["missing values", "data consistency"],
    stage_action="Evaluate reliability and flag issues.",
    example_reasoning="High-quality data enables reliable downstream analysis.",
)
```

## Конфигурация LLM на уровне шага

Переопределите модель, температуру или другие параметры для одного шага с помощью
`LLMStepConfig`:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `model` | `str \| None` | `None` | Идентификатор модели (например, `anthropic/claude-3.5-sonnet`). |
| `temperature` | `float \| None` | `None` | 0.0–2.0. |
| `max_tokens` | `int \| None` | `None` | Ограничение вывода. |
| `timeout` | `float \| None` | `None` | Таймаут на уровне шага. |
| `token_budget_warning` | `int \| None` | `None` | Предупреждение при превышении шагом этого количества токенов. |
| `execution_mode` | `ExecutionMode` | `FAST` | `FAST` или `SELF_CRITIC`. |
| `use_message_history` | `bool` | `False` | Отправлять структурированные многоходовые сообщения вместо плоского промпта. |

```python
from mmar_carl import LLMStepDescription, LLMStepConfig

LLMStepDescription(
    number=2,
    title="Deep analysis",
    aim="Perform a rigorous analysis.",
    llm_config=LLMStepConfig(model="anthropic/claude-3.5-sonnet", temperature=0.2),
)
```

Два параметра стоит выделить отдельно:

- **`token_budget_warning`** — выдаёт предупреждение, когда суммарное число токенов
  шага превышает порог. Срабатывает только с клиентом, который сообщает об
  использовании токенов (например, `OpenAICompatibleClient`); фактические значения
  см. в разделе [оценка стоимости](/ru/carl/tracing/cost/).
- **`use_message_history`** — отправляет структурированный список сообщений
  `system`/`user`/`assistant` вместо плоского промпта: системный промпт и внешний
  контекст становятся первым сообщением `system`, предыдущие ходы из
  `context.messages` включаются в запрос, а ответ шага дописывается обратно в
  `context.messages`. Требует клиента, реализующего `get_response_with_messages`
  (например, `OpenAICompatibleClient`).

## Режимы выполнения

- **`FAST`** (по умолчанию) — один проход LLM.
- **`SELF_CRITIC`** — шаг генерирует ответ, прогоняет его через одного или нескольких
  оценщиков и перегенерирует до `self_critic_max_revisions` раз, пока оценщики не одобрят.

```python
from mmar_carl import ExecutionMode

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm"],
    self_critic_max_revisions=2,
    self_critic_instruction="Reject answers that aren't backed by the data.",
)
```

`self_critic_evaluators` перечисляет оценщиков по порядку; одобрить должны **все**.
`"llm"` — встроенный LLM-рецензент. Зарегистрируйте собственный (не-LLM или
кастомный) оценщик через `context.register_self_critic_evaluator(name, evaluator)` —
унаследуйтесь от `SelfCriticEvaluatorBase` и верните
`SelfCriticDecision(verdict=..., review_text=...)`.

### Пример

[Пример режимов выполнения](https://github.com/Glazkoff/carl-experiments/blob/main/examples/orchestration/execution_modes_mock_example.py)
из репозитория (mock-клиент, без API-ключа) запускает цепочку из 3 шагов: проход
`FAST`, шаг `SELF_CRITIC` со встроенным оценщиком `"llm"` и шаг `SELF_CRITIC`, в
цепочку оценщиков которого добавлена кастомная проверка на ключевое слово.

```python
class KeywordGuardEvaluator(SelfCriticEvaluatorBase):
    def __init__(self, required_keyword: str):
        self.required_keyword = required_keyword.lower()

    async def evaluate(self, step, candidate, base_prompt, context, llm_client, retries):
        if self.required_keyword in candidate.lower():
            return SelfCriticDecision(verdict="APPROVE", review_text="found")
        return SelfCriticDecision(verdict="DISAPPROVE", review_text="missing keyword")

context.register_self_critic_evaluator("keyword_guard", KeywordGuardEvaluator("mitigation"))

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm", "keyword_guard"],  # both must approve
    self_critic_max_revisions=2,
)
```

Телеметрия режима по каждому шагу (`execution_mode`, `llm_calls`, число ревизий
`rounds`, `quality_warning`) попадает в
`context.metadata["execution_mode_details"]`.

## Смотрите также

- [Динамические ссылки](/ru/carl/chains/dynamic-references/) — связывание выводов шагов между собой.
- [Извлечение контекста](/ru/carl/concepts/what-is-carl/#rag-извлечение-контекста) — как работает `step_context_queries`.
