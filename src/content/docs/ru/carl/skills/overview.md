---
title: Обзор AgentSkills
description: Запуск переносимой папки AgentSkill (SKILL.md, скрипты и справочники) как шага цепочки в одном из пяти режимов.
sidebar:
  order: 1
---

[AgentSkills](https://agentskills.io) — переносимые папки навыков. В папке лежит
`SKILL.md` с YAML-frontmatter и инструкциями, а также необязательные `scripts/`,
`references/` и `assets/`. `AgentSkillStepDescription` запускает один навык как
шаг цепочки.

```python
from mmar_carl import (
    AgentSkillStepDescription, AgentSkillStepConfig, AgentSkillExecutionMode,
)

AgentSkillStepDescription(
    number=1,
    title="Extract PDF text",
    config=AgentSkillStepConfig(
        skill="github://anthropics/skills/skills/pdf@main",
        task="Extract the text from {pdf_path} and summarise it.",
        execution_mode=AgentSkillExecutionMode.LLM_AGENT,
        input_mapping={"pdf_path": "$memory.input.pdf_path"},
    ),
)
```

Базовый пакет запускает навыки без extras. Необязательные extras:

```bash
pip install 'mmar-carl[agent-skills]'   # agent-skills library for SkillLoader.catalog_from_agent_skills()
pip install 'mmar-carl[skills]'         # agent-skills + pdf + pptx (the PDF -> PPTX example)
```

:::caution[Навыки выполняются на хосте]
В CARL 0.5.0 шаг AgentSkill запускает скрипты только с `runtime="local"`. Это
подпроцесс на хосте без изоляции. С `docker`, `e2b` или `firejail` запуск
скрипта падает. Запускайте только навыки, которым доверяете. Недоверенный код
запускайте в песочнице через фиксированный [CommandStep](/ru/carl/steps/command/).
Подробности: [Песочница и LLM_AGENT](/ru/carl/skills/sandbox/).
:::

## Идентификатор навыка

`skill` принимает строку или `AgentSkillSource`. Строка превращается в
`AgentSkillSource` при создании конфига:

| Строка | Во что превращается | Как шаг загружает навык |
| --- | --- | --- |
| `github://owner/repo/path@ref` | `git_url` + `git_subdirectory` + `git_ref` | Tarball с GitHub через `GithubResolver`, `git` не нужен. Ref по умолчанию `main`. |
| `/abs/path`, `./rel`, `../rel`, `local:///abs/path`, строка с `/` в конце | `path` | Папка с `SKILL.md`. |
| `module://pkg.name` | `package` | Папка пакета или `<pkg>/skills/<последнее-имя>/`. |
| `https://...`, `http://...`, `git@...` | `git_url` | `https://github.com/...` идёт через `GithubResolver`. Любой другой URL клонируется через `git clone --depth=1`. |
| любая другая строка, например `pdf` | `name` | Поиск в `search_paths`, затем в `./.agents/skills`, `./.claude/skills`, `~/.agents/skills`, `~/.claude/skills`. |

URL архива вроде `https://host/skill.tar.gz` шаг **не** скачивает: он считает его
git-адресом. Архивы скачивайте через [`resolve_skill()`](/ru/carl/skills/resolvers/)
и передавайте локальный путь.

## Режимы выполнения

| Режим | Поведение |
| --- | --- |
| `LLM` (по умолчанию) | `SKILL.md` идёт в системный промпт. Один вызов LLM, задача идёт как реплика пользователя. |
| `SCRIPT` | Запускает один скрипт `.py` или `.sh` из навыка, без LLM. Скрипт выбирает `script_name`. Без него в навыке должен быть ровно один скрипт. Входы передаются как `--key value`. Ненулевой код выхода роняет шаг. |
| `HYBRID` | Сначала скрипт. Если он упал, выбросил исключение или ничего не напечатал, работает режим `LLM`. |
| `SUBAGENT` | Скрипт, затем LLM рассуждает над его выводом. Если скрипт упал, LLM всё равно запускается, с пометкой об ошибке. |
| `LLM_AGENT` | Цикл вызовов инструментов. Инструментов ровно пять: `run_script`, `read_file`, `write_file`, `list_resources`, `read_resource`. Не больше `llm_max_iterations` раундов. См. [песочницу и LLM_AGENT](/ru/carl/skills/sandbox/). |

`LLM_AGENT` нужен клиент с реализацией `get_response_with_tools`. Базовая
реализация не возвращает вызовов инструментов. С таким клиентом цикл
заканчивается после одного обычного вызова LLM.

:::caution[`allowed-tools` не применяется]
Поле `allowed-tools` из `SKILL.md` печатается в системный промпт как
`**Allowed tools**: ...`, и всё. `LLM_AGENT` всегда даёт модели те же пять
инструментов, что бы навык ни объявлял. Единственное использование
`allowed-tools` во время работы: хосты из `WebFetch(domain:...)` попадают в
сетевой allowlist. Локальный рантайм его тоже не применяет.
:::

## Поля конфига

Все поля `AgentSkillStepConfig` и их значения по умолчанию в 0.5.0:

| Поле | По умолчанию | Назначение |
| --- | --- | --- |
| `skill` | обязательно | Строка или `AgentSkillSource` (см. выше). |
| `task` | обязательно | Текст задачи. Плейсхолдеры `{key}` заполняются из `input_mapping`. |
| `execution_mode` | `LLM` | Один из пяти режимов. |
| `input_mapping` | `{}` | Имя → [ссылка](/ru/carl/chains/dynamic-references/) (`$history[-1]`, `$memory.ns.key`, ...). |
| `output_key` | `"result"` | Метка результата. |
| `output_memory_key` | `None` | Если задан, текстовый результат пишется в память под этим ключом. |
| `output_memory_namespace` | `"agent_skill"` | Пространство имён для `output_memory_key`. |
| `output_file_key` | `None` | Если задан, путь к первому выходному файлу пишется в `agent_skill.<key>`. |
| `llm_config` | `None` | Переопределение LLM для шага. |
| `system_prompt_prefix` | `None` | Текст перед инструкциями навыка. |
| `include_skill_description` | `True` | Включать `description` из frontmatter. |
| `max_instructions_chars` | `3000` | Обрезка инструкций. `None` снимает лимит. |
| `strip_code_blocks` | `True` | Убирать блоки кода из инструкций. |
| `filter_security_terms` | `True` | Убирать разделы, в заголовках которых есть password / encrypt / decrypt / crypt, и такие пункты из описания. |
| `script_name` | `None` | Скрипт для `SCRIPT` / `HYBRID` / `SUBAGENT`, путь от папки навыка. |
| `script_args` | `{}` | Статические аргументы `--key value`, сливаются с входами. |
| `python_executable` | `"python"` | Интерпретатор для `.py`. |
| `working_dir` | `None` | Рабочая папка скрипта. По умолчанию папка навыка. |
| `cache_skills` | `True` | Кэшировать разобранные манифесты в загрузчике. |
| `skill_cache_dir` | `None` | Кэш для `git clone` (по умолчанию `~/.cache/mmar_carl/skills`). Tarball с GitHub всегда идут в кэш по умолчанию. |
| `timeout` | `120.0` | Секунды на запуск скрипта. |
| `llm_max_iterations` | `8` | Максимум раундов в `LLM_AGENT`. |
| `persist_workspace` | `False` | `LLM_AGENT`: не удалять рабочую папку и записать её путь в `agent_skill.<output_memory_key или title>_workspace`. |
| `output_capture` | `"both"` | `LLM_AGENT`: `"stdout"`, `"files"` или `"both"`. |
| `output_files_glob` | `["*"]` | `LLM_AGENT`: какие файлы из `out/` собирать. |
| `runtime` | `"local"` | Рантайм скриптов. Для этого шага работает только `local`, см. [песочницу](/ru/carl/skills/sandbox/). |
| `runtime_config` | `{}` | Ключи сетевой политики (`network`, `network_allowlist`). Проверяются, но на `local` не применяются. |
| `trust_policy` | `"any"` | `"any"` или `"sha_pinned"`. **Шаг это не проверяет**, см. ниже. |
| `skill_sha256` | `None` | Ожидаемый хэш `SKILL.md`. **Шаг это не проверяет.** |
| `extra_pip` | `[]` | Пакеты ставятся через `pip install --target` во временную папку, которая добавляется в `PYTHONPATH`. Работает на хосте. |
| `output_schema` | `None` | Только `LLM_AGENT`: упрощённая проверка финального ответа по JSON-схеме (`type`, `properties`, `required`, `items`). |
| `output_schema_strict` | `True` | Ошибка разбора или схемы роняет шаг. С `False` она пишется в `schema_warnings`. |

:::caution[Шаг не проверяет пиннинг]
`trust_policy` и `skill_sha256` хранятся и сериализуются, но исполнитель шага их
не читает. Шаг с `trust_policy="sha_pinned"` и неверным хэшем всё равно
выполнится. Чтобы закрепить навык, вызовите
[`resolve_skill(..., sha256=..., trust_policy="sha_pinned")`](/ru/carl/skills/resolvers/)
сами до сборки цепочки и передайте проверенный локальный путь в `skill`.
:::

## Результат

В `result_data` лежат `skill_name` и `execution_mode`, плюс ключи режима:
`stderr` / `returncode` для `SCRIPT`, `script_used` / `llm_fallback` /
`script_error` для `HYBRID`, а для `LLM_AGENT` — `iterations`,
`tool_calls_made`, `output_files`, `parsed_output`, `schema_validated`,
`schema_warnings`, `workspace_root`. Запись в истории помечена `[skill:<name>]`.

## Сериализация и preflight

Шаги AgentSkill проходят круг `chain.to_dict()` / `from_dict()`. Навык
сохраняется в виде `AgentSkillSource` после преобразования (например,
`git_url` + `git_subdirectory`), а не исходной строкой URI. См.
[JSON-сериализацию](/ru/carl/serialization/json/).

`chain.preflight(context)` перечисляет навыки в `required_skills`.
`missing_skills` всегда пуст: при preflight навыки не разрешаются. См.
[Preflight](/ru/carl/care-integration/preflight/).

## См. также

- [Резолверы навыков](/ru/carl/skills/resolvers/) · [Песочница и LLM_AGENT](/ru/carl/skills/sandbox/)
- [Пример AgentSkill](https://github.com/Glazkoff/carl/blob/main/examples/agents/agent_skill_example.py) (PDF → анализ → PPTX).
