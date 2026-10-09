---
title: Песочница и LLM_AGENT
description: Где на самом деле выполняются скрипты AgentSkill, что применяют бэкенды рантайма, сетевая политика и рабочая папка LLM_AGENT.
sidebar:
  order: 3
---

Эта страница про изоляцию **шагов AgentSkill**. Запуск команд в песочнице
описан в [CommandStep](/ru/carl/steps/command/),
[ShellSessionStep](/ru/carl/steps/shell-session/) и
[CodeStep](/ru/carl/steps/code/). Они используют те же бэкенды рантайма, что
описаны ниже.

## Где выполняются скрипты навыка

`AgentSkillStepConfig.runtime` по умолчанию `"local"`. В CARL 0.5.0 это
единственный рантайм, в котором шаг AgentSkill может запускать скрипты.
`LocalSkillRuntime` запускает подпроцесс на хосте. Скрипт видит файловую
систему и сеть хоста. Если `extra_pip` не задан, он получает и всё окружение
хоста, включая секреты. Один раз за процесс рантайм выдаёт об этом
`UserWarning`.

`runtime` со значением `docker`, `e2b` или `firejail` навык в песочницу не
помещает. Любой запуск скрипта тогда выбрасывает `SkillRuntimeError` ("AgentSkill
script execution on non-local runtimes requires a staged workspace and is not
implemented yet"). Что это значит для режимов:

| Режим | С не-локальным `runtime` |
| --- | --- |
| `LLM` | Работает как обычно, скрипты не запускаются. |
| `SCRIPT` | Шаг падает. |
| `HYBRID` | Скрипт падает, шаг уходит в LLM (`result_data["script_error"]`, `llm_fallback=True`). |
| `SUBAGENT` | Скрипт падает, LLM запускается с пометкой об ошибке. Шаг может завершиться успешно. |
| `LLM_AGENT` | Шаг падает, как только модель вызывает `run_script`. |

`extra_pip` ставится тем же путём, поэтому тоже работает только на `local`
(через `pip` хоста). Неизвестное имя рантайма роняет шаг до запуска.

:::caution
Считайте любой AgentSkill со скриптами доверенным кодом на своей машине.
Недоверенный код запускайте через фиксированный
[CommandStep](/ru/carl/steps/command/) с `CommandPolicy` на стороне хоста и
изолированным рантаймом.
:::

## Бэкенды рантайма

При импорте регистрируются четыре бэкенда: `local`, `docker`, `e2b`, `firejail`.
Каждый объявляет `RuntimeCapabilities`. `enforced` значит, что бэкенд
предотвращает нарушение. `advisory` значит, что контроль записывается или
применяется задним числом. `unsupported` значит, что бэкенд ничего не делает.

| Контроль | `local` | `docker` | `firejail` | `e2b` |
| --- | --- | --- | --- | --- |
| `isolation` | `none` | `container` | `process` | `microvm` |
| `wall_time` | enforced (POSIX) | enforced | enforced | advisory |
| `output_limit` | enforced | enforced | enforced | advisory |
| `cpu_limit` | unsupported | enforced | unsupported | unsupported |
| `memory_limit` | unsupported | enforced | advisory | unsupported |
| `pids_limit` | unsupported | enforced | advisory | unsupported |
| `network_none` | unsupported | enforced | enforced | enforced |
| `network_allowlist` | unsupported | unsupported | unsupported | enforced |
| `workspace_files` | enforced | enforced | enforced | enforced |
| `persistent_shell` | unsupported | unsupported | unsupported | unsupported |
| `artifact_output_limit` | enforced | enforced | enforced | advisory |

Что нужно: для `docker` — Docker CLI и демон, для `firejail` — Linux с firejail,
для `e2b` — `pip install 'mmar-carl[e2b]'` и API-ключ (по умолчанию из
`E2B_API_KEY`).

```python
from mmar_carl import (
    assess_runtime_enforcement, get_runtime_capabilities, get_skill_runtime,
)

runtime = get_skill_runtime("docker")
get_runtime_capabilities(runtime).network_allowlist   # "unsupported"

report = assess_runtime_enforcement(
    runtime, mode="strict", network="allowlist",
    cpu_limit_requested=True, memory_limit_requested=True, pids_limit_requested=False,
)
report.gaps             # ("network",)
report.fully_enforced   # False
report.as_dict()        # runtime, isolation, mode, controls, gaps
```

Для рантайма без объявлений `get_runtime_capabilities()` возвращает запись, где
всё `unsupported`, а `isolation="unknown"`. `assess_runtime_enforcement()`
строит `EnforcementReport`, которым пользуются шаги команд. С
`enforcement_mode="strict"` они не стартуют, если у запрошенного контроля есть
пробел. Шаги AgentSkill такой отчёт не строят.

## Сетевая политика

`runtime_config["network"]` принимает одно из трёх значений (`NetworkPolicy`):

| Политика | Смысл |
| --- | --- |
| `none` (по умолчанию) | Запрос без сети. |
| `allowlist` | Запрос сети только к точным хостам из `runtime_config["network_allowlist"]` и хостам `WebFetch(domain:...)` из `allowed-tools` навыка. Нужен хотя бы один хост. CIDR, маски, URL и порты отклоняются. |
| `host` | Полная сеть хоста. Бэкенды выдают `UserWarning`. |

Что с ней делают бэкенды:

- **local** проверяет и записывает политику (`handle.backend["network_enforced"]
  = False`). Заблокировать он ничего не может.
- **docker** / **firejail**: `none` даёт `--network none` / `--net=none`.
  `allowlist` без привязки от хоста тоже запускается совсем без сети (fail
  closed). С `DockerNetworkBinding` / `FirejailNetworkBinding` от хостового
  `NetworkEnforcer` контейнер подключается к заранее подготовленной сети или
  интерфейсу.
- **e2b** передаёт `none` и `allowlist` в API создания песочницы E2B.

Для шага AgentSkill действует только первый случай: строка политики
проверяется (неизвестное значение роняет шаг), а дальше `local` её игнорирует.

```python
from mmar_carl import resolve_network_policy, parse_network_allowlist_from_allowed_tools

policy, hosts = resolve_network_policy(
    {"network": "allowlist", "network_allowlist": ["api.example.com"]},
    manifest_allowed_tools="Read WebFetch(domain:docs.example.com)",
)
# ("allowlist", ["api.example.com", "docs.example.com"])

parse_network_allowlist_from_allowed_tools("Bash(git:*) WebFetch(domain:api.x.com)")
# ["api.x.com"]; a bare WebFetch with no domain is ignored
```

### Сетевой контроль на стороне хоста

Список хостов в JSON цепочки не доказывает, что фильтр существует. Управляемый
выход в сеть — это контракт на стороне хоста в `mmar_carl.network_enforcement`.
`NetworkEnforcer` планирует, получает и освобождает аренду для
`ManagedNetworkProfile`. В поставке есть `PreconfiguredNetworkEnforcer`. Это
адаптер-аттестация: он не создаёт Docker-сети, не настраивает интерфейсы и не
ставит правила файрвола. Оператор ручается, что каждая привязка применяет ровно
этот allowlist. Enforcer лежит в `ReasoningContext.network_enforcer`, живёт
только во время работы и не сериализуется. Его используют шаги команд, шаги
AgentSkill — нет.

## Рабочая папка LLM_AGENT

`LLM_AGENT` создаёт временную папку `carl_skill_*` с `in/` и `out/` и запускает
цикл вызовов инструментов. Инструментов пять, набор фиксирован:

| Инструмент | Что делает |
| --- | --- |
| `list_resources()` | Перечисляет скрипты, справочники и ассеты навыка. |
| `read_resource(resource_path)` | Читает файл из папки навыка (первые 8000 символов). |
| `read_file(path)` | Читает файл (первые 10000 символов). `/workspace/in` и `/workspace/out` подменяются на временные папки. Относительные пути считаются от папки навыка. |
| `write_file(filename, content)` | Пишет `out/<basename>`. |
| `run_script(script_path, args)` | Запускает `.py` (через `python_executable`) или `.sh` (через `/bin/sh`) в локальном рантайме. `cwd` — `working_dir` или папка навыка. |

- Значения `input_mapping`, которые являются путями к существующим файлам хоста,
  копируются в `in/`. Остальные передаются как текст.
- Файлы из `out/`, подходящие под `output_files_glob`, попадают в
  `result_data["output_files"]` как `{path, name, size}`.
- `output_capture` выбирает результат шага: `"stdout"` (финальный ответ),
  `"files"` (JSON-список файлов) или `"both"` (ответ и имена файлов).
- Цикл заканчивается на ответе без вызовов инструментов или после
  `llm_max_iterations` (по умолчанию 8). Отмена проверяется перед каждым раундом.
- Каждый вызов порождает события шага `llm_agent.tool_call` и
  `llm_agent.tool_result`.
- После шага папка удаляется, если не задан `persist_workspace=True`.

:::caution[Рабочая папка — не песочница]
`/workspace/...` — соглашение об именах, а не изоляция. Инструменты работают в
процессе CARL на хосте. `read_file` принимает любой абсолютный путь,
`read_resource` проходит через `../`. Значит, модель может прочитать любой файл,
доступный процессу. Настоящие временные пути к тому же видны в системном
промпте. `write_file` ограничен папкой `out/`. Скрипты выполняются на хосте, как
описано выше.
:::

## Свои рантаймы

Можно зарегистрировать свой бэкенд. Он станет доступен шагам команд и
`get_skill_runtime()`. Шаги AgentSkill всё равно отклонят любой рантайм с
`name`, отличным от `"local"`.

```python
from typing import ClassVar
from mmar_carl import RuntimeCapabilities, register_skill_runtime, list_skill_runtimes

class MySandbox:
    name: ClassVar[str] = "mysandbox"
    capabilities: ClassVar[RuntimeCapabilities] = RuntimeCapabilities(
        isolation="container", wall_time="enforced", network_none="enforced",
    )
    async def prepare(self, skill, workspace, config): ...           # -> SkillRuntimeHandle
    async def run(self, handle, cmd, *, env=None, stdin=None, timeout=None, cwd=None): ...
    async def read_file(self, handle, path): ...
    async def read_file_bounded(self, handle, path, max_bytes, timeout=None): ...
    async def write_file(self, handle, path, data): ...
    async def cleanup(self, handle): ...                              # idempotent

register_skill_runtime(MySandbox.name, MySandbox)
list_skill_runtimes()   # ['docker', 'e2b', 'firejail', 'local', 'mysandbox']
```

Протокол `SkillRuntime` требует `name`, `capabilities` и шесть async-методов
выше. `run` возвращает `RuntimeRunResult` (`stdout`, `stderr`, `exit_code`,
`duration_s`, флаги обрезки). Рантайм без объявленных возможностей считается
`unsupported` по всем контролям. `register_skill_runtime` перезаписывает
существующее имя, `get_skill_runtime` для неизвестного имени выбрасывает
`SkillRuntimeError`.

## См. также

- [Обзор AgentSkills](/ru/carl/skills/overview/) · [Резолверы](/ru/carl/skills/resolvers/)
- [CommandStep](/ru/carl/steps/command/) · [ShellSessionStep](/ru/carl/steps/shell-session/) · [CodeStep](/ru/carl/steps/code/)
