---
title: Песочница и LLM_AGENT
description: Запуск скриптов навыков в изолированном рантайме и модель workspace в режиме LLM_AGENT.
sidebar:
  order: 3
---

Навыки, запускающие скрипты (`SCRIPT`, `HYBRID`, `SUBAGENT`, `LLM_AGENT`),
выполняются в выбранном вами **рантайме**. Выберите песочницу, чтобы сдержать
недоверенный код.

## Рантаймы

Задайте `runtime` в `AgentSkillStepConfig` (с `runtime_config` для опций бэкенда):

| `runtime` | Изоляция |
| --- | --- |
| `local` | Запуск в локальном подпроцессе (наименьшая изоляция). |
| `docker` | Запуск внутри Docker-контейнера. |
| `e2b` | Запуск в облачной песочнице e2b. |
| `firejail` | Запуск под firejail (Linux). |

```python
AgentSkillStepConfig(
    skill="github://anthropics/skills/skills/pdf@main",
    task="Extract text from {pdf_path}.",
    execution_mode=AgentSkillExecutionMode.LLM_AGENT,
    runtime="docker",
    extra_pip=["pdfplumber"],     # ставится перед запуском скриптов
    trust_policy="sha_pinned",    # "any" | "sha_pinned"
)
```

## Сетевая политика

Исходящий трафик рантайма навыка управляется `NetworkPolicy` — одним из трёх
строковых значений, по умолчанию `"none"` (запрет по умолчанию):

| Политика | Эффект |
| --- | --- |
| `none` | Никакого исходящего трафика (по умолчанию). Контейнеризованные бэкенды отключают весь egress (`--network none`); `local`/`firejail` могут лишь задокументировать это. |
| `allowlist` | Только трафик к хостам из `runtime_config["network_allowlist"]` (объединённым с объявлениями `WebFetch(domain:…)` из манифеста навыка). |
| `host` | Полный доступ к сети хоста — аварийная лазейка. Бэкенды логируют `UserWarning` при её выборе. |

Задайте политику через `runtime_config`:

```python
AgentSkillStepConfig(
    skill="github://anthropics/skills/skills/pdf@main",
    task="Fetch and summarise {url}.",
    execution_mode=AgentSkillExecutionMode.LLM_AGENT,
    runtime="docker",
    runtime_config={
        "network": "allowlist",
        "network_allowlist": ["api.example.com"],
    },
)
```

:::caution
**Степень принуждения зависит от бэкенда.** `docker` и `firejail` действительно
применяют политику. Рантайм `local` по умолчанию и `e2b` лишь *соблюдают контракт* —
они валидируют строку политики (некорректное значение приводит к ранней ошибке) и
сохраняют разрешённые политику и allowlist на хендле, но не ограничивают egress.
Флаг `backend["network_enforced"]` на хендле фиксирует, какой из случаев у вас.
:::

### Разрешение политики напрямую

Если вы создаёте кастомный рантайм (ниже), можно переиспользовать те же помощники
разрешения:

```python
from mmar_carl import (
    resolve_network_policy, parse_network_allowlist_from_allowed_tools,
)

# Normalise runtime_config + the manifest's allowed-tools into (policy, hosts).
policy, allowlist = resolve_network_policy(
    runtime_config,
    manifest_allowed_tools=manifest.get_allowed_tools(),
)

# Or pull just the WebFetch(domain:…) hosts out of an allowed-tools declaration.
hosts = parse_network_allowlist_from_allowed_tools("Bash(git:*) WebFetch(domain:api.x.com)")
# → ["api.x.com"]
```

`resolve_network_policy` бросает `SkillRuntimeError` при неизвестной строке политики
и объединяет явный `network_allowlist` с любыми хостами `WebFetch(domain:…)`,
объявленными в манифесте навыка (так манифест становится источником истины о том,
какой egress нужен навыку). `parse_network_allowlist_from_allowed_tools` игнорирует
голый `WebFetch` без домена — неограниченная политика является осознанным выбором
автора цепочки, а не манифеста.

## Workspace режима LLM_AGENT

Режим `LLM_AGENT` соответствует модели прогрессивного раскрытия AgentSkills: LLM
крутит цикл вызовов инструментов (`run_script` / `read_file` / `write_file` /
`list_resources`), пока не сформирует финальный ответ — всё в изолированном workspace.

- Входные файлы из `input_mapping` размещаются в `/workspace/in/`.
- Файлы, записанные LLM в `/workspace/out/`, собираются в `result_data["output_files"]`.
- `output_capture` (`"stdout"` / `"files"` / `"both"`) выбирает, что вернуть.
- `output_files_glob` фильтрует, какие выходные файлы сохранить.
- `llm_max_iterations` ограничивает число раундов вызовов инструментов.

## Доверие

`trust_policy="sha_pinned"` (вместе с `skill_sha256`) проверяет дайджест `SKILL.md`
навыка перед запуском — см. [резолверы](/ru/carl/skills/resolvers/).
`filter_security_terms` (по умолчанию `True`) вырезает разделы про
password/encrypt/decrypt из промпта LLM.

## Кастомные рантаймы

`runtime` диспетчеризуется через реестр, так что вы можете подключить собственную
песочницу, не форкая CARL. Встроенные имена (`local`, `docker`, `e2b`, `firejail`)
саморегистрируются при импорте; дополнительные регистрируйте сами:

```python
from mmar_carl import (
    register_skill_runtime, get_skill_runtime, list_skill_runtimes,
)

class MySkillRuntime:
    name = "mysandbox"
    async def prepare(self, skill, workspace, config): ...    # → SkillRuntimeHandle
    async def run(self, handle, cmd, *, env=None, stdin=None, timeout=None, cwd=None): ...
    async def read_file(self, handle, path): ...
    async def write_file(self, handle, path, data): ...
    async def cleanup(self, handle): ...

register_skill_runtime(MySkillRuntime.name, MySkillRuntime)

list_skill_runtimes()              # ['docker', 'e2b', 'firejail', 'local', 'mysandbox']
runtime = get_skill_runtime("mysandbox")   # instantiates the registered class
```

Рантайм должен удовлетворять `Protocol` `SkillRuntime`: пять асинхронных методов —
`prepare` (создаёт workspace, возвращает `SkillRuntimeHandle`), `run` (выполняет одну
команду, возвращает `RuntimeRunResult`), `read_file`, `write_file` и `cleanup`
(идемпотентная очистка). Хендл протягивается через каждый вызов, чтобы бэкенд мог
оставаться stateful (например, удерживать долгоживущий контейнер), и несёт
`workspace_root` / `workspace_in` / `workspace_out` плюс произвольный словарь
`backend`.

`register_skill_runtime(name, cls)` регистрирует класс (повторная регистрация имени
перезаписывает его). `get_skill_runtime(name)` инстанцирует его и бросает
`SkillRuntimeError` при неизвестном имени (с подсказкой «установите подходящий
extra»); `list_skill_runtimes()` возвращает отсортированные зарегистрированные имена.
Всё это, плюс `NetworkPolicy`, `SkillRuntime`, `SkillRuntimeHandle`,
`RuntimeRunResult` и `SkillRuntimeError`, импортируется из `mmar_carl`.

## Смотрите также

- [Обзор AgentSkills](/ru/carl/skills/overview/) · [Резолверы](/ru/carl/skills/resolvers/)
