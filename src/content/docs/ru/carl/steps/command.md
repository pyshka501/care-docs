---
title: Command-шаг
description: Запуск одной программы по явному списку argv через рантайм под контролем CommandPolicy, которую задаёт хост.
sidebar:
  order: 14
---

`CommandStepDescription` запускает одну программу операционной системы. Поведение
задаёт `CommandStepConfig`. Шаг не вызывает LLM.

По умолчанию шаг безопасен:

- `command` — это **список argv**. CARL не вставляет оболочку. Метасимволы shell в
  подставленных значениях не могут запустить лишние команды.
- Значения из `input_mapping` добавляются в конец argv отдельными токенами и
  экспортируются как `CARL_ARG_<NAME>`. В строку они не подставляются никогда.
- Запуск идёт через бэкенд рантайма (`local`, `docker`, `e2b`, `firejail`).
- Цепочка не может сама себе выдать разрешение. Приложение передаёт `CommandPolicy` в
  `ReasoningContext.command_policy`. Без политики шаг завершается ошибкой.
- Окружение хоста не наследуется. Сеть по умолчанию `none`.

Если нужны возможности shell, явно укажите интерпретатор в `command`
(`["/bin/sh", "-c", script]`) или используйте [shell-сессию](/ru/carl/steps/shell-session/).
Интерпретаторы по умолчанию требуют подтверждения хоста.

## Минимальный пример

```python
import asyncio

from mmar_carl import (
    CommandPolicy,
    CommandStepConfig,
    CommandStepDescription,
    ReasoningChain,
    ReasoningContext,
)

# Owned by the application, never by the chain JSON.
policy = CommandPolicy(
    allowed_executables=frozenset({"/usr/bin/printf"}),
    allowed_runtimes=frozenset({"local"}),
    allowed_networks=frozenset({"host"}),
)

chain = ReasoningChain(
    steps=[
        CommandStepDescription(
            number=1,
            title="Greet",
            config=CommandStepConfig(
                command=["/usr/bin/printf", "hello, %s\n"],
                input_mapping={"who": "$outer_context"},  # appended as argv[2]
                runtime="local",
                network="host",  # local cannot isolate the network; say so
                timeout=5.0,
            ),
        )
    ]
)

context = ReasoningContext(
    outer_context="world",
    api=llm_client,  # any client; CommandStep makes no LLM call
    command_policy=policy,
)
result = asyncio.run(chain.execute_async(context))
step = result.step_results[0]
print(step.result)                       # "hello, world\n"
print(step.result_data["exit_code"])     # 0
print(step.result_data["approval"])      # "not_required"
```

Пример работает на macOS и Linux как есть. Рантайм `local` один раз выдаёт
`UserWarning` о том, что песочницы нет.

:::caution[Рантайм `local` и `network="none"` по умолчанию]
`local` не умеет изолировать сеть. С настройками по умолчанию (`network="none"`,
`enforcement_mode="strict"`) шаг падает до запуска:
`runtime 'local' cannot strictly enforce requested controls: network`.
На `local` либо объявите `network="host"` (и разрешите его в политике), либо
используйте `enforcement_mode="best_effort"` вместе с
`CommandPolicy(allow_best_effort=True)`. Тогда шаг запустится и сообщит о пробеле.
Для настоящей изоляции берите `docker`, `e2b` или `firejail`.
:::

Полный запускаемый пример:
[`examples/orchestration/command_steps_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/command_steps_example.py).

## CommandStepConfig

Поля, относящиеся только к команде:

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `command` | `list[str] \| None` | `None` | Список argv, например `["/usr/bin/grep", "-n", "TODO"]`. Не строка shell. |
| `plan_source` | `str \| None` | `None` | Ссылка на `CommandPlanRecord` (`$steps.*` или `$metadata.*`). См. [шаг планирования команды](/ru/carl/steps/command-plan/). |
| `planned_capability_ids` | `list[str]` | `[]` | Какие capability принимает запланированный шаг. Только сужает реестр хоста. Обязателен вместе с `plan_source`. |
| `stdin_source` | `str \| None` | `None` | Ссылка на контекст, значение которой идёт в stdin. Нестроковые значения передаются как JSON. |

Должно быть задано ровно одно из `command` и `plan_source`. Запланированный шаг не
может использовать `input_mapping`.

### Общие поля рантайма

Эти поля общие для `CommandStepConfig` и `ShellSessionStepConfig`
(`_RuntimeExecutionConfig`):

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `input_mapping` | `dict[str, str]` | `{}` | Имя → ссылка на контекст. Экспортируется как `CARL_ARG_<NAME>`; у `CommandStep` ещё и добавляется в argv в порядке словаря. Ключи по шаблону `[A-Za-z_][A-Za-z0-9_]*`, уникальные после перевода в верхний регистр. |
| `env` | `dict[str, str]` | `{}` | Явные переменные окружения. Каждый ключ должен быть в `CommandPolicy.allowed_env_keys`. Префиксы `CARL_ARG_*` и `CARL_ARTIFACT_*` зарезервированы. |
| `artifact_inputs` | `list[ArtifactInput]` | `[]` | Значения, которые кладутся файлами в каталог `in/` рантайма. |
| `artifact_outputs` | `list[ArtifactOutput]` | `[]` | Обязательные файлы, которые забираются из каталога `out/`. |
| `working_dir` | `str \| None` | `None` | Рабочий каталог внутри рантайма. По умолчанию временный `out/`. Явно заданный каталог CARL никогда не удаляет. |
| `runtime` | `str` | `"local"` | `local`, `docker`, `e2b`, `firejail` или зарегистрированный бэкенд. |
| `enforcement_mode` | `"strict" \| "best_effort"` | `"strict"` | `strict` падает до запуска, если запрошенный контроль не обеспечен. `best_effort` запускает (только если политика разрешает) и сообщает о пробелах. |
| `network` | `"none" \| "allowlist" \| "host"` | `"none"` | Сетевая политика. |
| `network_allowlist` | `list[str]` | `[]` | Точные хосты. Нужен при `network="allowlist"` и допустим только с ним. |
| `timeout` | `float` | `30.0` | Ограничение времени процесса, в секундах. |
| `artifact_io_timeout` | `float` | `30.0` | Отдельный лимит на запись или чтение каждого артефакта. |
| `cpu_limit` | `float \| None` | `None` | Лимит ядер CPU. |
| `mem_limit` | `str \| None` | `None` | Лимит памяти с явным суффиксом `b`/`k`/`m`/`g`, например `"512m"`. |
| `pids_limit` | `int \| None` | `None` | Максимум процессов. |
| `allow_nonzero_exit` | `bool` | `False` | При `False` ненулевой код выхода делает шаг неуспешным. |
| `max_output_bytes` | `int` | `1_000_000` | Сколько байт stdout и stderr сохраняется, для каждого отдельно. |
| `output_key` | `str` | `"result"` | Ключ для stdout в `result_data`. Не может совпадать с зарезервированным ключом (ниже). |

`CommandStepDescription` нельзя кэшировать (`cache=` вызывает ошибку): у команды
могут быть побочные эффекты.

## Окружение

Окружение хоста не наследуется. При `runtime="local"` процесс получает только `PATH`,
`LANG` и `LC_ALL` (если они заданы на хосте), а также `env`, `CARL_ARG_*` и
`CARL_ARTIFACT_*`. Другие рантаймы не получают переменных хоста вовсе. `HOME` не
передаётся.

## CommandPolicy

Политика — замороженная pydantic-модель в `ReasoningContext.command_policy`. Она
существует только во время выполнения и не попадает в сериализацию контекста. Всё,
чего нет в списках, запрещено: неизвестные программы, рантаймы, сети, хосты, ключи
окружения и рабочие каталоги хоста.

| Поле | По умолчанию | Смысл |
| --- | --- | --- |
| `allowed_executables` | пусто | Точные строки программ, которые можно запускать. |
| `approval_required_executables` | пусто | Точные строки, которые запускаются только после «да» от колбэка подтверждения. Не должны пересекаться с `allowed_executables`. |
| `allowed_runtimes` | пусто | Имена рантаймов. Пусто — запускать нечего. |
| `allowed_networks` | `{"none"}` | Допустимые значения `network`. |
| `allowed_network_hosts` | пусто | Хосты, разрешённые для `network="allowlist"`. |
| `allowed_env_keys` | пусто | Ключи, разрешённые в `env`. |
| `local_working_roots` | `()` | Абсолютные корни для явного `working_dir` на `local`/`firejail`. Пусто — явный каталог хоста запрещён. |
| `allow_best_effort` | `False` | Разрешить `enforcement_mode="best_effort"`. |
| `allow_planned_local` | `False` | Разрешить запланированные LLM команды на `local`. |
| `require_approval_for_planned` | `True` | Тип `Literal[True]`. Отключить нельзя. |
| `require_approval_for_interpreters` | `True` | Интерпретаторы требуют подтверждения, даже если разрешены: по имени файла `sh`, `bash`, `dash`, `zsh`, `fish`, `node`, `perl`, `ruby`, `pwsh` и любой `python*`. |
| `approval_timeout` | `300.0` | Сколько секунд ждать асинхронный колбэк подтверждения. |
| `network_enforcer_timeout` | `30.0` | Лимит на получение и освобождение управляемой сети. |
| `runtime_cleanup_timeout` | `30.0` | Лимит на очистку рантайма. |
| `max_timeout` | `300.0` | Потолок для `timeout`. |
| `max_artifact_io_timeout` | `30.0` | Потолок для `artifact_io_timeout`. |
| `max_cpu_limit`, `max_memory_bytes`, `max_pids_limit` | `None` | Потолки ресурсов. Если заданы, применяются и к шагу, который лимит не просил. Значит, рантайм обязан их обеспечить (на `local` строгий режим тогда падает). |
| `max_output_bytes` | `1_000_000` | Потолок для `max_output_bytes`. |
| `max_argument_count` | `256` | Потолок длины argv. |
| `max_argv_bytes` | `256_000` | Потолок общего размера argv. |
| `max_environment_keys` / `max_environment_bytes` | `128` / `256_000` | Потолки итогового окружения. |
| `max_stdin_bytes` | `1_000_000` | Потолок stdin (и скрипта shell-сессии). |
| `max_artifact_bytes` / `max_total_artifact_bytes` / `max_artifact_count` | `1_000_000` / `4_000_000` / `32` | Потолки для артефактов. |

Правила сопоставления:

- Правила — **точные строки**. Не имена файлов и не шаблоны.
- Для `local` и `firejail` (они запускают бинарник хоста) и правило, и запрошенная
  программа должны быть абсолютными путями. Пути нормализуются, и запускается именно
  нормализованный путь. `["echo", "hi"]` будет отклонён, даже если `/bin/echo` разрешён.
- Контейнерные рантаймы (`docker`, `e2b`) сопоставляют имя внутри образа, например `python`.

### Подтверждение

Если решение — `require_approval`, CARL собирает замороженный `CommandApprovalRequest`
и вызывает `ReasoningContext.on_command_approval_requested`. Колбэк возвращает `bool`
или awaitable с `bool`. Подтверждает только `True`. Нет колбэка — команда отклонена.

```python
from mmar_carl import CommandApprovalRequest, CommandPolicy, ReasoningContext

policy = CommandPolicy(
    approval_required_executables=frozenset({"/bin/sh"}),
    allowed_runtimes=frozenset({"local"}),
    allowed_networks=frozenset({"host"}),
)

def approve(request: CommandApprovalRequest) -> bool:
    # request.argv holds the full argv for the reviewer.
    print(request.authorized_executable, request.argv_preview, request.fingerprint)
    return ask_user(request)  # your UI

context = ReasoningContext(
    outer_context="",
    api=llm_client,
    command_policy=policy,
    on_command_approval_requested=approve,
)
```

Что содержит запрос:

- `fingerprint` — SHA-256 по всем значениям, влияющим на запуск: итоговый argv,
  рантайм, рабочий каталог, сеть и хосты, ресурсы, режим и отчёт о контроле, манифест
  артефактов, полное окружение и хеш stdin.
- `argv`, `environment`, `stdin` и `artifact_inputs` видны колбэку, но **исключены из
  сериализации**. В `model_dump()` вместо них `argv_preview` (программа плюс
  заглушки `<static-arg-N>` / `<dynamic-arg-N>`), `dynamic_argument_count`,
  `environment_keys` и `stdin_sha256`.
- `source` (`static` или `planned`), `invocation_kind` (`command` или
  `shell_session`), а для запланированных команд ещё id, ревизия и fingerprint
  capability и `arguments_sha256`.

CARL также шлёт события шага `command.approval_requested` (с сериализованным
запросом) и `command.approval_resolved` через `on_step_event`.

Политика проверяется дважды: до подтверждения и ещё раз после подготовки рантайма, уже
по итоговому окружению. Конфиг глубоко копируется до подтверждения, поэтому после
проверки он не меняется.

## Результат

После выполнения `result` — это stdout (декодированный как UTF-8 и обрезанный до
`max_output_bytes`). В `result_data`:

| Ключ | Содержимое |
| --- | --- |
| `<output_key>` | stdout (ключ по умолчанию `result`) |
| `stdout`, `stderr` | Декодированный вывод |
| `stdout_truncated`, `stderr_truncated` | `True`, если вывод превысил `max_output_bytes` |
| `exit_code` | Код выхода процесса |
| `command_source` | `"static"` или `"planned"` |
| `command` | Статический префикс argv из конфига (только для static) |
| `resolved_argument_count` | Сколько динамических токенов добавлено в argv |
| `capability_id`, `capability_revision`, `capability_fingerprint` | Только для запланированных команд |
| `policy_decision` | Дамп `CommandDecision`: `outcome`, `reason`, `executable`, `authorized_executable`, `authorized_working_dir`, `matched_rule` |
| `approval` | `"not_required"` или `"approved"` |
| `enforcement_report` | См. ниже |
| `network_policy`, `network_enforced`, `network_enforcement` | Запрошенная политика, подтверждение от бэкенда, план управляемой сети или `None` |
| `artifacts` | Собранные `ArtifactRecord` по именам |
| `artifact_manifest` | Манифест входов и выходов плюс `collected_outputs` |

Запись в истории: `Step N. <title> [COMMAND exit=<code>]`, затем stdout.

Эти ключи зарезервированы и не могут быть `output_key`: `approval`,
`artifact_manifest`, `artifacts`, `command`, `command_source`, `command_count`,
`capability_fingerprint`, `capability_id`, `capability_revision`,
`enforcement_report`, `exit_code`, `network_enforced`, `network_enforcement`,
`network_policy`, `policy_decision`, `resolved_argument_count`, `script_sha256`,
`shell`, `stderr`, `stderr_truncated`, `stdout`, `stdout_truncated`.

### EnforcementReport

`enforcement_report` — это `EnforcementReport.as_dict()`:

```python
{
    "runtime": "local",
    "isolation": "none",
    "mode": "best_effort",
    "fully_enforced": False,
    "controls": {
        "wall_time": "enforced",
        "output_limit": "enforced",
        "cpu_limit": "not_requested",
        "memory_limit": "not_requested",
        "pids_limit": "not_requested",
        "network": "unsupported",
        "workspace_files": "not_requested",
        "artifact_output_limit": "not_requested",
    },
    "gaps": ["network"],
}
```

Каждый контроль — `enforced`, `advisory`, `unsupported` или `not_requested`.
`advisory` и `unsupported` считаются пробелами. `advisory` не означает
предотвращения: например, E2B обрезает вывод уже после получения. Выше — реальный
вывод для `/bin/echo` на `local` с `network="none"` и `best_effort`.

## Переносимые артефакты

Артефакты несут байты, а не пути хоста. Сериализованная цепочка не может попросить
хост прочитать произвольный файл.

- `ArtifactInput(name, source, path, media_type="application/octet-stream", max_bytes=None)` —
  `source` — ссылка на контекст или литерал в кавычках. Значение пишется в
  `in/<path>`, путь внутри рантайма экспортируется как `CARL_ARTIFACT_IN_<NAME>`.
  Строки идут как UTF-8, байты как есть, `ArtifactRecord` (или его dict) декодируется
  с проверкой хеша, остальное превращается в JSON.
- `ArtifactOutput(name, path, media_type="application/octet-stream", max_bytes=None)` —
  программа пишет `out/<path>` (путь в `CARL_ARTIFACT_OUT_<NAME>`). После успешного
  запуска CARL читает файл с ограничением размера в `result_data["artifacts"][name]`.
  Если файла нет, шаг падает.
- `ArtifactRecord` — `name`, `path`, `media_type`, `size_bytes`, `sha256`,
  `content_base64`. `ArtifactRecord.decode(max_bytes=...)` проверяет размер и хеш.

Пути — относительные POSIX-пути без сегментов `.`/`..`. Следующий шаг берёт выход
через `source="$steps.1.result_data.artifacts.<name>"`. Выходы не собираются, если
процесс упёрся в таймаут или вышел с ненулевым кодом (кроме `allow_nonzero_exit=True`).

## Сеть

- `none` — обеспечивают `docker`, `e2b` и `firejail`. `local` не обеспечивает.
- `allowlist` — точные хосты. `e2b` обеспечивает это сам. Для `docker` и `firejail`
  нужен `NetworkEnforcer` от хоста в `ReasoningContext.network_enforcer`
  (`PreconfiguredNetworkEnforcer` привязывает заранее созданные сети, за которые вы
  ручаетесь; сам он ничего не создаёт). Без него строгий режим падает.
- `host` — полная сеть хоста. Рантайм `local` выдаёт предупреждение.

Рантайм должен ещё и подтвердить результат при подготовке. Если не подтвердил,
строгий режим падает, даже если статическое описание обещало `enforced`.

## Сбои

Все сбои возвращают `success=False` и `error_message`. Наблюдаемые сообщения:

| Ситуация | `error_message` |
| --- | --- |
| В контексте нет политики | `command execution requires a host-owned CommandPolicy on ReasoningContext` |
| Отказ до запуска | `command denied by application policy: <reason>`, например `executable is not present in the exact allowlist`, `network policy 'host' is not allowed`, `best-effort enforcement is not allowed`, `environment keys are not allowed: ['OTHER']`, `explicit host working directories are not allowed`, `requested timeout 301.0 exceeds host maximum 300.0` |
| Нет подтверждения, отказ или колбэк вернул не `True` | `command was not approved by the application host` |
| Асинхронное подтверждение не успело | `command approval timed out` |
| Колбэк подтверждения бросил исключение | `command approval callback failed: <exc>` |
| Строгий режим, контроль не обеспечен | `runtime 'local' cannot strictly enforce requested controls: network` (или `cpu_limit`, …) |
| Проблема со ссылкой на контекст или лимитом | `failed to build runtime invocation: <detail>` |
| Таймаут | `command timed out after <timeout>s` |
| Ненулевой код выхода | `runtime process exited with code <N>` (`result_data` при этом заполнен) |
| Ошибка рантайма, нет артефакта | `sandbox runtime error: <detail>` |
| Чтение или запись артефакта не успели | `artifact I/O timed out after <artifact_io_timeout>s` |

Отклонённая команда до рантайма не доходит: бэкенд выбирается только после проверки
политики.

## Устаревшие поля и алиас `bash`

- `allow_unsafe_local` и `allow_unenforced_network` из старых цепочек отбрасываются
  при загрузке с `DeprecationWarning`. Они ничего не разрешают. Используйте `CommandPolicy`.
- `"step_type": "bash"` в старом JSON по-прежнему загружается как `command`.
  Сохранённые цепочки пишут `"command"`.

## Ограничения

- `local` — не песочница. Он обеспечивает время, размер вывода и границы артефактов,
  но не сеть, CPU, память и число процессов.
- Разрешённая программа всё равно может прочитать всё, что доступно пользователю
  хоста. Политика решает, *какая* программа запустится, а не что она сделает.
- Подтвердить интерпретатор (`sh -c`, `python -c`) — значит подтвердить весь его скрипт.
- `firejail` отмечает `memory_limit` и `pids_limit` как advisory, а `cpu_limit` как
  unsupported. `e2b` отмечает время и лимит вывода как advisory.

## См. также

- [Shell-сессия](/ru/carl/steps/shell-session/) — несколько статических команд в одном shell.
- [Шаг планирования команды](/ru/carl/steps/command-plan/) — LLM выбирает типизированные аргументы для capability хоста.
- [Песочницы](/ru/carl/skills/sandbox/) — бэкенды рантайма и их установка.
- [Code-шаг](/ru/carl/steps/code/) — запуск сгенерированного Python под профилем песочницы хоста.
