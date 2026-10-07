---
title: Code-шаг
description: Запуск Python-кода, сгенерированного ранее в том же прогоне, с типизированными JSON-входом и выходом, в строгой песочнице, одобренной хостом.
sidebar:
  order: 13
---

`CodeStepDescription` выполняет одну Python-программу, которую создал предыдущий шаг.
Например, код, написанный LLM-шагом и сохранённый в памяти. Поведение задаётся через
`CodeStepConfig`. Шаг не вызывает LLM.

Контракт намеренно узкий:

- Программа берётся из **ссылки на контекст** и никогда из самой цепочки.
- Программа определяет ровно одну функцию, `def run(inputs)`. CARL вызывает её с одним
  JSON-объектом и ждёт в ответ одно JSON-значение.
- Вход и выход проверяются по **обязательным** схемам.
- Код выполняется только в **строгом изолированном рантайме**, который одобрило
  приложение-хост. Локального режима или режима «как получится» нет.

`CodeStep` не shell-шаг. Он никогда не берёт из цепочки исполняемый файл, argv или
shell-скрипт. Для запуска программ см. [command-шаг](/ru/carl/steps/command/).

## Контракт программы

```python
def run(inputs):
    return {"answer": inputs["value"] * 2}
```

CARL разбирает исходник перед запуском и отклоняет его (статус `invalid_source`), если
не выполнено хотя бы одно условие:

- исходник разбирается как Python;
- в нём ровно одна функция верхнего уровня с именем `run`;
- `run` — обычный `def` (не `async def`) без декораторов;
- сигнатура ровно `run(inputs)`: один параметр с именем `inputs`, без значений по
  умолчанию, без `*args`, `**kwargs` и параметров только по ключу.

CARL выполняет разрешённую строку **как есть**. Он не снимает Markdown-ограждения, не
извлекает блок кода, не чинит синтаксис и не просит модель повторить попытку. Если
генератор оборачивает код в блок с ограждением, очистите его на предыдущем шаге.

Возвращаемое значение должно быть конечным JSON: без `NaN`, без бесконечностей, без
циклов, только строковые ключи, глубина вложенности до 64.

## Минимальный пример

Этот пример запускается по-настоящему. Ему нужен Docker и Python-образ, который уже
есть локально и закреплён по дайджесту. CARL запускает Docker с `--pull=never`,
поэтому никогда не скачивает образ.

```python
import asyncio
import os

from mmar_carl import (
    CodeExecutionPolicy,
    CodeRuntimeProfile,
    CodeStepConfig,
    CodeStepDescription,
    ReasoningChain,
    ReasoningContext,
)

IMAGE = os.environ["CARL_CODE_IMAGE"]  # python@sha256:<64 hex>, already pulled

SOURCE = """def run(inputs):
    values = inputs["values"]
    return {"sum": sum(values), "count": len(values)}
"""

chain = ReasoningChain(steps=[
    CodeStepDescription(
        number=1,
        title="Run generated code",
        config=CodeStepConfig(
            source="$memory.generated.python_source",
            runtime_profile="python-safe-v1",
            input_mapping={"values": "$memory.input.values"},
            input_schema={
                "type": "object",
                "properties": {"values": {"type": "array", "items": {"type": "number"}}},
                "required": ["values"],
                "additionalProperties": False,
            },
            output_schema={
                "type": "object",
                "properties": {"sum": {"type": "number"}, "count": {"type": "integer"}},
                "required": ["sum", "count"],
                "additionalProperties": False,
            },
            timeout_seconds=5,
            output_key="statistics",
        ),
    ),
])

context = ReasoningContext(
    outer_context="",
    api=None,
    code_execution_policy=CodeExecutionPolicy(profiles={
        "python-safe-v1": CodeRuntimeProfile(
            runtime="docker",
            revision="python-3.12-slim",
            prepare_config={"image": IMAGE},
        ),
    }),
)
# Normally an earlier step writes the generated source.
context.memory_write("python_source", SOURCE, namespace="generated")
context.memory_write("values", [1, 2, 3, 4], namespace="input")

report = chain.preflight(context)
print(report.required_code_profiles, report.missing_code_profiles, report.all_present)

result = asyncio.run(chain.execute_async(context))
outcome = result.step_results[0].as_code_execution_outcome()
print(outcome.status, outcome.output, outcome.python_version)
print(context.memory_read("statistics", namespace="code"))
```

Вывод с локальным образом `python:3.12-slim`:

```text
['python-safe-v1'] [] True
completed {'sum': 10, 'count': 4} 3.12.13
{'sum': 10, 'count': 4}
```

Дайджест локального образа можно узнать командой
`docker image inspect python:3.12-slim --format '{{json .RepoDigests}}'`.

Более длинная версия с режимом пробного запуска лежит в
[`examples/agents/code_step_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/agents/code_step_example.py).

## Поля

`CodeStepConfig` запрещает неизвестные поля (`extra="forbid"`).

| Поле | Тип | По умолчанию | Правила |
| --- | --- | --- | --- |
| `source` | `str` | обязательно | Ссылка на контекст с текстом исходника, например `$memory.generated.code`. Должна начинаться с `$`. Код прямо в поле отклоняется. 1–1024 символа. |
| `runtime_profile` | `str` | обязательно | Идентификатор профиля в политике хоста. Должен соответствовать `[A-Za-z][A-Za-z0-9_.-]{0,127}`. |
| `input_mapping` | `dict[str, str]` | `{}` | Ключ объекта `inputs` → ссылка с `$`. Ключи должны быть идентификаторами в стиле Python и уникальными. |
| `input_schema` | `dict` | обязательно | Подмножество схемы для объекта `inputs`. `type` верхнего уровня должен быть `"object"`. |
| `output_schema` | `dict` | обязательно | Подмножество схемы для значения, которое возвращает `run`. |
| `timeout_seconds` | `float` | `10.0` | `> 0`. |
| `max_source_bytes` | `int` | `20000` | `> 0`. Размер исходника в UTF-8. |
| `max_input_bytes` | `int` | `1000000` | `> 0`. Размер канонического JSON для `inputs`. |
| `max_output_bytes` | `int` | `1000000` | `> 0`. Размер канонического JSON результата. |
| `output_key` | `str \| None` | `None` | Ключ памяти для результата. Записывается только при `completed`. До 256 символов. |
| `output_namespace` | `str` | `"code"` | Пространство имён памяти для `output_key`. |

Статические проверки при создании:

- Каждый ключ из `input_schema.required` должен быть в `input_mapping`.
- Если `input_schema.additionalProperties` равно `false`, `input_mapping` не может
  добавлять ключи, которых нет в схеме.

### Подмножество схемы

Обе схемы принимают только ключи `type`, `properties`, `required`, `items`, `enum` и
`additionalProperties`. Любое другое ключевое слово (`minLength`, `format`, `$ref`,
...) **отклоняется** при создании конфига. Другие правила:

- `type` обязателен в каждом узле: один JSON-тип или непустой список уникальных типов.
- `properties`, `required` и `additionalProperties` требуют `"object"` в `type`.
  `items` требует `"array"`.
- Каждое имя из `required` должно быть объявлено в `properties`.
- `additionalProperties` должен быть булевым значением.

## Политика хоста

Цепочка хранит только **имя** профиля. Что это имя означает, решает приложение-хост
во время выполнения:

```python
context.code_execution_policy = CodeExecutionPolicy(profiles={...})
```

`ReasoningContext.code_execution_policy` исключён из сериализации. Поэтому JSON
цепочки или контекста не может сам выдать себе право на выполнение.
`"python-safe-v1"` в примерах — просто имя. Встроенных профилей в CARL нет.

Поля `CodeRuntimeProfile` (все заморожены, неизвестные поля запрещены):

| Поле | По умолчанию | Значение |
| --- | --- | --- |
| `runtime` | обязательно | Имя зарегистрированного рантайма, например `"docker"`. |
| `revision` | обязательно | Ваша метка для этой сборки рантайма. Записывается в результат. |
| `interpreter` | `("python", "-I", "-B")` | Фиксированный префикс argv, до 16 токенов. |
| `prepare_config` | `{}` | Настройки рантайма. Для `docker` `image` должен быть закреплён как `name@sha256:<64 hex>`. `network` может быть только `"none"`. Ключи `_network_binding`, `extra_args`, `workspace_output_mode` зарезервированы. Не больше 16384 байт JSON. |
| `cpu_limit` | `1.0` | CPU. |
| `mem_limit` | `"256m"` | Лимит памяти. |
| `pids_limit` | `32` | Лимит процессов. |
| `max_timeout_seconds` | `30.0` | Потолок для `timeout_seconds` шага. |
| `max_cleanup_seconds` | `30.0` | Время на очистку песочницы. |
| `max_source_bytes` / `max_input_bytes` / `max_output_bytes` | `20000` / `1000000` / `1000000` | Потолки для лимитов шага. |

Действующий лимит всегда равен меньшему из значения шага и потолка профиля.
Применённые значения записываются в `effective_limits`.

### Какие рантаймы подходят

До запуска любого кода CARL в строгом режиме проверяет заявленные возможности
рантайма. Рантайм должен давать изоляцию `container` или `microvm` и обеспечивать
лимиты реального времени, объёма вывода, CPU, памяти, PID, `network="none"`, файлы
рабочей области и лимиты вывода артефактов. При подготовке он также должен
подтвердить, что сетевая изоляция включена, а монтирование вывода рабочей области
доступно только для чтения.

Из рантаймов, которые поставляются с CARL, проходит только **`docker`**. Проверено на
CARL 0.5.0:

| Рантайм | Результат | Каких контролей нет |
| --- | --- | --- |
| `docker` | запускается | нет |
| `local` | `denied` | isolation, cpu_limit, memory_limit, pids_limit, network |
| `firejail` | `denied` | isolation, cpu_limit, memory_limit, pids_limit |
| `e2b` | `denied` | wall_time, output_limit, cpu_limit, memory_limit, pids_limit, artifact_output_limit |

Свой рантайм, зарегистрированный через `register_skill_runtime()`, подходит, только
если его возможности и подготовленный хэндл подтверждают те же контроли.

С Docker CARL запускает новый контейнер с `--rm`, `--pull=never`, `--cap-drop=ALL`,
`no-new-privileges`, корневой файловой системой только для чтения, ограниченным
tmpfs `/tmp` с `noexec`, `--network none`, монтированием рабочей области только для
чтения и лимитами CPU, памяти (без дополнительного swap) и PID из профиля. Контейнер
получает только три файла: исходник, входной JSON и скрипт-раннер CARL. Переменные
окружения хоста, учётные данные и установка пакетов внутрь не передаются.

## Preflight

`ReasoningChain.preflight(context)` перечисляет все профили, которые запрашивают
CodeStep-шаги, в `required_code_profiles`. Профили, которые политика контекста не
может разрешить (или все, если политики нет), попадают в `missing_code_profiles`, и
`all_present` становится `False`.

Preflight проверяет только, что **имя** разрешается. Он не проверяет, подходит ли
рантайм и доступны ли Docker и образ. Такие проблемы проявляются во время выполнения
как `denied`, `runtime_unavailable` или `failed`.

См. [preflight](/ru/carl/care-integration/preflight/).

## Результат

Типизированный результат читается через
`StepExecutionResult.as_code_execution_outcome()`. Метод возвращает
`CodeExecutionOutcome`:

| Поле | Значение |
| --- | --- |
| `status` | Один из статусов ниже. |
| `profile_id`, `runtime`, `runtime_revision` | Какой профиль и рантайм отработали. |
| `source_sha256`, `source_bytes` | Хэш и размер точного исходника. Текст исходника в результат не копируется. |
| `input_sha256`, `output_sha256` | Хэши канонических JSON входа и выхода. |
| `output` | Проверенное возвращённое значение. Только при `completed`. |
| `python_version` | Версия интерпретатора, которую сообщил раннер. |
| `stdout`, `stderr`, `stdout_truncated`, `stderr_truncated` | Ограниченная диагностика от программы. |
| `elapsed_seconds` | Реальное время. |
| `effective_limits` | Фактически применённые лимиты. |
| `enforcement_report` | Отчёт рантайма о контролях, включая `isolation_accepted` и `gaps`. |
| `error_message` | Причина, если статус не `completed`. |

При `completed` в `result` лежит вывод как канонический JSON, и в историю
добавляется одна запись. В историю попадает только возвращённое значение, stdout туда
не попадает.

### Статусы

| `status` | Значение |
| --- | --- |
| `completed` | Единственный успешный статус. Вывод прошёл `output_schema` и проверки размера. |
| `invalid_source` | Исходник не разрешился в строку, слишком велик, не разобрался или нарушил контракт `run(inputs)`. |
| `invalid_input` | `inputs` не конечный JSON, не прошёл `input_schema` или превысил `max_input_bytes`. |
| `denied` | Нет политики, неизвестный профиль или рантайм не прошёл строгую проверку контролей. Код не запускался. |
| `runtime_unavailable` | Имя рантайма не зарегистрировано, или рантайм выбросил `SkillRuntimeError` при подготовке, или не подтвердил сетевую изоляцию и монтирование вывода только для чтения. |
| `timed_out` | Выполнение превысило действующий таймаут. |
| `invalid_output` | Возвращённое значение не JSON, не прошло `output_schema`, превысило `max_output_bytes`, или конверт с результатом не вернулся (например, stdout обрезан). |
| `failed` | `run` выбросил исключение, процесс завершился с ненулевым кодом, произошла другая ошибка рантайма или не удалась очистка. |
| `cancelled` | Запуск отменён. В результате `skipped=True`. |

`StepExecutionResult.success` равно `True` только для `completed`. Только тогда
записывается `output_key`.

## Ограничения

- Поддерживается только Python. Код может импортировать только то, что уже
  установлено в образе. Сети и установки пакетов нет.
- Таймаут и отмена останавливают контейнер. Очистка ограничена
  `max_cleanup_seconds`. Сбой очистки превращает результат в `failed`.
- Вывод программы делит ограниченный буфер stdout с конвертом результата CARL (лимит
  вывода + 4096 байт). Обильная печать может вытеснить конверт и дать
  `invalid_output`.
- Разбор исходника проверяет контракт, но не является границей безопасности. Изоляцию
  обеспечивает рантайм.
- `cache` на этом шаге не отклоняется. Попадание в кэш возвращает сохранённый
  результат без запуска кода и без записи `output_key`. См.
  [кэширование](/ru/carl/steps/caching/).

## Сериализация

- Тип в формате цепочки — `"code"`. Он появился в формате цепочки с
  `format_version` 7. Цепочки, сохранённые CARL 0.5.0, имеют `format_version` 11.
  См. [миграцию](/ru/carl/serialization/migration/).
- Весь `CodeStepConfig` проходит круг через `to_dict()` / `from_dict()` без потерь.
  Политика намеренно не сериализуется.
- У `ChainBuilder` нет хелпера `add_code_step`. Создавайте `CodeStepDescription`
  напрямую.

## См. также

- [Command-шаг](/ru/carl/steps/command/): запуск программы по явному списку argv.
- [LLM-шаг](/ru/carl/steps/llm/) и [структурированный вывод](/ru/carl/steps/structured-output/):
  как получить исходник на предыдущем шаге.
- [Preflight](/ru/carl/care-integration/preflight/).
- [Динамические ссылки](/ru/carl/chains/dynamic-references/).
