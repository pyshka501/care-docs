---
title: Шаг планирования команды
description: LLM выбирает типизированные аргументы для capability, которой владеет хост; план исполняет подтверждённый CommandStep.
sidebar:
  order: 15
---

`CommandPlanStepDescription` просит LLM выбрать **одну** capability команды и заполнить
её аргументы. Модель выбирает только аргументы. Она никогда не задаёт программу,
префикс argv, рантайм, режим сети или лимиты ресурсов. Сам шаг ничего не запускает.

Следующий [`CommandStep`](/ru/carl/steps/command/) с `plan_source` заново проверяет план
и исполняет его. Запланированные команды всегда требуют подтверждения хоста.

Кто чем владеет:

| В JSON цепочки | Только в процессе хоста |
| --- | --- |
| `instruction`, запрошенные `capability_ids`, `input_mapping` планировщика | `CommandCapabilityRegistry`: id, схемы аргументов, программы, статические аргументы, построители argv |
| `plan_source`, `planned_capability_ids` у CommandStep | `CommandPolicy` и колбэк подтверждения |

`chain.to_dict()` реестр не выводит. Поле контекста `command_capability_registry`
исключено из сериализации.

## Минимальный пример

Клиент-заглушка ниже заменяет настоящую модель.

```python
import asyncio
import json

from pydantic import BaseModel, ConfigDict, Field

from mmar_carl import (
    CommandApprovalRequest,
    CommandCapability,
    CommandCapabilityRegistry,
    CommandPlanStepConfig,
    CommandPlanStepDescription,
    CommandPolicy,
    CommandStepConfig,
    CommandStepDescription,
    LLMClientBase,
    ReasoningChain,
    ReasoningContext,
)


class EchoArgs(BaseModel):
    model_config = ConfigDict(extra="forbid")  # required by CommandCapability
    text: str = Field(min_length=1, max_length=80)


registry = CommandCapabilityRegistry(
    [
        CommandCapability(
            capability_id="text.echo",
            description="Echo one short line",
            executable="/bin/echo",
            static_args=(),
            argument_model=EchoArgs,
            argv_builder=lambda args: [args.text],  # pure, no I/O
            revision="r1",
        )
    ]
)


class StubPlanner(LLMClientBase):
    """Stands in for a real model in this example."""

    async def get_response(self, prompt: str) -> str:
        return json.dumps({"capability_id": "text.echo", "arguments": {"text": "hello"}})

    async def get_response_with_retries(self, prompt: str, retries: int = 3) -> str:
        return await self.get_response(prompt)


chain = ReasoningChain(
    steps=[
        CommandPlanStepDescription(
            number=1,
            title="Plan",
            config=CommandPlanStepConfig(
                instruction="Greet the user.",
                capability_ids=["text.echo"],
            ),
        ),
        CommandStepDescription(
            number=2,
            title="Run the approved plan",
            dependencies=[1],
            config=CommandStepConfig(
                plan_source="$steps.1.result_data.plan",
                planned_capability_ids=["text.echo"],
                runtime="local",
                network="host",
            ),
        ),
    ]
)


def approve(request: CommandApprovalRequest) -> bool:
    print(request.source, request.capability_id, request.capability_revision, request.argv)
    return True  # a real host asks a person


context = ReasoningContext(
    outer_context="",
    api=StubPlanner(),
    command_capability_registry=registry,
    command_policy=CommandPolicy(
        allowed_executables=frozenset({"/bin/echo"}),
        allowed_runtimes=frozenset({"local"}),
        allowed_networks=frozenset({"host"}),
        allow_planned_local=True,  # planned commands on the host are off by default
    ),
    on_command_approval_requested=approve,
)
result = asyncio.run(chain.execute_async(context))
print(result.step_results[0].result_data["plan"])
print(result.step_results[1].result)  # "hello\n"
```

Колбэк печатает `planned text.echo r1 ('/bin/echo', 'hello')`, шаг 2 печатает `hello`.
Герметичный вариант с записывающим рантаймом (вообще без подпроцесса):
[`examples/orchestration/command_plan_capabilities_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/command_plan_capabilities_example.py).

## CommandPlanStepConfig

Лишние поля в конфиге запрещены.

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `instruction` | `str` | — (обязательно) | Задача для планировщика. От 1 до 16 000 символов, без NUL. |
| `capability_ids` | `list[str]` | — (обязательно) | Из каких capability может выбирать модель. От 1 до 32 уникальных id по шаблону `[A-Za-z][A-Za-z0-9_.-]{0,127}`. Каждый должен быть в реестре. |
| `input_mapping` | `dict[str, str]` | `{}` | До 32 именованных ссылок на контекст, которые попадают в промпт как JSON. Ссылка, давшая `None`, роняет шаг. |

У `CommandPlanStepDescription` есть ещё:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `llm_config` | `LLMStepConfig \| None` | `None` | Своя LLM для шага. |
| `retry_max` | `int \| None` | `None` | От 1 до 10. Если не задано, берётся `context.retry_max`. |
| `timeout` | `float` | `30.0` | Таймаут вызова планировщика, не больше 300 секунд. |

Шаг нельзя кэшировать: реестр, от которого он зависит, есть только во время выполнения.

## Capability и реестр

`CommandCapability` — замороженный dataclass:

| Поле | Смысл |
| --- | --- |
| `capability_id` | Id, который выбирает модель. |
| `description` | Описание, которое видит модель. |
| `executable` | Программа. Правила точного совпадения те же, что в `CommandPolicy` (абсолютный путь для `local`/`firejail`). |
| `static_args` | Фиксированный префикс argv после программы (кортеж). |
| `argument_model` | Pydantic-модель с `ConfigDict(extra="forbid")`. Её JSON-схему видит модель. |
| `argv_builder` | Доверенная функция хоста: проверенная модель → динамический хвост argv. Должна быть чистой и детерминированной: подтверждение смотрит на её результат до запуска. |
| `revision` | Ваша метка версии, например `"r1"`. |

`capability.fingerprint` — SHA-256 от id, описания, программы, статических аргументов,
ревизии и схемы аргументов. Любое их изменение меняет fingerprint.

`CommandCapabilityRegistry(capabilities, max_prompt_bytes=128_000,
max_input_value_bytes=32_000, max_response_bytes=64_000)` хранит capability. Лимиты
ограничивают промпт планировщика, каждое входное значение и ответ модели.

Модель видит только `capability_id`, `description` и `arguments_schema` для
запрошенных id. Промпт требует один JSON-объект ровно с ключами `capability_id` и
`arguments`.

## Запись плана

Ответ модели строго разбирается как `CommandPlanEnvelope` (лишние ключи, например
`executable`, отклоняются). Затем `registry.validate_plan()` строго проверяет аргументы
по `argument_model` и привязывает происхождение. Получается `CommandPlanRecord`:

```python
{
    "capability_id": "text.echo",
    "capability_revision": "r1",
    "capability_fingerprint": "f0c2514c…",
    "arguments": {"text": "hello"},
    "arguments_sha256": "cbbbdcd2…",
}
```

### Результат

`result` — запись в виде JSON. В `result_data`: `plan` (dict записи),
`capability_id`, `capability_revision`, `capability_fingerprint` и `arguments_sha256`.
Запись в истории называет выбранную capability.

## Исполнение плана

Запланированный `CommandStep` задаёт:

- `plan_source` — `$steps.<N>.result_data.plan` или `$metadata.<key>` для записи,
  которую передал хост.
- `planned_capability_ids` — какие id принимает этот шаг. Сужает реестр, но никогда
  не расширяет. Обязателен вместе с `plan_source`.
- Без `command` и без `input_mapping`. Типизированные значения идут через план.

При исполнении CARL:

1. Заново проверяет запись по текущему реестру: ревизия, fingerprint и
   `arguments_sha256` должны совпасть. Изменённая capability роняет шаг.
2. Проверяет `CommandPolicy` только по программе и статическому префиксу. Отклонённый
   план не вызывает построитель argv.
3. Один раз вызывает `argv_builder` и снова проверяет политику по итоговому argv.
4. Всегда просит подтверждение. У `CommandApprovalRequest` будет `source="planned"` и
   поля `capability_id`, `capability_revision`, `capability_fingerprint`,
   `arguments_sha256`.

В `result_data` CommandStep тогда есть `command_source="planned"`, id, ревизия и
fingerprint capability и `resolved_argument_count`. См.
[Command-шаг](/ru/carl/steps/command/#результат).

## Политика

- `CommandPolicy.require_approval_for_planned` имеет тип `Literal[True]`. Передача
  `False` даёт ошибку валидации. Без колбэка подтверждения запланированная команда
  падает.
- `CommandPolicy.allow_planned_local` по умолчанию `False`: запланированные команды на
  `local` запрещены, пока хост явно их не разрешит.
- Остальные правила политики (точные программы, рантаймы, сети, потолки) действуют
  так же, как для статических команд.

## Повтор (replay)

`chain.replay(...)` не доверяет сохранённому плану. Каждая записанная
`CommandPlanRecord` заново проверяется по текущему реестру. Если capability
изменилась, replay бросает `trace step <N> command capability changed; re-plan required`.
Без реестра replay тоже бросает ошибку.

## Сбои

| Ситуация | Шаг | `error_message` |
| --- | --- | --- |
| В контексте нет реестра | plan | `command planning requires a host-owned CommandCapabilityRegistry` |
| Неизвестный id, слишком большой вход или промпт | plan | `failed to build command plan request: <detail>` |
| В ответе модели лишние ключи, неверные типы, неизвестная capability | plan | `command planner returned an invalid typed plan (<ExceptionType>)` (сырой ответ не выводится) |
| Планировщик не уложился во время | plan | `command planning timed out after <timeout>s` |
| Шаг плана упал, ссылка пустая | command | `failed to build runtime invocation: plan_source resolved to no value` |
| Ревизия или fingerprint в реестре изменились | command | `failed to build runtime invocation: command plan record failed validation (ValueError)` |
| Запланированная команда на `local` без разрешения | command | `command denied by application policy: LLM-planned host execution is not allowed` |
| Нет колбэка подтверждения или он отказал | command | `command was not approved by the application host` |
| `argv_builder` бросил исключение | command | `failed to materialize validated command plan (<ExceptionType>)` |

Прочие сбои (таймауты, ненулевой код выхода, пробелы строгого режима) такие же, как у
[статических команд](/ru/carl/steps/command/#сбои).

## Ограничения

- Одна capability на план. Для нескольких команд нужно несколько пар план/команда.
- Модель всё равно может выбрать вредные *значения* в рамках схемы. Сужайте модель
  аргументов (длины, enum, шаблоны) и проверяйте запрос в колбэке подтверждения.
- Реестр не сохраняется. Чтобы исполнить или повторить сохранённый план, хост должен
  собрать реестр заново с теми же ревизиями.

## См. также

- [Command-шаг](/ru/carl/steps/command/) — поля рантайма, `CommandPolicy`, ключи результата.
- [Shell-сессия](/ru/carl/steps/shell-session/)
- [Песочницы](/ru/carl/skills/sandbox/) — бэкенды рантайма.
