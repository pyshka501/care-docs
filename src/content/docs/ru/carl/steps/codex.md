---
title: Шаг Codex
description: Делегирование одного шага цепочки локальному агенту Codex через Codex SDK. Песочница, учётные данные, лимиты и сбои.
sidebar:
  order: 21
---

`CodexStepDescription` передаёт целую подзадачу локальному агенту Codex. CARL
управляет им через необязательный Python SDK `openai-codex`, который запускает
локальный процесс app-server Codex. Шаг собирает итоговый ответ, id треда и расход
токенов.

Интерфейс повторяет [шаг Claude Code](/ru/carl/steps/claude-code/): тот же шаблон
`task` + `input_mapping`, `output_schema`, `output_memory_key` и продолжение сессии.
Модель прав строже: цепочка может выбрать только песочницу `read-only` или
`workspace-write`, а каждый запрос на подтверждение отклоняется.

## Требования

```bash
pip install 'mmar-carl[codex]'     # openai-codex>=0.147.0, also in mmar-carl[all]
codex login                        # authentication stays in the host's Codex install
```

Проверьте хост перед запуском:

```python
from mmar_carl import check_codex_runtime

status = check_codex_runtime()
print(status.available, status.sdk_version, status.cli_path, status.error)
```

`available` равно `True`, если SDK импортируется. `cli_path` (бинарник `codex` в
`PATH`) носит справочный характер. Ни одна из проверок не проверяет вход.
`chain.preflight(context)` выполняет ту же проверку SDK и сообщает `openai-codex` в
`missing_codex_runtimes`, если пакет не установлен.

## Пример

```python
from mmar_carl import CodexStepConfig, CodexStepDescription

CodexStepDescription(
    number=2,
    title="Draft the fix",
    dependencies=[1],
    config=CodexStepConfig(
        task="Fix the failing test described here:\n{report}",
        input_mapping={"report": "$history[-1]"},
        cwd="/work/repo",
        sandbox="workspace-write",        # opt in to file edits
        reasoning_effort="medium",
        timeout=600,
        output_memory_key="fix_summary",  # → $memory.codex.fix_summary
    ),
)
```

## CodexStepConfig

Неизвестные поля отклоняются (`extra="forbid"`).

| Поле | Тип | По умолчанию | Назначение |
| --- | --- | --- | --- |
| `task` | `str` | обязательно | 1–16 000 символов, непустое. При непустом `input_mapping` это шаблон `str.format`. Алиас в формате цепочки: `instruction`. |
| `input_mapping` | `dict[str, str]` | `{}` | До 32 записей. Имена должны быть идентификаторами. Источники непустые, не длиннее 2048 символов. `$…` — [ссылка](/ru/carl/chains/dynamic-references/), строка в кавычках — литерал. |
| `cwd` | `str \| None` | `None` | Рабочий каталог для треда Codex. Должен существовать. |
| `sandbox` | `"read-only" \| "workspace-write"` | `"read-only"` | Файловая песочница. Полный доступ не поддерживается. |
| `model` | `str \| None` | `None` | Переопределение модели. `None` — модель локального Codex по умолчанию. |
| `reasoning_effort` | `none`, `minimal`, `low`, `medium`, `high`, `xhigh` или `None` | `None` | Переопределение уровня рассуждений. |
| `developer_instructions` | `str \| None` | `None` | Инструкции разработчика от хоста, не длиннее 16 000 символов. |
| `resume_session` | `str \| None` | `None` | Id треда для продолжения. Ссылка с `$` разрешается во время выполнения. Алиас в формате цепочки: `thread_id_source`. |
| `ephemeral` | `bool` | `True` | Не сохранять новый тред в постоянной истории Codex. |
| `timeout` | `float` | `300.0` | Бюджет на весь шаг в секундах, включая запуск рантайма. `0 < timeout ≤ 3600`. Алиас в формате цепочки: `timeout_seconds`. |
| `max_input_bytes` | `int` | `131072` | Лимит на отрисованную задачу в байтах UTF-8 (от 1 КиБ до 1 МиБ). |
| `output_memory_key` | `str \| None` | `None` | Ключ памяти для итогового ответа (разобранный объект, если задана `output_schema`). |
| `output_namespace` | `str` | `"codex"` | Пространство имён для `output_memory_key`. |
| `output_schema` | `dict \| None` | `None` | JSON Schema. Итоговый ответ должен содержать подходящий JSON-payload, иначе шаг падает. |
| `store_session_key` | `str \| None` | `None` | Ключ памяти для id треда в пространстве имён `codex`. `None` — `step_<number>`. Алиас в формате цепочки: `store_thread_key`. |

## Рабочая область и права

- По умолчанию `sandbox="read-only"`. Для редактирования файлов нужно явно указать
  `workspace-write`.
- Запуски без интерфейса используют `ApprovalMode.deny_all`: агент не может
  приостановить цепочку, чтобы запросить больше прав.
- Учётные данные, переопределения окружения, произвольные аргументы запуска и
  политика подтверждений **не входят** в сериализованный конфиг.
- Политики на стороне хоста, которая ограничивала бы выбор `cwd` в цепочке или
  разрешение `workspace-write`, пока нет. Если вы запускаете чужие цепочки, проверяйте
  эти два поля.
- `cache` для этого типа шага отклоняется.

## Результат

При успехе:

| Где | Что |
| --- | --- |
| `result` | Итоговый ответ. Также добавляется в историю с тегом `[CODEX]`. |
| `result_data["session_id"]` / `["thread_id"]` | Id треда (одно и то же значение). Также записывается в `$memory.codex.step_<n>` (или `store_session_key`). |
| `result_data["turn_id"]`, `["status"]` | Завершённый ход. |
| `result_data["sandbox"]`, `["cwd"]`, `["configured_model"]` | Что запросил шаг. |
| `result_data["resumed"]`, `["ephemeral"]` | Был ли тред продолжен (в этом случае `ephemeral` равно `None`). |
| `result_data["usage"]` | Сырой расход от SDK. |
| `result_data["structured_output"]` | Разобранный JSON, если задана `output_schema`, иначе `None`. |
| `token_usage` | `{prompt, completion, total}` из общего расхода хода. |
| `model` | Заданное переопределение, если есть (SDK не сообщает фактическую модель). |

### Продолжение одного треда в нескольких шагах

```python
CodexStepConfig(
    task="Now add a regression test for that fix.",
    resume_session="$memory.codex.step_2",
    sandbox="workspace-write",
)
```

## Сбои

Шаг возвращает `success=False` с `error_message`, когда:

- SDK не установлен (`Optional dependency 'openai_codex' not found…`);
- `cwd` не существующий каталог;
- у `{placeholder}` нет записи в `input_mapping` или отрисованная задача превышает
  `max_input_bytes`;
- `resume_session` — ссылка, которая разрешается в пустое значение;
- ход завершается со статусом, отличным от `completed`, или сообщает об ошибке;
- истекает `timeout` (`Codex turn timed out after …s`);
- задана `output_schema`, а в ответе нет подходящего JSON-payload.

Текст ошибки обрезается до 500 символов.

## Ограничения

- Стриминга нет: SDK возвращает один завершённый ход, поэтому `on_llm_chunk` ничего
  не получает.
- `estimate_chain_cost` не моделирует этот шаг. Смотрите `result_data["usage"]` после
  запуска.
- Каждый шаг запускает свой локальный app-server, что добавляет задержку на старт.

## См. также

- [Шаг Claude Code](/ru/carl/steps/claude-code/): та же идея через CLI `claude`, со стримингом.
- [Agent-шаг](/ru/carl/steps/agent/): ограниченный цикл над вашими зарегистрированными инструментами.
- [Пример](https://github.com/Glazkoff/carl/blob/pre-release/examples/agents/codex_step_example.py) в репозитории.
