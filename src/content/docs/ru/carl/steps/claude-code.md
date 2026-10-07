---
title: Шаг Claude Code
description: Делегирование одного шага цепочки агенту Claude Code CLI без интерфейса. Конфиг, рабочая область, учётные данные, лимиты и сбои.
sidebar:
  order: 20
---

`ClaudeCodeStepDescription` передаёт целую подзадачу агенту
[Claude Code](https://docs.claude.com/en/docs/claude-code), работающему без
интерфейса. CARL запускает CLI `claude` в режиме print как подпроцесс и собирает
итоговый ответ, id сессии, расход токенов и стоимость.

Чем он отличается от других агентных шагов:

- [`llm`](/ru/carl/steps/llm/) делает одно завершение.
- [`agent`](/ru/carl/steps/agent/) — цикл под управлением CARL над инструментами, **которые зарегистрировали вы**, с бюджетами CARL на каждый вызов.
- `claude_code` отдаёт задачу автономному агенту для работы с кодом с **его собственными** инструментами (файлы, shell, веб, MCP). CARL видит только итоговый результат.

## Требования

- Claude Code CLI в `PATH` или абсолютный путь в `cli_path`
  (`npm install -g @anthropic-ai/claude-code`).
- В CLI уже должен быть выполнен вход. Аутентификация на стороне хоста: CARL никогда
  не хранит учётные данные в цепочке или контексте.
- Дополнительный Python-пакет не нужен.

Проверьте хост перед запуском:

```python
from mmar_carl import check_claude_code_cli

status = check_claude_code_cli()          # resolves the CLI and runs `claude --version`
print(status.available, status.version, status.error)
```

`chain.preflight(context)` делает более дешёвую проверку. Он перечисляет все
`cli_path`, которые использует цепочка, в `required_claude_code_clis`, а те, что не
разрешаются, в `missing_claude_code_clis`. Вход в CLI он не проверяет.

## Пример

```python
from mmar_carl import ClaudeCodeStepConfig, ClaudeCodeStepDescription

ClaudeCodeStepDescription(
    number=2,
    title="Review the change",
    dependencies=[1],
    config=ClaudeCodeStepConfig(
        task="Review the diff in {path} and list risky changes.",
        input_mapping={"path": "$memory.input.repo_path"},
        cwd="/work/repo",
        allowed_tools=["Read", "Grep", "Bash(git diff:*)"],
        permission_mode="plan",
        max_turns=8,
        timeout=300,
        output_memory_key="review",          # → $memory.claude_code.review
    ),
)
```

Для этого конфига CARL запускает:

```bash
claude -p "<rendered task>" --output-format json --max-turns 8 \
  --allowedTools Read,Grep,Bash(git diff:*) --permission-mode plan
```

## ClaudeCodeStepConfig

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `task` | `str` | обязательно | Промпт для агента. При непустом `input_mapping` это шаблон `str.format`, и каждому `{placeholder}` нужна запись. При пустом маппинге передаётся как есть. |
| `input_mapping` | `dict[str, str]` | `{}` | Плейсхолдер → источник. `$…` — [ссылка](/ru/carl/chains/dynamic-references/), строка в кавычках — литерал, всё остальное передаётся как есть. Нестроковые значения кодируются в JSON. Ссылка, которая разрешается в `None`, превращается в пустую строку. |
| `cli_path` | `str` | `"claude"` | Исполняемый файл CLI (имя в `PATH` или путь). |
| `cwd` | `str \| None` | `None` | Рабочий каталог, то есть корень проекта агента. `None` — cwd процесса хоста. |
| `model` | `str \| None` | `None` | `--model` (например, `sonnet`, `opus`). |
| `max_turns` | `int \| None` | `None` | `--max-turns`, не меньше 1. |
| `allowed_tools` | `list[str]` | `[]` | `--allowedTools`, например `["Read", "Grep", "Bash(git log:*)"]`. |
| `disallowed_tools` | `list[str]` | `[]` | `--disallowedTools`. |
| `permission_mode` | `str \| None` | `None` | `--permission-mode`: `default`, `acceptEdits`, `bypassPermissions` или `plan`. CARL значение не проверяет. |
| `system_prompt` | `str \| None` | `None` | `--system-prompt` (заменяет промпт CLI по умолчанию). |
| `append_system_prompt` | `str \| None` | `None` | `--append-system-prompt`. |
| `add_dirs` | `list[str]` | `[]` | Дополнительные каталоги (`--add-dir`, по одному флагу на каталог). |
| `resume_session` | `str \| None` | `None` | Сессия для продолжения (`--resume`). Ссылка с `$` разрешается во время выполнения. |
| `stream` | `bool` | `False` | Использовать `--output-format stream-json --verbose` и передавать каждый текстовый блок ассистента в `context.on_llm_chunk`. |
| `extra_cli_args` | `list[str]` | `[]` | Сырые аргументы argv, добавляются последними. |
| `env` | `dict[str, str]` | `{}` | Дополнительные переменные окружения для процесса CLI. |
| `timeout` | `float` | `600.0` | Бюджет реального времени в секундах (> 0). По истечении процесс убивается. |
| `max_output_chars` | `int` | `20000` | Предел обрезки ответа в результате шага и в истории. |
| `store_session_key` | `str \| None` | `None` | Ключ памяти для id сессии в пространстве имён `claude_code`. `None` — `step_<number>`. |
| `output_memory_key` | `str \| None` | `None` | Ключ памяти для итогового ответа (разобранный объект, если задана `output_schema`). |
| `output_namespace` | `str` | `"claude_code"` | Пространство имён для `output_memory_key`. |
| `output_schema` | `dict \| None` | `None` | JSON Schema. Итоговый ответ должен содержать подходящий JSON-payload, иначе шаг падает. |

## Рабочая область и права

- Агент работает в `cwd` с теми инструментами и правами, которые разрешают флаги CLI.
  CARL не добавляет своей песочницы.
- Процесс CLI **наследует окружение хоста** (`os.environ`) плюс `env`. Любой секрет
  в окружении хоста виден агенту.
- Флаги, которые выдают права (`permission_mode`, `allowed_tools`,
  `extra_cli_args`, `env`, `add_dirs`), **входят в сериализованную цепочку**.
  Цепочка может запросить `bypassPermissions`. В отличие от шагов `command` и `code`,
  здесь нет объекта политики на стороне хоста, который бы их ограничивал. Проверяйте
  цепочки с шагами `claude_code` перед запуском, а недоверенные запускайте в
  одноразовой копии репозитория или контейнере.
- `cache` для этого типа шага отклоняется: агент может читать или менять состояние
  рабочей области, поэтому закэшированный результат был бы неверным.

## Результат

При успехе:

| Где | Что |
| --- | --- |
| `result` | Итоговый ответ агента (обрезан до `max_output_chars`). Также добавляется в историю с тегом `[CLAUDE CODE]`. |
| `result_data["session_id"]` | Id сессии. Также записывается в `$memory.claude_code.step_<n>` (или `store_session_key`). |
| `result_data["num_turns"]`, `["total_cost_usd"]`, `["duration_ms"]`, `["usage"]` | Как сообщает CLI. |
| `result_data["structured_output"]` | Разобранный JSON, если задана `output_schema`, иначе `None`. |
| `result_data["payload"]` | Сырой объект результата CLI, включая полный текст ответа. |
| `token_usage` | `{prompt, completion, total}`. `prompt` включает токены создания и чтения кэша. |

### Продолжение одной сессии в нескольких шагах

```python
ClaudeCodeStepDescription(
    number=3,
    title="Fix what the review found",
    dependencies=[2],
    config=ClaudeCodeStepConfig(
        task="Fix the risky changes you listed.",
        cwd="/work/repo",
        permission_mode="acceptEdits",
        resume_session="$memory.claude_code.step_2",
    ),
)
```

## Сбои

Шаг возвращает `success=False` с `error_message`, когда:

- CLI не найден (`Claude Code CLI not found at 'claude'…`);
- CLI завершается с ненулевым кодом или не печатает разбираемый JSON;
- CLI сообщает `is_error` (сообщение включает его `subtype`, например лимит ходов);
- истекает `timeout` (процесс убивается);
- у `{placeholder}` в `task` нет записи в `input_mapping`;
- `resume_session` — ссылка, которая разрешается в пустое значение;
- задана `output_schema`, а в ответе нет подходящего JSON-payload.

Подробности ошибки обрезаются до 500 символов.

## Стоимость

`estimate_chain_cost` не моделирует этот шаг: расходы внешние, и их определяет агент.
Смотрите `result_data["total_cost_usd"]` после запуска.

## См. также

- [Шаг Codex](/ru/carl/steps/codex/): та же идея через Codex SDK, с песочницей только для чтения по умолчанию.
- [Agent-шаг](/ru/carl/steps/agent/): ограниченный цикл над вашими зарегистрированными инструментами.
- [Пример](https://github.com/Glazkoff/carl/blob/pre-release/examples/agents/claude_code_step_example.py) в репозитории.
