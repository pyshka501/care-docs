---
title: LLM-шаг
description: Шаги рассуждения chain-of-thought, тип шага CARL по умолчанию.
sidebar:
  order: 2
---

`LLMStepDescription` является типом шага по умолчанию. Это шаг рассуждения
chain-of-thought, за которым стоит один вызов LLM (или несколько в режиме
`SELF_CRITIC`).

## Поля

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `aim` | `str` | `""` (**обязательное, непустое**) | Главная цель шага. |
| `reasoning_questions` | `str` | `""` | Ключевые вопросы, на которые шаг должен ответить. |
| `stage_action` | `str` | `""` | Конкретное действие, которое нужно выполнить. |
| `example_reasoning` | `str` | `""` | Пример экспертного рассуждения, которого вы ждёте. |
| `step_context_queries` | `list[ContextQuery \| str]` | `[]` | Запросы в духе RAG. Они вытаскивают нужный контекст из `outer_context` в промпт этого шага. |
| `llm_config` | `LLMStepConfig \| None` | `None` | Переопределение модели, температуры или режима для шага. |
| `retry_max` | `int \| None` | `None` | Число повторов вызова провайдера (`None` = `context.retry_max`). |
| `timeout` | `float \| None` | `None` | Таймаут шага в секундах, > 0 (`None` = `timeout` цепочки, если он задан). |

Плюс поля, общие для всех шагов (`number`, `title`, `dependencies`, `cache`,
`loop_back_to`, …), см. [обзор шагов](/ru/carl/steps/overview/).

:::tip
`aim`, `reasoning_questions`, `stage_action` и `example_reasoning` принимают не
только строку, но и **список**. Список превращается в блок `"- item\n- item"`.
Так цепочки, созданные LLM-планировщиком, остаются загружаемыми.
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

## Настройки LLM для шага

Модель, температуру или режим выполнения для одного шага можно переопределить
через `LLMStepConfig`:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `model` | `str \| None` | `None` | Идентификатор модели (например, `anthropic/claude-3.5-sonnet`). |
| `temperature` | `float \| None` | `None` | 0.0–2.0. |
| `max_tokens` | `int \| None` | `None` | Ограничение длины ответа. |
| `timeout` | `float \| None` | `None` | Объявлено, но исполнитель его не применяет. Используйте собственный `timeout` шага. |
| `token_budget_warning` | `int \| None` | `None` | Предупредить, когда общее число токенов шага достигнет этого значения (> 0). |
| `execution_mode` | `ExecutionMode` | `FAST` | `FAST` или `SELF_CRITIC`. |
| `self_critic_evaluators` | `list[str]` | `["llm"]` | Имена оценщиков для `SELF_CRITIC`. Одобрить должны все. |
| `self_critic_max_revisions` | `int` | `1` | Максимум раундов перегенерации (≥ 0). |
| `self_critic_instruction` | `str` | `""` | Дополнительная инструкция для встроенного оценщика `"llm"`. |
| `self_critic_disapprove_feedback` | `dict[str, str]` | `{}` | Статичный отзыв, который добавляется к заметкам для перегенерации, когда оценщик не одобряет ответ. Ключ = имя оценщика, `"*"` = любой. |
| `use_message_history` | `bool` | `False` | Отправлять структурированный многоходовой список сообщений вместо плоского промпта. |

```python
from mmar_carl import LLMStepDescription, LLMStepConfig

LLMStepDescription(
    number=2,
    title="Deep analysis",
    aim="Perform a rigorous analysis.",
    llm_config=LLMStepConfig(model="anthropic/claude-3.5-sonnet", temperature=0.2),
)
```

Как выбирается клиент (`context.get_llm_client_for_step`):

1. `llm_config` шага. Незаданные `model` / `temperature` / `max_tokens` берутся
   из `default_llm_config` цепочки (`ReasoningChain(default_llm_config=...)`).
2. Только `default_llm_config` цепочки.
3. Клиент контекста по умолчанию.

:::caution
Переопределения `model`, `temperature` и `max_tokens` работают, только если
клиент контекста является `OpenAICompatibleClient`. CARL строит производный клиент
с новыми настройками и кэширует его. С любым другим клиентом шаг молча
выполняется на клиенте по умолчанию.
:::

Ещё два поля стоит отметить отдельно:

- **`token_budget_warning`** вызывает Python `warnings.warn`, когда общее число
  токенов шага достигает порога. Срабатывает только с клиентом, который сообщает
  расход (например, `OpenAICompatibleClient`). См. [учёт стоимости](/ru/carl/tracing/cost/).
- **`use_message_history`** отправляет структурированный список сообщений
  `system`/`user`/`assistant` вместо плоского промпта. Системный промпт и внешний
  контекст становятся первым сообщением `system`. Предыдущие ходы берутся из
  `context.messages`, а ответ дописывается обратно в `context.messages`. Нужен
  клиент, реализующий `get_response_with_messages` (например,
  `OpenAICompatibleClient`). Этот путь важнее `execution_mode`: шаг с
  `use_message_history=True` делает один вызов без самокритики.

## Что записывает шаг

При успехе `StepExecutionResult` содержит:

- `result`: ответ модели. Запись истории имеет вид `Step N. Title` плюс
  `Result: ...`.
- `token_usage`: `{"prompt", "completion", "total"}`, если клиент сообщает
  расход, иначе `{}`.
- `model`: `model_name` клиента, если он есть.
- `prompt`: полностью собранный промпт, только при `context.trace_prompts=True`
  (по умолчанию выключено, потому что промпт содержит внешний контекст и историю).

Упавший шаг записывает `error_message`, но не расход токенов.

## Режимы выполнения

- **`FAST`** (по умолчанию): один проход LLM.
- **`SELF_CRITIC`**: шаг генерирует ответ и отдаёт его оценщикам из
  `self_critic_evaluators`. Затем он перегенерирует ответ с их отзывами, до
  `self_critic_max_revisions` раз, пока все не одобрят. Если бюджет кончился без
  одобрения, шаг всё равно успешен: он возвращает последний вариант и записывает
  `quality_warning`.

```python
from mmar_carl import ExecutionMode, LLMStepConfig

LLMStepConfig(
    execution_mode=ExecutionMode.SELF_CRITIC,
    self_critic_evaluators=["llm"],
    self_critic_max_revisions=2,
    self_critic_instruction="Reject answers that aren't backed by the data.",
)
```

`"llm"` это встроенный LLM-рецензент. Свой оценщик (не на LLM или особый)
регистрируется через `context.register_self_critic_evaluator(name, evaluator)`.
Унаследуйте `SelfCriticEvaluatorBase`, реализуйте `async evaluate(...)` и
верните `SelfCriticDecision(verdict=..., review_text=...)`. Любой вердикт, кроме
`"APPROVE"`, считается неодобрением. Незарегистрированное имя оценщика роняет шаг.

### Пример

[Пример режимов выполнения](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/execution_modes_mock_example.py)
в репозитории (мок-клиент, без API-ключа) запускает цепочку из 3 шагов: проход
`FAST`, шаг `SELF_CRITIC` со стандартным оценщиком `"llm"` и шаг `SELF_CRITIC`,
где к оценщикам добавлена своя проверка ключевого слова.

```python
from mmar_carl import (
    ExecutionMode, LLMStepConfig, SelfCriticDecision, SelfCriticEvaluatorBase,
)

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

Телеметрия режима по каждому шагу попадает в
`context.metadata["execution_mode_details"][str(step_number)]`: `execution_mode`,
`llm_calls`, а для `SELF_CRITIC` ещё `rounds`, `max_revisions`,
`evaluator_decisions` и `quality_warning`, если бюджет кончился.

## Известные ограничения

- Legacy `StepDescription`, преобразованный через `to_typed_step()`, сохраняет
  `llm_config`, но теряет `retry_max` и `timeout`. Если они нужны, создавайте
  `LLMStepDescription` напрямую.

## См. также

- [Динамические ссылки](/ru/carl/chains/dynamic-references/): как связывать результаты шагов.
- [Извлечение контекста](/ru/carl/concepts/what-is-carl/): как работают `step_context_queries`.
- [LLM-клиенты](/ru/carl/llm/clients/) и [пример учёта токенов](https://github.com/Glazkoff/carl/blob/main/examples/llm_inference/token_usage_example.py).
