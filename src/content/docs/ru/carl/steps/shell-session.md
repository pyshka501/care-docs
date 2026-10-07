---
title: Shell-сессия
description: Статический список команд shell в одном процессе POSIX-оболочки с общими каталогом и переменными.
sidebar:
  order: 16
---

`ShellSessionStepDescription` выполняет **статический** скрипт в одном процессе
оболочки. Поведение задаёт `ShellSessionStepConfig`. Команды делят рабочий каталог,
переменные, функции и состояние файловой системы, пока идёт шаг. Следующий шаг
запускает новую оболочку и получает только объявленные артефакты.

Берите этот шаг, когда нужны возможности shell (`cd`, конвейеры, функции,
перенаправления) и скрипт известен при сборке цепочки. Для одной программы с
динамическими аргументами есть [Command-шаг](/ru/carl/steps/command/).

Как это работает:

- Команды склеиваются через перевод строки и подаются в `<shell> -s` через stdin.
- При `stop_on_error=True` (по умолчанию) скрипт начинается с `set -e`.
- Команды **не** собираются из контекста. Динамические значения попадают в скрипт
  только как переменные `CARL_ARG_<NAME>` или как входные артефакты.
- Весь скрипт входит в fingerprint подтверждения.
- Оболочка по умолчанию требует подтверждения хоста, даже если она в `allowed_executables`.

## Минимальный пример

```python
import asyncio

from mmar_carl import (
    CommandPolicy,
    ReasoningChain,
    ReasoningContext,
    ShellSessionStepConfig,
    ShellSessionStepDescription,
)

chain = ReasoningChain(
    steps=[
        ShellSessionStepDescription(
            number=1,
            title="Prepare and report",
            config=ShellSessionStepConfig(
                shell="/bin/sh",
                commands=[
                    "mkdir work",
                    "cd work",                      # cwd persists to the next line
                    'greet() { printf "hi %s\\n" "$1"; }',
                    'greet "$CARL_ARG_NAME"',       # dynamic value via env only
                    'printf "%s\\n" "${PWD##*/}"',
                ],
                input_mapping={"name": "$outer_context"},
                runtime="local",
                network="host",
            ),
        )
    ]
)

context = ReasoningContext(
    outer_context="Ada",
    api=llm_client,  # unused by this step
    command_policy=CommandPolicy(
        approval_required_executables=frozenset({"/bin/sh"}),
        allowed_runtimes=frozenset({"local"}),
        allowed_networks=frozenset({"host"}),
    ),
    on_command_approval_requested=lambda request: True,  # a real host asks a person
)
result = asyncio.run(chain.execute_async(context))
step = result.step_results[0]
print(step.result)                           # "hi Ada\nwork\n"
print(step.result_data["command_count"])     # 5
print(step.result_data["approval"])          # "approved"
```

`network="host"` объявлен потому, что `local` не изолирует сеть. С `network="none"` по
умолчанию и строгим режимом шаг падает до запуска. Подробнее в
[предупреждении на странице Command-шага](/ru/carl/steps/command/#минимальный-пример).

Пример из двух шагов, где файл передаётся между новыми оболочками через артефакты:
[`examples/orchestration/shell_session_artifacts_example.py`](https://github.com/Glazkoff/carl/blob/main/examples/orchestration/shell_session_artifacts_example.py).

## ShellSessionStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `commands` | `list[str]` | — (обязательно) | Строки скрипта. Минимум одна; каждая непустая и без NUL. |
| `shell` | `str` | `"/bin/sh"` | Оболочка. На `local`/`firejail` политике нужен ровно этот абсолютный путь. |
| `stop_on_error` | `bool` | `True` | Добавить в начало скрипта `set -e`. |

Действуют все общие поля рантайма: `input_mapping`, `env`, `artifact_inputs`,
`artifact_outputs`, `working_dir`, `runtime`, `enforcement_mode`, `network`,
`network_allowlist`, `timeout`, `artifact_io_timeout`, `cpu_limit`, `mem_limit`,
`pids_limit`, `allow_nonzero_exit`, `max_output_bytes`, `output_key`. Значения по
умолчанию и смысл — в [таблице Command-шага](/ru/carl/steps/command/#общие-поля-рантайма).
Здесь значения `input_mapping` экспортируются только как `CARL_ARG_<NAME>`. В argv
ничего не добавляется, он всегда `[shell, "-s"]`.

Шаг нельзя кэшировать.

## Политика и подтверждение

Политика — та же `CommandPolicy`, что у [Command-шага](/ru/carl/steps/command/#commandpolicy).
Для shell-сессии «программа» — это оболочка.

- При `require_approval_for_interpreters=True` (по умолчанию) каждая shell-сессия
  требует подтверждения, в каком бы списке ни была оболочка. У
  `CommandApprovalRequest` будет `invocation_kind="shell_session"`.
- Fingerprint покрывает весь скрипт (это хеш stdin), окружение, рантайм, сеть, ресурсы
  и манифест артефактов. Любая правка скрипта его меняет.
- Подтвердить оболочку — значит подтвердить **каждую** команду скрипта. Список
  разрешённых программ не ограничивает то, что запускается внутри скрипта. Проверяйте
  сам скрипт, а недоверенные сессии запускайте в настоящей песочнице, не на `local`.
- Размер скрипта считается в `CommandPolicy.max_stdin_bytes` (по умолчанию `1_000_000`).

Если хост задал `require_approval_for_interpreters=False` и поместил оболочку в
`allowed_executables`, сессии идут без колбэка. Это осознанное решение хоста.

## Результат

`result` — stdout. В `result_data` те же ключи, что у Command-шага (`stdout`,
`stderr`, `exit_code`, `policy_decision`, `approval`, `enforcement_report`,
`network_*`, `artifacts`, `artifact_manifest`, флаги обрезки, `<output_key>`), и ещё:

| Ключ | Содержимое |
| --- | --- |
| `shell` | Заданная оболочка |
| `command_count` | Число элементов в `commands` |
| `script_sha256` | SHA-256 точного скрипта, ушедшего в stdin, вместе с префиксом `set -e` |

Ключей `command`, `command_source` и `resolved_argument_count` нет. Запись в истории:
`Step N. <title> [SHELL_SESSION exit=<code>]`, затем stdout.

## Сбои

Сбои те же, что в [таблице Command-шага](/ru/carl/steps/command/#сбои). Особенности
shell-сессии:

- При `stop_on_error=True` первая упавшая команда останавливает скрипт, шаг падает с
  `runtime process exited with code <N>`. Следующие строки не выполняются.
- При `stop_on_error=False` код выхода — от последней команды. Упавшая строка в
  середине шаг не роняет.
- Скрипт больше `max_stdin_bytes` даёт
  `failed to build runtime invocation: shell script exceeds the host stdin byte limit`.
- Нет колбэка подтверждения или отказ: `command was not approved by the application host`.

## Ограничения

- Один процесс на шаг. Состояние в следующий шаг не переходит, используйте артефакты.
- У `set -e` обычные для POSIX исключения: команды в условиях, в конвейере кроме
  последней, после `||`/`&&`.
- На `local` оболочка работает от пользователя хоста без изоляции сети, CPU, памяти и
  числа процессов. Время и размер вывода ограничиваются.
- Скрипт статический. Чтобы менять поведение, читайте внутри него `CARL_ARG_*` или
  файлы артефактов. Не собирайте команды из контекста.

## См. также

- [Command-шаг](/ru/carl/steps/command/) — общие поля рантайма, `CommandPolicy`, артефакты, `EnforcementReport`.
- [Шаг планирования команды](/ru/carl/steps/command-plan/)
- [Песочницы](/ru/carl/skills/sandbox/) — бэкенды рантайма.
