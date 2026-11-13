---
title: Шаг Decision
description: Задать decision-модели типизированные вопросы (predicate, choice, score) об одном состоянии и направить цепочку по ответам.
sidebar:
  order: 24
---

`DecisionStepDescription` (`step_type: "decision"`, появился в 0.5.1) задаёт
**decision-модели** типизированные вопросы об одном состоянии и получает
типизированные ответы, а не текст. Decision-модели не генерируют токены. Они
читают всё состояние целиком и выбирают ответ из пространства, которое задали
вы: вероятность, одну из ваших опций или место на шкале.

Шаг делает один HTTP-запрос к провайдеру. LLM-клиент цепочки он не использует.

## Провайдеры

| `provider` | Эндпоинт | Примеры моделей |
| --- | --- | --- |
| `openai` (по умолчанию) | `POST https://api.openai.com/v1/decisions` | `gpt-6-luna` |
| `azure_openai` | `POST {base_url}/decisions`, заголовок `api-key`; `base_url` обязателен | имя вашего деплоя |
| `openrouter` | `POST https://openrouter.ai/api/alpha/decisions` | `typesafe/jev-1.14`, `openai/gpt-6-luna-decisions` |

Decisions API у OpenRouter помечен как alpha. Все три адаптера возвращают
ответ одной формы в `result_data["answers"]`. В релизе 0.5.1 живые проверки шли
через OpenRouter, у прямых адаптеров OpenAI и Azure только офлайн-тесты.

## Типы вопросов

| `type` | Что вы задаёте | Итоговое `value` |
| --- | --- | --- |
| `predicate` | `instructions`, `threshold` (по умолчанию `0.5`) | `True`, если вероятность ≥ `threshold` |
| `choice` | `choices`: 2–255 штук `DecisionChoice(value, description)` | одно из значений опций |
| `score` | `levels`: 2–10 штук `DecisionLevel(label, description)`, от низшего | индекс уровня, взвешенный по вероятностям (`float`) |

При загрузке цепочки `noul` принимается как синоним `predicate`. Картинки не
поддерживаются: состояние это текст или JSON.

## Пример

```python
from mmar_carl import (
    ConditionalBranch, ConditionalStepConfig, ConditionalStepDescription,
    DecisionChoice, DecisionQuestion, DecisionStepConfig, DecisionStepDescription,
    ReasoningContext,
)

triage = DecisionStepDescription(
    number=1,
    title="Triage ticket",
    config=DecisionStepConfig(
        provider="openrouter",
        model="typesafe/jev-1.14",          # закрепите версию, см. «Пороги»
        state_source="$outer_context",
        questions=[
            DecisionQuestion(
                name="department",
                type="choice",
                instructions="Which department should handle this ticket?",
                choices=[
                    DecisionChoice(value="billing", description="Payments and refunds."),
                    DecisionChoice(value="other", description="Everything else."),
                ],
                min_confidence=0.7,
                fallback="other",
            ),
            DecisionQuestion(
                name="urgent",
                type="predicate",
                instructions="Is the customer blocked right now?",
                threshold=0.8,
            ),
        ],
        output_memory_key="ticket",         # → $memory.decision.ticket
    ),
)

route = ConditionalStepDescription(
    number=2,
    title="Route",
    dependencies=[1],
    config=ConditionalStepConfig(
        condition_context_key="$memory.decision.ticket",
        branches=[ConditionalBranch(condition="value['department'] == 'billing'", next_step=3)],
        default_step=4,
    ),
)

context = ReasoningContext(
    outer_context=ticket_text,
    api=client,
    decision_endpoints={
        "openrouter": ("https://openrouter.ai/api/alpha/decisions", "OPENROUTER_API_KEY"),
    },
)
```

Шаги 3 и 4 это два обработчика. В памяти окажется
`{"department": "billing", "urgent": True}`, по одному итоговому значению на
вопрос.

## Разрешение хоста и ключи

Хост должен разрешить каждого провайдера в `ReasoningContext.decision_endpoints`:
провайдер → `(URL запроса, имя переменной окружения с ключом)`. URL включает
финальный путь `/decisions`. Шаг проверяет разрешение до того, как читать ключ
или отправлять состояние. Без него шаг падает с
`decision endpoint and credential are not authorized by the host`.

`decision_endpoints` существует только во время выполнения и никогда не
пишется в JSON цепочки, как и сам ключ. `api_key_env` по умолчанию равен
`OPENAI_API_KEY`, `AZURE_OPENAI_API_KEY` или `OPENROUTER_API_KEY` в зависимости
от провайдера; значение, похожее на ключ, а не на имя переменной, отклоняется.
`base_url` должен быть https (обычный http только для localhost), без учётных
данных, query и fragment.

`chain.preflight(context)` перечисляет имена переменных в
`required_decision_credentials`, а незаданные в `missing_decision_credentials`.
Только имена, никогда не значения.

## DecisionStepConfig

Неизвестные поля модель отклоняет.

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `provider` | `str` | `"openai"` | `openai`, `azure_openai` или `openrouter`. |
| `model` | `str` | обязательное | Id decision-модели или имя деплоя Azure. |
| `questions` | `list[DecisionQuestion]` | обязательное | 1–400 вопросов с уникальными именами, все про одно состояние. |
| `state_source` | `str \| None` | `None` | Ссылка `$` на состояние. Если `state_template` не задан, по умолчанию `$outer_context`. Словари и списки остаются структурированными, где провайдер принимает JSON. |
| `state_template` | `str \| None` | `None` | Шаблон `str.format`, который рендерится с `input_mapping` в текстовое состояние. Взаимоисключающее с `state_source`. |
| `input_mapping` | `dict[str, str]` | `{}` | Плейсхолдер → источник для `state_template` (не больше 32). Правила те же, что у шага Codex. |
| `primary_question` | `str \| None` | `None` | Вопрос, чьё значение становится `result` шага. По умолчанию первый. |
| `fail_on_uncertain` | `bool` | `True` | Падать, если ответ — отказ или ниже `min_confidence`, а `fallback` нет. |
| `base_url` | `str \| None` | `None` | Переопределение базы эндпоинта (`/decisions` дописывается). Обязателен для `azure_openai`. |
| `api_key_env` | `str \| None` | `None` | Переменная окружения с ключом (при `None` берётся умолчание провайдера). |
| `timeout` | `float` | `30.0` | Таймаут запроса, (0, 600] с. |
| `max_retries` | `int` | `2` | Повторы на 408, 429, 5xx и сетевых ошибках, 0–5, с backoff и `Retry-After`. |
| `max_state_bytes` | `int` | `262144` | Лимит размера сериализованного состояния (1 KiB – 4 MiB), проверяется до запроса. |
| `output_memory_key` | `str \| None` | `None` | Записать `{вопрос: итоговое значение}` в память. |
| `output_namespace` | `str` | `"decision"` | Пространство для `output_memory_key`. |

Поля `DecisionQuestion`: `name` (идентификатор Python; модель не видит в нём
смысла, поэтому смысл пишите в `instructions`), `type`, `instructions`,
`choices`, `levels`, `threshold` (только predicate), `min_confidence` (только
choice и score), `fallback` (значение опции или bool для predicate; у score
его нет).

## Результат

- `result`: итоговое значение главного вопроса текстом. Запись истории
  добавляет однострочную сводку по всем ответам.
- `result_data`: `provider`, `requested_model`, `model` (снимок, который
  реально отдал провайдер), `request_id`, `primary_question`, `decision`,
  `answers`, `uncertain_questions`, `usage`, `cost_usd` (если провайдер его
  сообщает).
- `result_data["answers"][name]`: `type`, `value`, `probabilities`,
  `confidence`, `refused`, `uncertain`, `fallback_applied`, плюс `probability`,
  `choice` или `score` / `level` по типу.
- `token_usage`: счётчики от провайдера, если есть.

## Политика сбоев

Шаг падает (fail-closed), когда:

- нет разрешения или ключа, состояние пустое или больше `max_state_bytes`;
- провайдер вернул HTTP-ошибку после повторов (ошибки авторизации и валидации
  не повторяются). Тела ошибок провайдера в `error_message` не попадают;
- ответ кривой: неизвестная опция, вероятность вне [0, 1], оценка вне
  диапазона уровней, тело не JSON;
- ответ неуверенный (отказ, отсутствует или ниже `min_confidence`), а у вопроса
  нет `fallback`, если только не выставлен `fail_on_uncertain=False`.

С `fallback` неуверенный ответ заменяется и помечается `fallback_applied=True`.
С `fail_on_uncertain=False` он остаётся (отказ становится `None`) и помечается
`uncertain=True`.

## Пороги

Вероятности и уверенность у разных моделей откалиброваны по-разному и гуляют
на несколько сотых между запусками. Подбирайте `threshold` и `min_confidence`
на размеченных примерах для той модели, которую закрепили, ставьте полосы, а
не точные значения, и подбирайте заново после смены модели или провайдера.
Поэтому `result_data["model"]` и записывает снимок, который отдал провайдер.

## Тесты без сети

`DecisionStepExecutor` принимает `httpx`-транспорт. Зарегистрируйте его с
заготовленным ответом, чтобы прогнать цепочку без сети:

```python
import httpx
from mmar_carl import DecisionStepExecutor, StepType, register_executor

canned = {"answers": {
    "department": {"type": "choice", "choice": "billing",
                   "probabilities": {"billing": 0.9, "other": 0.1}, "confidence": 0.9},
    "urgent": {"type": "noul", "noul": 0.9},
}}
transport = httpx.MockTransport(lambda request: httpx.Response(200, json=canned))
register_executor(StepType.DECISION, DecisionStepExecutor(transport=transport))
```

Это форма ответа OpenRouter. Переменная с ключом всё равно должна быть задана, а
эндпоинт разрешён. Пример
[`decision_step_example.py`](https://github.com/AIRI-MAESTRO/carl/blob/v0.5.2/examples/agents/decision_step_example.py)
в репозитории работает так же, когда ключа нет.

## Ограничения

- Все вопросы шага видят одно и то же состояние. Если вопрос зависит от
  предыдущего ответа, вынесите его в следующий шаг.
- Воспроизведение трассы исполнения decision-шаги не поддерживает.
- Тип шага появился в формате 14. Читатель старше 0.5.1 отклоняет формат 14 и
  новее с `ChainFormatNewerError`.

## См. также

- [Условный шаг](/ru/carl/steps/conditional/): маршрутизация по `$memory.decision.<key>`.
- [Структурированный вывод](/ru/carl/steps/structured-output/): когда нужен сгенерированный JSON, а не типизированное суждение.
- [Preflight](/ru/carl/care-integration/preflight/)
