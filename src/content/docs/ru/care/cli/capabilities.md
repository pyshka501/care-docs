---
title: Маркетплейс, эволюция и справка
description: Поиск по маркетплейсу навыков, эволюция сохранённой цепочки, справка и таблица CLI ↔ TUI.
sidebar:
  order: 6
---

## `maestro marketplace "<query>"`

Ищет общие `agent_skill` в Memory.

```bash
maestro marketplace "pdf extraction" --top-k 5 --deep
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `--top-k N` | `10` | Максимум результатов. |
| `--min-score F` | — | Отбросить результаты ниже этой релевантности. |
| `--tag T` | — | Обязательный тег (можно повторять, логика AND). |
| `--namespace NS` | — | Искать в одном namespace Memory. |
| `--deep` | выкл. | Искать ещё и по `skill_instructions` (медленнее, полнее). |
| `--json` | выкл. | JSON вместо текста. |

## `maestro evolve <chain_id>`

Отправляет в Platform эволюцию сохранённой цепочки (seed), может следить за ней и
принять победителя. Эволюция делает много вызовов модели. Даже запуск с
параметрами по умолчанию тратит реальные токены.

```bash
maestro evolve weather --iterations 8 --population 12 --wait --accept
maestro evolve weather --test-data-path /abs/eval.jsonl \
  --validation-type "Binary (0/1)" --binary-method substring --wait
maestro evolve weather --objective accuracy --objective brevity \
  --validation-criteria "Reward concise, correct answers" --wait --json
```

| Флаг | По умолчанию | Назначение |
| --- | --- | --- |
| `--mode full_chain\|per_step` | `full_chain` | Режим эволюции. |
| `--iterations N` | `5` | Максимум поколений. |
| `--population N` | `8` | Размер популяции в поколении. |
| `--validation-criteria TEXT` | — | Промпт для судьи-валидатора. |
| `--validation-type` | `Continuous (0..1)` | `Continuous (0..1)` или `Binary (0/1)` (значение в кавычках). |
| `--metric` | `ROUGE-L` | Метрика для continuous: `ROUGE-1`, `ROUGE-2`, `ROUGE-L`, `BERTScore`, `BLEU`. |
| `--binary-method` | — | Для `Binary (0/1)`: `equality`, `substring` или `regexp`. |
| `--target-column NAME` | `expected` | Колонка датасета с эталоном. |
| `--objective NAME` | — | Цель многокритериальной функции приспособленности (можно повторять). |
| `--test-data-path PATH` | — | Тестовые данные для оценки. |
| `--threshold F` | — | Порог для ранней остановки. |
| `--wait` | выкл. | Следить за потоком событий и печатать прогресс по поколениям до конца. |
| `--accept` | выкл. | После `--wait` продвинуть лучшую особь. Без `--wait` код выхода `2`. |
| `--json` | выкл. | JSON-сводка вместо текста. |

Без `--wait` команда отправляет запуск и возвращает его id. Приложение покрывает
больше, чем эта команда: поиск цепочки и датасета по названию, радар запуска IdeaL
и принудительную подачу идеи в идущую эволюцию.

## `maestro help`

Показывает туториал и шпаргалку клавиш.

```bash
maestro help --markdown
maestro help --category library
maestro help --screen LibraryScreen
maestro help --commands
```

| Флаг | Назначение |
| --- | --- |
| `--markdown` | Вывести Markdown вместо обычного текста. |
| `--category global\|library\|generation\|execution\|evolution` | Оставить привязки одной категории. |
| `--screen NAME` | Оставить привязки одного экрана TUI (например, `LibraryScreen`). |
| `--commands` | Таблица соответствия CLI и интерактивных интерфейсов вместо туториала. |

### `--commands`: чему соответствует каждая подкоманда

`maestro help --commands` берёт список подкоманд из живого парсера и для каждой
печатает ближайший интерактивный аналог: slash-команду, экран или модальное окно
TUI либо «прямого аналога нет». Отдельно отмечено, где одноимённая slash-команда
работает иначе. Например:

- `/promote` добавляет проверку перед релизом; `maestro promote` переводит канал сразу.
- `/remember` сливает заметку с помощью модели; `maestro remember` хранит её как есть.
- `/rollback` умеет откатить на одну версию назад; `maestro rollback` требует `--to`.
- `/export` сохраняет транскрипт чата; `maestro export` упаковывает цепочки библиотеки.

В конце список slash-команд без одноимённой команды CLI: `/artifacts`, `/library`,
`/mode`, `/upload`, `/evolution`, `/theme` и другие.

:::tip
Большинство команд чтения принимают `--json`, команды чтения Memory — `--channel`
(по умолчанию `latest`). У `doctor`, `init`, `migrate-secrets`, `help`, `export`,
`deploy`, `rollback`, `promote` и `forget` флага `--json` нет.
:::
