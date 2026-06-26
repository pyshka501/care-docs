---
title: Возможности и эволюция
description: Поиск в маркетплейсе, эволюция цепочек и вывод справки.
sidebar:
  order: 6
---

## `care marketplace "<query>"`

Поиск общих листингов `agent_skill` в Memory.

```bash
care marketplace "pdf extraction"
```

## `care evolve <chain_id>`

Отправить эволюционный запуск для цепочки, наблюдать за ним и опционально принять
победителя — терминальный аналог экрана Эволюции.

```bash
care evolve my-chain --wait --accept
```

| Флаг | Назначение |
| --- | --- |
| `--wait` | Блокировать до завершения запуска. |
| `--accept` | Продвинуть лучшую особь в стабильный канал. |

## `care help`

Вывести туториал + шпаргалку по клавишам.

```bash
care help --markdown
care help --category library
care help --screen LibraryScreen
care help --commands
```

| Флаг | Назначение |
| --- | --- |
| `--markdown` | Вывести Markdown (быстрый справочник из README) вместо стилизованного текста. |
| `--category global\|library\|generation\|execution\|evolution` | Ограничить список биндингов одной категорией. |
| `--screen NAME` | Ограничить биндинги одним экраном (например, `LibraryScreen`). |
| `--commands` | Вывести таблицу соответствия CLI ↔ TUI вместо туториала (см. ниже). |

### `--commands` — таблица соответствия CLI ↔ TUI

`care help --commands` выводит таблицу соответствия подкоманд и команд экранов:
каждая headless-подкоманда в паре со своим TUI-аналогом (`care run ↔ /run`,
`care evolve ↔ /evolve` и так далее). Список подкоманд берётся прямо из парсера
argparse, поэтому он не может разойтись с реальным CLI. После аналогов идут
команды, которые пока доступны только в TUI: `/upload`, `/tour`, `/settings` и
`/theme`. Удобно, чтобы проверить, можно ли выполнить нужное действие экрана
headless-скриптом.

Запустите `care <команда> --help` для полного набора флагов.
