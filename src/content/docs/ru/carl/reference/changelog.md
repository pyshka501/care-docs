---
title: История изменений
description: Заметки о релизах mmar-carl, от новых к старым.
sidebar:
  order: 2
---

Заметки по версиям. Полная версия лежит в репозитории:
[`RELEASE.md`](https://github.com/Glazkoff/carl/blob/main/RELEASE.md).

## 0.5.0

CARL 0.5.0 выходит вместе с Maestro 0.5.0. В него входят три линии работы:
релиз 0.4.0, перечисленные ниже pull request'ы и контракты хоста, которые
нужны Maestro для запуска цепочек.

### Типы шагов

- `ClaudeCodeStepDescription` (`claude_code`) передаёт шаг headless-агенту
  Claude Code CLI. `check_claude_code_cli()` проверяет, установлен ли CLI
  (#24). См. [шаг Claude Code](/ru/carl/steps/claude-code/).
- `CodexStepDescription` (`codex`) передаёт шаг локальному агенту Codex SDK.
  `check_codex_runtime()` проверяет, доступна ли среда (#25).
  См. [шаг Codex](/ru/carl/steps/codex/).
- Формат цепочки 10 описывает эти два типа. В `PreflightReport` появились
  `required_claude_code_clis` / `missing_claude_code_clis` и
  `required_codex_runtimes` / `missing_codex_runtimes`.
- В релиз входят и типы шагов из 0.4.0: `wait` (#19), типизированный
  жизненный цикл `human_input` (#20), встроенные chain tools (#21),
  ограниченный `map` (#22), строгий `code` (#23). См. [0.4.0](#040) ниже.

### Многоагентные шаги

- **Топология субагентов сериализуется** (#27). `to_dict()` пишет
  `AgentHandoffStepDescription.sub_chain`, `SupervisorStepDescription.agents`
  и `ParallelSamplingStepDescription.base_step` как вложенные снимки цепочек.
  При загрузке восстанавливаются настоящие объекты, а не заглушки
  `__placeholder__`. Глубина вложенности не больше 8. Цепочка, которая
  встраивает сама себя, отклоняется с `ValueError`. Формат цепочки 11.
  Цепочки формата 10 и старше загружаются с прежними заглушками.
- **Агрегация стала корректной и наблюдаемой** (#28). В
  `ParallelSamplingStepConfig` появились `answer_extractor`,
  `vote_normalization` (`VoteNormalization`) и `strict`. Каждый исход
  помечается в `result_data["aggregation_outcome"]`, каждый fallback пишет
  предупреждение. Supervisor больше не ищет имя агента как подстроку, если не
  задан `allow_substring_match=True`. Это единственное намеренное изменение
  поведения по умолчанию. Debate получил `judge_llm_config`,
  `stop_when_unchanged`, `convergence_predicate` и сообщает
  `rounds_executed`.

### Эволюция

- **Мутации топологии взаимодействия** (#30): шесть новых значений
  `MutationKind` (`wrap_in_sampling`, `wrap_in_debate`, `wrap_in_handoff`,
  `split_to_supervisor`, `insert_human_gate`, `unwrap_collaboration`). Каждое
  включается только своим пулом или флагом в `ChainMutator`.
- **Кроссовер подграфов с учётом DAG** (#31): `ChainCrossover` и
  `ChainEvolver(crossover_rate=...)`. Значение по умолчанию `0.0` оставляет
  прогоны с фиксированным seed такими же, как раньше. Потомки помечаются
  `CROSSOVER_KIND`.
- См. [Эволюция](/ru/carl/evolution/overview/).

### Трассировка

- `ExecutionTrace` стал записью атрибуции по агентам (#29). В `TraceEvent`
  есть `inputs` (разрешённые значения `input_mapping`), `model`, `prompt` по
  явному включению (`ReasoningContext(trace_prompts=True)`), измеренные
  `started_at` / `ended_at` и вложенный `sub_trace` для шагов handoff и
  supervisor. `ExecutionTrace.from_dict` / `TraceEvent.from_dict`
  восстанавливают всё это. См. [Трассировка](/ru/carl/tracing/overview/).

### Память

- Исправления слияния памяти параллельных шагов (#32). Хранилище
  copy-on-write теперь отслеживает ключи, которые шаг записал или удалил, а не
  целые пространства имён. Шаг, который только читал, больше не откатывает
  запись соседа. Вложенные значения больше не общие между соседями. Слитые
  записи проверяются по `memory_schema`. Конфликт по одному ключу решается
  так: побеждает последняя запись в порядке объявления шагов. См.
  [Copy-on-write](/ru/carl/memory/cow/).

### LLM-клиенты

- Исполнитель больше не закрывает LLM-клиент, которым не владеет (#33).
  Копии контекста для шагов теперь вызывают
  `ReasoningContext.close_derived_clients()`. Он закрывает только клиенты,
  созданные контекстом для переопределений `llm_config`. До исправления
  цепочки с общим `OpenAICompatibleClient` (например, при оценке на датасете)
  теряли запросы с `APIConnectionError`.

### Контракты хоста для Maestro

- **`fail_fast`** в `ReasoningChain`, `ChainBuilder.with_fail_fast()` и
  `DAGExecutor`. После первого окончательно упавшего шага новые шаги не
  стартуют, остальные помечаются пропущенными. Итог лежит в
  `result.metadata["fail_fast"]`. Флаг сохраняется в `to_dict()`.
- **Подтверждённая пауза.** `is_paused()` равен `True`, только когда
  планировщик ждёт и ни один шаг не выполняется. `paused_duration()`
  показывает время простоя. Продолжение не перезапускает готовые шаги.
  `cancel()` будит приостановленный прогон. `timeout` цепочки считает только
  активное время.
- **Вход хоста.** `ReasoningContext.runtime_input` хранит проверенный
  структурированный вход отдельно от текста промпта. `$outer_context`
  разрешается в него, `$outer_context.<field>` читает поле. `runtime_input`
  теперь копируется в снимки контекста для шагов, поэтому ссылки работают
  внутри `chain.execute()`. Флаг ABI `HOST_RUNTIME_INPUT_ABI = 1`.
- **Контракты входа.** Если обязательный параметр инструмента разрешился в
  `None`, шаг падает до вызова инструмента с
  `CARL_TOOL_INPUT_UNRESOLVED: required parameter '<name>' resolved to null`.
  `StructuredOutputStepConfig.input_mapping` и
  `HumanInputStepConfig.prompt_input_mapping` ограничивают то, что видит
  модель или человек (флаги ABI `STRUCTURED_OUTPUT_SCOPED_INPUTS_ABI`,
  `HUMAN_INPUT_SCOPED_PROMPT_ABI`).
- **Версионированные chain tools.** `ChainToolDefinition.required_tool_revisions`
  закрепляет инструмент хоста за ревизией. Среда сравнивает её с
  `__carl_tool_revision__` у функции и при расхождении помечает дочернюю
  цепочку как недоступную.

См. [Управление прогоном](/ru/carl/chains/run-controls/),
[Динамические ссылки](/ru/carl/chains/dynamic-references/) и
[Интеграция с Maestro](/ru/carl/care-integration/overview/).

### Известные ограничения

- Путь по умолчанию `from_json()` / `load()` восстанавливает типы `llm`,
  `tool`, `mcp`, `memory`, `transform`, `conditional`, `structured_output`,
  `command`, `shell_session` как legacy `StepDescription`. Для типизированных
  объектов используйте `from_dict_typed()`. См.
  [JSON-сериализация](/ru/carl/serialization/json/).
- `max_injections`, `memory_schema`, `step_groups`, метрики и шаблон промпта
  не сериализуются.
- `VectorSearchStrategy` игнорирует `embedding_model`. Модель эмбеддингов
  всегда `sentence-transformers/all-MiniLM-L6-v2`.
- `StepDescription.to_typed_step()` теряет `retry_max` и `timeout`.

## 0.4.0

Релиз исполнения (2026-08-27). Правило релиза: сериализованная цепочка это
вход, а не источник полномочий. Разрешения хост выдаёт во время запуска.

- **Семь типов шагов**: `agent` (ограниченный цикл с инструментами и явным
  `finish`), `code` (одна точная сгенерированная функция Python `run(inputs)`
  в профиле песочницы, #23), `wait` (таймер, событие, any-of, #19), `map`
  (ограниченный упорядоченный fan-out по JSON-массиву, #22), `command_plan`,
  `command` (argv через среду навыков, бывший `bash`) и `shell_session`.
- **Полномочия хоста**: `CommandPolicy`, `CommandCapabilityRegistry`,
  `NetworkEnforcer`, `CodeExecutionPolicy` живут в `ReasoningContext` и
  никогда не пишутся в JSON цепочки.
- **Цепочка как инструмент** (#21): `ChainToolDefinition` встраивает снимок
  цепочки как изолированный ограниченный инструмент. Результат приходит как
  `ChainToolOutcome`.
- **Жизненный цикл HumanInputStep** (#20, ломающее изменение):
  `fallback_value` удалён. Провайдер хоста имеет вид
  `async (HumanInputRequest) -> HumanInputResponse`.
  `as_human_input_outcome()` возвращает типизированный статус.
- **Structured output проверяется** по JSON Schema. Неверные схемы и
  удалённые `$ref` падают до вызова провайдера. `jsonschema` стал основной
  зависимостью.
- **Телеметрия LLM**: `get_response_with_tools_and_usage()`. Кассеты пишут
  usage. Битые аргументы tool call сохраняются как исходная строка.
- **Сериализация**: формат цепочки 1 → 9 с лестницей миграций
  (`ReasoningChain.migrate`). `loop_back_to`, `loop_config` и `triggered_by`
  сохраняются.
- **Переносимые артефакты** (`ArtifactInput` / `ArtifactOutput` /
  `ArtifactRecord`) и отчёты о применении ограничений в средах навыков.

## 0.3.0

2026-06-02. Многоагентные шаги ([handoff](/ru/carl/orchestration/handoff/),
[supervisor](/ru/carl/orchestration/supervisor/),
[debate](/ru/carl/orchestration/debate/),
[parallel sampling](/ru/carl/orchestration/parallel-sampling/),
[ввод человека](/ru/carl/orchestration/human-in-the-loop/)). Песочницы для
[AgentSkill](/ru/carl/skills/overview/). `ExecutionTrace`, диаграммы Ганта и
HTML-проигрыватель. `ChainBuilder.from_description` и `ChainEvolver`.
`AnthropicClient`. [Запись и воспроизведение](/ru/carl/llm/record-replay/).
Оценка стоимости. Оценка на датасетах. [MCP](/ru/carl/mcp/overview/) вышел из
экспериментального статуса. Пауза, продолжение и отмена. Preflight,
`RunRecord` и метаданные цепочки для Maestro.

## 0.2.0

2026-04-15. Переработка LLM-клиентов (удалён `mmar-llm-mapi`), запуск
примеров, исправления условных шагов, сериализации и input mapping.

## 0.1.0

Типизированные классы шагов, структурированное логирование, таймаут цепочки,
повторы шага, OpenAI-совместимый API, LLM-настройки шага, режимы FAST /
SELF_CRITIC, RE-PLAN на уровне цепочки, метрики оценки.

## См. также

- [Миграция: legacy → типизированные шаги](/ru/carl/serialization/migration/)
- [Справочник API](/ru/carl/reference/api/)
