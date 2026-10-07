---
title: Human-in-the-Loop
description: Запрос одного текстового ответа у человека через типизированный провайдер в том же процессе; любой не-ответ — явный сбой.
sidebar:
  order: 6
---

`HumanInputStepDescription` отправляет один типизированный текстовый запрос
провайдеру, которого хост ставит в контекст, и ждёт типизированный ответ. Успехом
считается только проверенный ответ. Нет провайдера, истёк таймаут, прогон отменён,
ответ некорректен — каждый такой случай даёт явный неуспешный исход. CARL никогда
не подставляет ответ по умолчанию.

Провайдер работает в том же процессе, что и цепочка. Webhook или другого сетевого
транспорта для ввода человека в CARL нет. Если ответ приходит извне, мост к нему
строит ваш провайдер.

## Контракт провайдера

```python
from mmar_carl import HumanInputRequest, HumanInputResponse

async def provider(request: HumanInputRequest) -> HumanInputResponse:
    value = await show_in_my_ui(request.prompt)   # your UI, queue or chat bridge
    return HumanInputResponse(
        request_id=request.request_id,   # must echo the request id
        value=value,
        actor_id="user-42",
    )

context.on_human_input_requested = provider
```

- Провайдер получает `HumanInputRequest` с полями `request_id`, `step_number`,
  `step_title`, `kind="text"`, `prompt`, `min_length`, `max_length`, `sensitive` и
  `deadline` (с часовым поясом или `None`, если таймаута нет).
- Возвращает `HumanInputResponse` (или словарь, который в него валидируется):
  `request_id`, `value` (до 65 536 символов), необязательный `actor_id`,
  `responded_at` (по умолчанию текущее время в UTC) и `provenance` (JSON, до 8 КиБ).
- Обычная функция тоже подходит, но она должна вернуть ответ сразу. Асинхронный
  провайдер сам отвечает за ожидание. Задачу провайдера, таймаут и очистку при
  отмене ведёт CARL.

## Пример

Рабочая цепочка без LLM-вызовов: человек одобряет или отклоняет, затем инструмент
действует по ответу из памяти. Провайдер здесь — заглушка, которая всегда одобряет.

```python
import asyncio

from mmar_carl import (
    HumanInputRequest,
    HumanInputResponse,
    HumanInputStepConfig,
    HumanInputStepDescription,
    LLMClientBase,
    ReasoningChain,
    ReasoningContext,
    ToolStepConfig,
    ToolStepDescription,
)


class NoLLM(LLMClientBase):
    """The chain below makes no LLM calls; ReasoningContext still wants a client."""

    async def get_response(self, prompt: str) -> str:
        raise RuntimeError("no LLM calls expected")

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


def publish_or_discard(decision: str) -> str:
    return "published" if decision.strip().lower() == "approve" else "discarded"


chain = ReasoningChain(steps=[
    HumanInputStepDescription(
        number=1,
        title="Approve the post",
        config=HumanInputStepConfig(
            prompt="Reply 'approve' to publish, anything else to discard.",
            timeout=300,
            min_length=1,
            max_length=64,
            output_memory_key="decision",
        ),
    ),
    ToolStepDescription(
        number=2,
        title="Publish or discard",
        dependencies=[1],
        config=ToolStepConfig(
            tool_name="publish_or_discard",
            input_mapping={"decision": "$memory.human_input.decision"},
        ),
    ),
])


async def provider(request: HumanInputRequest) -> HumanInputResponse:
    # A real host shows request.prompt in its UI and waits for the user.
    print("asked:", request.prompt)
    return HumanInputResponse(
        request_id=request.request_id,  # must echo the request id
        value="approve",
        actor_id="reviewer@example.com",
    )


async def main() -> None:
    context = ReasoningContext(outer_context="Draft post", api=NoLLM())
    context.register_tool("publish_or_discard", publish_or_discard)
    context.on_human_input_requested = provider

    result = await chain.execute_async(context)

    outcome = result.step_results[0].as_human_input_outcome()
    print(outcome.status, outcome.value, outcome.actor_id)  # answered approve reviewer@example.com
    print(result.step_results[1].result)                     # published


asyncio.run(main())
```

В репозитории есть более длинный
[пример human-in-the-loop](https://github.com/Glazkoff/carl/blob/main/examples/agents/human_in_the_loop_example.py)
(без API-ключа). Там же показаны таймаут, отсутствие провайдера и явный
«поддельный человек» для тестов.

## HumanInputStepConfig

Неизвестные поля отклоняются.

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `prompt` | `"Please provide input:"` | Текст для человека. Обрезается по краям, не может быть пустым, до 8192 символов. |
| `prompt_input_mapping` | `{}` | Имя → ссылка (`$memory...`, `$history[...]`, `$outer_context...`). Значения добавляются к промпту блоком `Context (JSON):`. |
| `timeout` | `None` | Сколько секунд ждать, `> 0` и конечное число. `None` — ждать без ограничения. |
| `min_length` | `0` | Минимальная длина ответа, `>= 0`. |
| `max_length` | `4096` | Максимальная длина ответа, от 1 до 65 536. Не меньше `min_length`. |
| `sensitive` | `False` | Не показывать ответ в результате шага и в истории. Требует `output_memory_key`. |
| `output_memory_key` | `None` | Записать ответ в `$memory.human_input.<key>`. Обрезается по краям, не пустой, до 256 символов. |

Поля `fallback_value` больше нет, попытка его передать даёт ошибку валидации. Старый
JSON цепочки с этим полем чистит `ReasoningChain.migrate()`: поле удаляется,
выдаётся предупреждение.

## Исходы

Исход читается через `step_result.as_human_input_outcome()`. Метод возвращает
`HumanInputOutcome` с полями `status`, `request_id`, `elapsed_seconds`, `value`,
`actor_id`, `responded_at`, `provenance`, `redacted`, `error_message`.

| `status` | Когда | Шаг |
| --- | --- | --- |
| `answered` | Ответ прошёл валидацию, `request_id` совпал, длина в пределах. | успех |
| `unavailable` | `context.on_human_input_requested` не задан. | сбой |
| `timed_out` | Ответа не было до `timeout`. | сбой |
| `cancelled` | Прогон отменён до или во время ожидания. | сбой, `skipped=True` |
| `invalid_response` | Ответ не валидируется, у него чужой `request_id` или длина вне пределов. | сбой |
| `failed` | Провайдер выбросил исключение. | сбой |

Успех только один — `answered`. При остальных статусах в память и историю ничего
не пишется. Следующий шаг не спутает таймаут с одобрением. Для пакетных задач и
тестов ставьте явный провайдер-заглушку.

## Куда попадает ответ

- `step_result.result`: текст ответа.
- История: одна запись шага с ответом (`Human input (answered): <value>`, если язык
  контекста английский).
- Память: `$memory.human_input.<output_memory_key>`, если ключ задан.

Дальше по ответу можно ветвиться [условным шагом](/ru/carl/steps/conditional/) или
передать его в инструмент, как в примере выше.

### Чувствительный ввод

При `sensitive=True` исходный ответ пишется **только** в
`$memory.human_input.<output_memory_key>`. Результат шага равен `[redacted]`, в
истории тоже `[redacted]`. У исхода `redacted=True`, `value` нет, `provenance`
пустой. Защищать и очищать этот ключ памяти должно ваше приложение.

:::note
`HumanInputStepConfig` также принимается как `step_config` у устаревшего
`StepDescription(step_type=StepType.HUMAN_INPUT, ...)`. Значит, цепочки в старом
формате шагов тоже могут содержать шаг ввода человека.
:::

## См. также

- [Условные шаги](/ru/carl/steps/conditional/): ветвление по ответу.
- [Wait-шаг](/ru/carl/steps/wait/): пауза до времени или события, а не до ответа человека.
- [Управление прогоном](/ru/carl/chains/run-controls/): отмена прогона, который ждёт ввода.
