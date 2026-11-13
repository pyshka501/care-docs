---
title: Инструменты агента
description: Справочник инструментов автобенчмарка, которые вызывает агент Maestro — maestro_benchmark_* и смежные инструменты наборов, их аргументы, что тратит вызовы модели, где спрашивается подтверждение и где хранятся процессы.
sidebar:
  order: 7
---

Агент Maestro управляет автобенчмарком через MCP-инструменты
`maestro_benchmark_*` (в харнессе Maestro они видны как
`mcp__maestro__maestro_benchmark_*`). Экран **Наборы данных** вызывает те же
инструменты. В каждом ответе есть `status` (`completed`, `unavailable` или
`rejected`), необязательное `message` и `data`.

## Подтверждения

| Инструмент | Вызовы модели | Вызов агентом | Вызов с экрана «Наборы данных» |
| --- | --- | --- | --- |
| `maestro_benchmark_start` | да, в пределах бюджета | **спрашивает** | без окна (кнопка мастера и есть согласие) |
| `maestro_benchmark_control`: `pause`, `resume`, `stop`, `retry_failed` | продолжение тратит токены в одобренном бюджете | без окна | без окна |
| `maestro_benchmark_control`: `extend` | да, новые платные вызовы; бюджет может вырасти | **спрашивает** | без окна |
| `maestro_benchmark_instruct` | один вызов на спецификацию при применении | без окна | без окна |
| `maestro_benchmark_program` | только `revise` (один вызов) | **спрашивает**, на любую операцию | без окна |
| `maestro_benchmark_edit`, `maestro_benchmark_compose` | нет | без окна | без окна |
| `maestro_benchmark_status`, `_list`, `_models`, `_file`, `_dataset` | нет (только чтение) | без окна | без окна |
| `maestro_dataset_import` | нет | без окна | — |

С пресетом одобрения «никогда не спрашивать» окна выше одобряются сами. Без
окна проходят только вызовы, которые создал сам экран приложения; агент этим
путём воспользоваться не может. См. [Подтверждения](/ru/care/app/confirmations/).

## Инструменты

### `maestro_benchmark_start`

Запускает генерацию проверенного набора для задачи или цепочки. Отвечает
сразу, работа идёт в фоне.

| Аргумент | Смысл |
| --- | --- |
| `idempotency_key` | 8–128 символов. Повтор с тем же ключом вернёт тот же процесс. |
| `task` | Задача, до 8 000 символов. Обязательный. |
| `chain` | `{artifact_id, content_sha256}` цепочки, подготовленной в этой сессии. |
| `chain_entity_id` | Цепочка из памяти; используется, если подготовленного артефакта уже нет. |
| `chain_name`, `input_fields`, `output_description`, `tools` | Необязательный контекст. Поля входа по умолчанию берутся из ссылок цепочки `input.<имя>`, иначе `text`. |
| `settings` | Необязательно, см. ниже. |

`settings` (всё необязательно):

| Поле | Значения | По умолчанию |
| --- | --- | --- |
| `target_cases` | 4–500 | 24 |
| `difficulty` | `easier`, `balanced`, `harder` | `balanced` |
| `holdout_fraction` | 0–0.5 | 0.25 |
| `max_total_tokens` | 5 000–5 000 000 | 1 000 000 с Codex, 200 000 с моделью чата |
| `stop_mode` | `target`, `budget`, `calls` | `target` |
| `max_llm_calls` | 1–5000 | обязателен для `calls` |
| `provider` | `codex`, `chat` | Codex, если доступен |
| `model` | имя модели | модель Codex по умолчанию или модель чата |
| `reasoning_effort` | `low`, `medium`, `high` | — |
| `batch_size` | 1–25 | 10 |
| `task_kind` | `text`, `tools` | `text` |
| `strategy` | `llm`, `program` | `llm` |
| `modality` | `text`, `image`, `pdf`, `docx`, `xlsx`, `csv`, `audio` | `text` |
| `check_method` | `auto`, `exact`, `one_of`, `numeric`, `regex`, `json_fields`, `contains_all`, `judge` | `auto` |
| `check_description` | до 4 000 символов | — |
| `check_pattern`, `check_fields` (одно поле), `check_tolerance`, `check_labels` | параметры проверки | — |
| `input_format`, `output_format`, `requirements` | свободный текст | — |

Отказ: файлы без Codex, файлы с `tools`, `program` с `tools` или файлами,
`calls` без `max_llm_calls`.

### `maestro_benchmark_status`

Состояние процесса: стадия, счётчики, события после `after_seq`, версии
спецификации, инструкции, единицы работы, версии набора и, с
`include_cases` (по умолчанию true), последние 1 000 примеров. Эталоны,
обоснования и ответы решателя для закрытой части не возвращаются никогда.

### `maestro_benchmark_list`

Список процессов (`limit` 1–100, по умолчанию 20).

### `maestro_benchmark_control`

`action`: `pause`, `resume`, `stop`, `retry_failed` (можно указать один
`unit_id`) или `extend`. Каждому вызову нужен `request_key`; повтор с ним
вернёт первый результат. Для `extend`: `counts` в виде
`{family_id: сколько ещё}` (до 200 на семейство), `extra_tokens` увеличивает
бюджет (всего не больше 5 000 000).

### `maestro_benchmark_instruct`

Добавляет инструкцию (до 2 000 символов) к идущему или приостановленному
процессу. Применяется в ближайшей безопасной точке и создаёт новую версию
спецификации. Нужен `request_key`.

### `maestro_benchmark_edit`

Правка примеров без вызовов модели. `op`: `update`, `accept`, `exclude`,
`restore`, `move`, `add`; по необходимости с `case_id`, `fields`, `expected`,
`alternatives`, `split`, `family_id`. Изменённые и добавленные примеры
принимаются с уровнем `manual`.

### `maestro_benchmark_compose`

План версии из принятых примеров: `total`, `shares` (`{family_id: вес}`),
`splits` (`{family_id: "search" | "holdout"}`). С `save: true` сохраняет новую
версию, иначе возвращает только план.

### `maestro_benchmark_program`

Программы-генераторы. `op`: `show`, `preview` (запустить `code` или
сохранённую программу на `count` примерах в песочнице), `save` (сохранить
`code` новой версией), `revise` (один вызов модели с `instruction`),
`generate` (ещё `count` примеров, до 2 000, локально). `revise` и `generate`
отклоняются, пока процесс работает.

### `maestro_benchmark_file`

Отдаёт сгенерированный файл примера **поисковой** части для просмотра: имя,
размер, MIME-тип, путь и, если файл не больше примерно 1,4 МБ, содержимое в
base64. Файлы закрытой части не отдаются.

### `maestro_benchmark_models`

Какие провайдеры доступны: статус Codex, причина, если он недоступен, его
модели и модель по умолчанию; модель чата; провайдер по умолчанию.

### `maestro_benchmark_dataset`

Готовит поисковую часть версии (`dataset_id`, `bf_<16 hex>.v<N>`) как
артефакт набора для эволюции и возвращает настройки оценщика: `binary_match`
с `equality` или `regexp` либо критерий с `LLM judge (0..1)`. Отказывает для
задач с инструментами, файлов, непереносимых проверок и версий, где в поиске
меньше 2 примеров.

### Смежные инструменты

- `maestro_find_artifacts`: находит цепочки и версии наборов по словам
  (*«последний набор»*), возвращает ссылки `dataset:<id>`.
- `maestro_evolution_prepare`: готовит цепочку и набор по этим ссылкам.
- `maestro_dataset_import`: импортирует CSV/TSV/XLSX из папки проекта как
  набор для эволюции. См.
  [Импорт своего файла](/ru/care/autobench/evolution/#импорт-своего-файла).

## Хранилище

Процессы, примеры, спецификации, программы и версии наборов лежат в
локальном файле SQLite:

```bash
# по умолчанию
~/.local/state/care/benchmark-factory/factory.sqlite3
# сгенерированные файлы входа
~/.local/state/care/benchmark-factory/assets/<run_id>/
# другой путь к хранилищу
export CARE_BENCHMARK_FACTORY_DB=/path/to/factory.sqlite3
```

Доступ к модели хранится только в памяти процесса и в хранилище не
записывается.
